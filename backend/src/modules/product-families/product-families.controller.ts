import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductFamiliesService } from './product-families.service';
import { CreateProductFamilyDto } from './dto/create-product-family.dto';
import { UpdateProductFamilyDto } from './dto/update-product-family.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Product Families')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('product-families')
export class ProductFamiliesController {
  constructor(private families: ProductFamiliesService) {}

  @Get()
  @ApiOperation({ summary: 'List product families' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.families.findAll(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product family with children and products' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.families.findOne(user.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create product family' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProductFamilyDto) {
    return this.families.create(user.tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product family' })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateProductFamilyDto) {
    return this.families.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate product family' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.families.remove(user.tenantId, id);
  }
}
