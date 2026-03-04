import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private invoices: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'List invoices with pagination and filters' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: PaginationDto,
    @Query('status') status?: string,
  ) {
    return this.invoices.findAll(user.tenantId, { ...query, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice with lines' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.invoices.findOne(user.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create invoice with hash chaining and QR (Verifactu)' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateInvoiceDto) {
    return this.invoices.create(user.tenantId, dto, user.sub);
  }

  @Post(':id/issue')
  @ApiOperation({ summary: 'Issue invoice (change status from draft to issued)' })
  issue(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.invoices.issue(user.tenantId, id);
  }

  @Get(':id/pdf-data')
  @ApiOperation({ summary: 'Get invoice data for PDF generation (includes tenant, customer, lines)' })
  getPdfData(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.invoices.getPdfData(user.tenantId, id);
  }
}
