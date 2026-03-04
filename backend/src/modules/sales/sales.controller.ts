import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private sales: SalesService) {}

  @Get()
  @ApiOperation({ summary: 'List sales/tickets' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: PaginationDto) {
    return this.sales.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sale with lines' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.sales.findOne(user.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create sale/ticket with Verifactu hash and QR' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSaleDto) {
    return this.sales.create(user.tenantId, dto, user.sub);
  }
}
