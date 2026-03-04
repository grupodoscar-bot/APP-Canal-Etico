import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private suppliers: SuppliersService) {}

  @Get()
  @ApiOperation({ summary: 'List suppliers' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: PaginationDto) {
    return this.suppliers.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.suppliers.findOne(user.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create supplier' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSupplierDto) {
    return this.suppliers.create(user.tenantId, dto, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update supplier' })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliers.update(user.tenantId, id, dto, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate supplier' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.suppliers.remove(user.tenantId, id);
  }
}
