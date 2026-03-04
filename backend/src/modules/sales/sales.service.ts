import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { VerifactuService } from '../verifactu/verifactu.service';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private verifactu: VerifactuService,
  ) {}

  async findAll(tenantId: string, query: PaginationDto) {
    const { page = 1, limit = 20, search, sortBy = 'datetime', sortOrder = 'desc' } = query;
    const where: any = { tenantId, isActive: true };
    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.sale.findMany({
        where, orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit, take: limit,
        include: { lines: true },
      }),
      this.prisma.sale.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  async findOne(tenantId: string, id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, tenantId },
      include: { lines: true, customer: true },
    });
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  async create(tenantId: string, dto: CreateSaleDto, userId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new BadRequestException('Tenant not found');

    const series = tenant.saleSeries;
    const sequenceNum = tenant.nextSaleNum;
    const number = `${series}-${new Date().getFullYear()}-${String(sequenceNum).padStart(6, '0')}`;
    const date = new Date();

    const lines = dto.lines.map(line => {
      const subtotal = Number(line.quantity) * Number(line.unitPrice);
      const discounted = subtotal * (1 - Number(line.discountPercent || 0) / 100);
      const lineTotal = Math.round(discounted * 100) / 100;
      return { ...line, lineTotal };
    });

    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const taxAmount = lines.reduce((sum, l) => sum + (l.lineTotal * Number(l.taxRate) / 100), 0);
    const total = Math.round((subtotal + taxAmount) * 100) / 100;

    const previousSale = await this.prisma.sale.findFirst({
      where: { tenantId, series },
      orderBy: { sequenceNum: 'desc' },
    });

    const verifactuHash = this.verifactu.generateHash({
      previousHash: previousSale?.verifactuHash || '',
      series,
      number: String(sequenceNum),
      date: date.toISOString().split('T')[0],
      total: total.toFixed(2),
    });

    const verifactuQr = this.verifactu.generateQrUrl({
      nif: tenant.nif,
      invoiceNumber: number,
      date: date.toISOString().split('T')[0],
      total: total.toFixed(2),
    });

    const sale = await this.prisma.$transaction(async (tx) => {
      const s = await tx.sale.create({
        data: {
          tenantId,
          customerId: dto.customerId,
          number,
          series,
          sequenceNum,
          date,
          subtotal,
          discountAmount: dto.discountAmount || 0,
          taxAmount,
          total,
          paymentMethod: dto.paymentMethod,
          payments: dto.payments,
          verifactuHash,
          verifactuQr,
          previousHash: previousSale?.verifactuHash,
          cashSessionId: dto.cashSessionId,
          createdBy: userId,
          lines: {
            create: lines.map(l => ({
              productId: l.productId,
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              discountPercent: l.discountPercent || 0,
              taxRate: l.taxRate,
              lineTotal: l.lineTotal,
            })),
          },
        },
        include: { lines: true },
      });

      await tx.tenant.update({
        where: { id: tenantId },
        data: { nextSaleNum: { increment: 1 } },
      });

      return s;
    });

    return sale;
  }
}
