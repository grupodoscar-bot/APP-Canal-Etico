import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CashSessionsService } from './cash-sessions.service';
import { OpenCashSessionDto } from './dto/open-cash-session.dto';
import { CloseCashSessionDto } from './dto/close-cash-session.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Cash Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cash-sessions')
export class CashSessionsController {
  constructor(private cashSessions: CashSessionsService) {}

  @Get()
  @ApiOperation({ summary: 'List cash sessions' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.cashSessions.findAll(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cash session with sales' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.cashSessions.findOne(user.tenantId, id);
  }

  @Post('open')
  @ApiOperation({ summary: 'Open a new cash session' })
  open(@CurrentUser() user: JwtPayload, @Body() dto: OpenCashSessionDto) {
    return this.cashSessions.open(user.tenantId, dto, user.sub);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close a cash session' })
  close(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CloseCashSessionDto,
  ) {
    return this.cashSessions.close(user.tenantId, id, dto, user.sub);
  }
}
