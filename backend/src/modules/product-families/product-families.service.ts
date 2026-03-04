import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateProductFamilyDto } from './dto/create-product-family.dto';
import { UpdateProductFamilyDto } from './dto/update-product-family.dto';

@Injectable()
export class ProductFamiliesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.productFamily.findMany({
      where: { tenantId, isActive: true },
      include: { children: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const f = await this.prisma.productFamily.findFirst({
      where: { id, tenantId },
      include: { children: true, products: { where: { isActive: true } } },
    });
    if (!f) throw new NotFoundException('Product family not found');
    return f;
  }

  async create(tenantId: string, dto: CreateProductFamilyDto) {
    const existing = await this.prisma.productFamily.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code } },
    });
    if (existing) throw new ConflictException('Family code already exists');
    return this.prisma.productFamily.create({ data: { ...dto, tenantId } });
  }

  async update(tenantId: string, id: string, dto: UpdateProductFamilyDto) {
    await this.findOne(tenantId, id);
    return this.prisma.productFamily.update({ where: { id }, data: dto });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.productFamily.update({ where: { id }, data: { isActive: false } });
    return { message: 'Family deactivated' };
  }
}
