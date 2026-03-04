import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: PaginationDto & { familyId?: string }) {
    const { page = 1, limit = 20, search, sortBy = 'name', sortOrder = 'asc', familyId } = query;
    const where: any = { tenantId, isActive: true };
    if (familyId) where.familyId = familyId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where, orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit, take: limit,
        include: { family: { select: { id: true, name: true } } },
      }),
      this.prisma.product.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  async findOne(tenantId: string, id: string) {
    const p = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: { family: true },
    });
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  async create(tenantId: string, dto: CreateProductDto, userId: string) {
    const existing = await this.prisma.product.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code } },
    });
    if (existing) throw new ConflictException('Product code already exists');
    return this.prisma.product.create({
      data: { ...dto, tenantId, createdBy: userId },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateProductDto, userId: string) {
    await this.findOne(tenantId, id);
    return this.prisma.product.update({ where: { id }, data: { ...dto, updatedBy: userId } });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.product.update({ where: { id }, data: { isActive: false } });
    return { message: 'Product deactivated' };
  }
}
