import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private tenants: TenantsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current tenant info' })
  async getMyTenant(@CurrentUser() user: JwtPayload) {
    return this.tenants.findOne(user.tenantId);
  }

  @Patch('me')
  @Roles('admin')
  @ApiOperation({ summary: 'Update current tenant info (admin only)' })
  async updateMyTenant(@CurrentUser() user: JwtPayload, @Body() dto: UpdateTenantDto) {
    return this.tenants.update(user.tenantId, dto);
  }
}
