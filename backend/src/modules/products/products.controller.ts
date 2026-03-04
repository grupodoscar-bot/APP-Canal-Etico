import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products with pagination, search and family filter' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: PaginationDto,
    @Query('familyId') familyId?: string,
  ) {
    return this.products.findAll(user.tenantId, { ...query, familyId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.products.findOne(user.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create product' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProductDto) {
    return this.products.create(user.tenantId, dto, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(user.tenantId, id, dto, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate product' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.products.remove(user.tenantId, id);
  }
}
