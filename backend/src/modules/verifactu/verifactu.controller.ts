import { Controller, Post, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { VerifactuService } from './verifactu.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Verifactu')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('verifactu')
export class VerifactuController {
  constructor(private verifactu: VerifactuService) {}

  @Post('submit/:invoiceId')
  @ApiOperation({ summary: 'Submit invoice to AEAT (Verifactu)' })
  async submit(
    @CurrentUser() user: JwtPayload,
    @Param('invoiceId') invoiceId: string,
    @Query('env') environment?: string,
  ) {
    return this.verifactu.submitToAeat(user.tenantId, invoiceId, environment || 'test');
  }

  @Get('submissions/:documentId')
  @ApiOperation({ summary: 'Get Verifactu submission history for a document' })
  async getSubmissions(
    @CurrentUser() user: JwtPayload,
    @Param('documentId') documentId: string,
  ) {
    return this.verifactu.getSubmissions(user.tenantId, documentId);
  }
}
