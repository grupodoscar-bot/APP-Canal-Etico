import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private customers: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List customers with pagination and search' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: PaginationDto) {
    return this.customers.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.customers.findOne(user.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create customer' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCustomerDto) {
    return this.customers.create(user.tenantId, dto, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer' })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customers.update(user.tenantId, id, dto, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate customer' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.customers.remove(user.tenantId, id);
  }
}
