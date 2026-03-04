import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: PaginationDto) {
    const { page = 1, limit = 20, search, sortBy = 'name', sortOrder = 'asc' } = query;
    const where: any = { tenantId, isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { taxId: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where, orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.supplier.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  async findOne(tenantId: string, id: string) {
    const s = await this.prisma.supplier.findFirst({ where: { id, tenantId } });
    if (!s) throw new NotFoundException('Supplier not found');
    return s;
  }

  async create(tenantId: string, dto: CreateSupplierDto, userId: string) {
    const existing = await this.prisma.supplier.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code } },
    });
    if (existing) throw new ConflictException('Supplier code already exists');
    return this.prisma.supplier.create({ data: { ...dto, tenantId, createdBy: userId } });
  }

  async update(tenantId: string, id: string, dto: UpdateSupplierDto, userId: string) {
    await this.findOne(tenantId, id);
    return this.prisma.supplier.update({ where: { id }, data: { ...dto, updatedBy: userId } });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.supplier.update({ where: { id }, data: { isActive: false } });
    return { message: 'Supplier deactivated' };
  }
}
