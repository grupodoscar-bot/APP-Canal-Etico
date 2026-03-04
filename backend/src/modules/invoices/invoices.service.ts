import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { VerifactuService } from '../verifactu/verifactu.service';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private verifactu: VerifactuService,
  ) {}

  async findAll(tenantId: string, query: PaginationDto & { status?: string }) {
    const { page = 1, limit = 20, search, sortBy = 'date', sortOrder = 'desc', status } = query;
    const where: any = { tenantId, isActive: true };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where, orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit, take: limit,
        include: { lines: true },
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  async findOne(tenantId: string, id: string) {
    const inv = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: { lines: true, customer: true },
    });
    if (!inv) throw new NotFoundException('Invoice not found');
    return inv;
  }

  async create(tenantId: string, dto: CreateInvoiceDto, userId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId },
    });
    if (!customer) throw new BadRequestException('Customer not found');

    // Get tenant for series and next number
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new BadRequestException('Tenant not found');

    const series = dto.series || tenant.invoiceSeries;
    const number = tenant.nextInvoiceNum;
    const invoiceNumber = `${series}-${String(number).padStart(6, '0')}`;
    const date = dto.date ? new Date(dto.date) : new Date();

    // Calculate line totals
    const lines = dto.lines.map(line => {
      const subtotal = Number(line.quantity) * Number(line.unitPrice);
      const discounted = subtotal * (1 - Number(line.discountPercent || 0) / 100);
      const lineTotal = Math.round(discounted * 100) / 100;
      return { ...line, lineTotal };
    });

    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const taxAmount = lines.reduce((sum, l) => sum + (l.lineTotal * Number(l.taxRate) / 100), 0);
    const total = Math.round((subtotal + taxAmount) * 100) / 100;

    // Get previous invoice hash for chaining
    const previousInvoice = await this.prisma.invoice.findFirst({
      where: { tenantId, series },
      orderBy: { number: 'desc' },
    });

    const verifactuHash = this.verifactu.generateHash({
      previousHash: previousInvoice?.verifactuHash || '',
      series,
      number: String(number),
      date: date.toISOString().split('T')[0],
      total: total.toFixed(2),
    });

    const verifactuQr = this.verifactu.generateQrUrl({
      nif: tenant.nif,
      invoiceNumber,
      date: date.toISOString().split('T')[0],
      total: total.toFixed(2),
    });

    const invoice = await this.prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          tenantId,
          customerId: customer.id,
          series,
          number,
          invoiceNumber,
          date,
          customerName: customer.name,
          customerAddress: customer.addressLine1,
          customerTaxId: customer.taxId,
          subtotal,
          discountAmount: dto.discountAmount || 0,
          taxAmount,
          total,
          withholdingTax: dto.withholdingTax || 0,
          verifactuHash,
          verifactuQr,
          previousSeries: previousInvoice?.series,
          previousNumber: previousInvoice?.number,
          previousDate: previousInvoice?.date,
          previousHash: previousInvoice?.verifactuHash,
          description: dto.description,
          status: 'draft',
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
        data: { nextInvoiceNum: { increment: 1 } },
      });

      return inv;
    });

    return invoice;
  }

  async issue(tenantId: string, id: string) {
    const invoice = await this.findOne(tenantId, id);
    if (invoice.status !== 'draft') {
      throw new BadRequestException('Invoice is not in draft status');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'issued' },
      include: { lines: true },
    });
  }

  async getPdfData(tenantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: { lines: true, customer: true, tenant: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }
}
