import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OpenCashSessionDto } from './dto/open-cash-session.dto';
import { CloseCashSessionDto } from './dto/close-cash-session.dto';

@Injectable()
export class CashSessionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.cashSession.findMany({
      where: { tenantId },
      orderBy: { openedAt: 'desc' },
      take: 50,
      include: {
        openedBy: { select: { id: true, name: true } },
        closedBy: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const session = await this.prisma.cashSession.findFirst({
      where: { id, tenantId },
      include: {
        openedBy: { select: { id: true, name: true } },
        closedBy: { select: { id: true, name: true } },
        sales: { include: { lines: true } },
      },
    });
    if (!session) throw new NotFoundException('Cash session not found');
    return session;
  }

  async open(tenantId: string, dto: OpenCashSessionDto, userId: string) {
    // Check if there's already an open session for this terminal
    const existing = await this.prisma.cashSession.findFirst({
      where: { tenantId, terminalId: dto.terminalId || 'TPV-1', closedAt: null },
    });
    if (existing) throw new BadRequestException('There is already an open session for this terminal');

    return this.prisma.cashSession.create({
      data: {
        tenantId,
        terminalId: dto.terminalId || 'TPV-1',
        openedById: userId,
        openingAmount: dto.openingAmount || 0,
      },
    });
  }

  async close(tenantId: string, id: string, dto: CloseCashSessionDto, userId: string) {
    const session = await this.findOne(tenantId, id);
    if (session.closedAt) throw new BadRequestException('Session already closed');

    // Calculate totals from sales
    const sales = await this.prisma.sale.findMany({
      where: { cashSessionId: id },
    });

    const totalCash = sales
      .filter(s => s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + Number(s.total), 0);
    const totalCard = sales
      .filter(s => s.paymentMethod === 'card')
      .reduce((sum, s) => sum + Number(s.total), 0);
    const expectedCash = Number(session.openingAmount) + totalCash;

    return this.prisma.cashSession.update({
      where: { id },
      data: {
        closedAt: new Date(),
        closedById: userId,
        closingAmount: dto.closingAmount,
        expectedCash,
        difference: dto.closingAmount - expectedCash,
        totalCash,
        totalCard,
        numSales: sales.length,
      },
    });
  }
}
