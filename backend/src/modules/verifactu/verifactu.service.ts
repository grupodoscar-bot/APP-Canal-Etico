import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface HashParams {
  previousHash: string;
  series: string;
  number: string;
  date: string; // YYYY-MM-DD
  total: string; // Fixed 2 decimals e.g. "121.00"
}

export interface QrParams {
  nif: string;
  invoiceNumber: string;
  date: string;
  total: string;
}

@Injectable()
export class VerifactuService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate SHA-256 hash for Verifactu invoice chaining.
   * Formula: SHA256(previousHash + series + number + date + total)
   */
  generateHash(params: HashParams): string {
    const { previousHash, series, number, date, total } = params;
    const input = `${previousHash}${series}${number}${date}${total}`;
    return createHash('sha256').update(input, 'utf8').digest('hex');
  }

  /**
   * Generate AEAT verification QR URL.
   */
  generateQrUrl(params: QrParams): string {
    const { nif, invoiceNumber, date, total } = params;
    return `https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?nif=${encodeURIComponent(nif)}&numserie=${encodeURIComponent(invoiceNumber)}&fecha=${encodeURIComponent(date)}&importe=${encodeURIComponent(total)}`;
  }

  /**
   * Generate XML for AEAT SuministroLRFacturasEmitidas submission.
   */
  generateXml(invoice: any, tenant: any): string {
    const lines = invoice.lines || [];
    const taxBreakdown = this.calculateTaxBreakdown(lines);

    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:siiRL="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SusFacturasEmitidas.xsd">
  <soapenv:Header/>
  <soapenv:Body>
    <siiRL:SuministroLRFacturasEmitidas>
      <siiRL:Cabecera>
        <siiRL:IDVersionSii>2.1</siiRL:IDVersionSii>
        <siiRL:Titular>
          <siiRL:NombreRazon>${this.escapeXml(tenant.companyName)}</siiRL:NombreRazon>
          <siiRL:NIF>${this.escapeXml(tenant.nif)}</siiRL:NIF>
        </siiRL:Titular>
        <siiRL:TipoComunicacion>A0</siiRL:TipoComunicacion>
      </siiRL:Cabecera>
      <siiRL:RegistroLRFacturasEmitidas>
        <siiRL:PeriodoLiquidacion>
          <siiRL:Ejercicio>${new Date(invoice.date).getFullYear()}</siiRL:Ejercicio>
          <siiRL:Periodo>${String(new Date(invoice.date).getMonth() + 1).padStart(2, '0')}</siiRL:Periodo>
        </siiRL:PeriodoLiquidacion>
        <siiRL:IDFactura>
          <siiRL:IDEmisorFactura>
            <siiRL:NIF>${this.escapeXml(tenant.nif)}</siiRL:NIF>
          </siiRL:IDEmisorFactura>
          <siiRL:NumSerieFacturaEmisor>${this.escapeXml(invoice.invoiceNumber)}</siiRL:NumSerieFacturaEmisor>
          <siiRL:FechaExpedicionFacturaEmisor>${this.formatDateForAeat(invoice.date)}</siiRL:FechaExpedicionFacturaEmisor>
        </siiRL:IDFactura>
        <siiRL:FacturaExpedida>
          <siiRL:TipoFactura>F1</siiRL:TipoFactura>
          <siiRL:ClaveRegimenEspecialOTrascendencia>01</siiRL:ClaveRegimenEspecialOTrascendencia>
          <siiRL:ImporteTotal>${Number(invoice.total).toFixed(2)}</siiRL:ImporteTotal>
          <siiRL:DescripcionOperacion>${this.escapeXml(invoice.description || 'Factura')}</siiRL:DescripcionOperacion>
          <siiRL:Contraparte>
            <siiRL:NombreRazon>${this.escapeXml(invoice.customerName)}</siiRL:NombreRazon>
            <siiRL:NIF>${this.escapeXml(invoice.customerTaxId || '')}</siiRL:NIF>
          </siiRL:Contraparte>
          <siiRL:TipoDesglose>
            <siiRL:DesgloseFactura>
              <siiRL:Sujeta>
                <siiRL:NoExenta>
                  <siiRL:TipoNoExenta>S1</siiRL:TipoNoExenta>
                  <siiRL:DesgloseIVA>${taxBreakdown}</siiRL:DesgloseIVA>
                </siiRL:NoExenta>
              </siiRL:Sujeta>
            </siiRL:DesgloseFactura>
          </siiRL:TipoDesglose>
        </siiRL:FacturaExpedida>
      </siiRL:RegistroLRFacturasEmitidas>
    </siiRL:SuministroLRFacturasEmitidas>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Submit invoice XML to AEAT (test or production).
   * Returns submission result.
   */
  async submitToAeat(tenantId: string, invoiceId: string, environment: string = 'test') {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: { lines: true, tenant: true },
    });

    if (!invoice) throw new Error('Invoice not found');

    const xml = this.generateXml(invoice, invoice.tenant);

    // Record submission
    const submission = await this.prisma.verifactuSubmission.create({
      data: {
        tenantId,
        environment,
        operationType: 'alta',
        documentType: 'invoice',
        documentId: invoiceId,
        documentNumber: invoice.invoiceNumber,
        documentDate: invoice.date,
        series: invoice.series,
        number: invoice.number,
        status: 'pending',
      },
    });

    // In test environment, simulate successful response
    if (environment === 'test') {
      const csvCode = `CSV-${Date.now()}`;
      await this.prisma.verifactuSubmission.update({
        where: { id: submission.id },
        data: {
          status: 'accepted',
          csvCode,
          receivedAt: new Date(),
          description: 'Aceptado en entorno de pruebas',
        },
      });

      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          verifactuSubmitted: true,
          verifactuStatus: 'accepted',
          status: 'issued',
        },
      });

      return { status: 'accepted', csvCode, submissionId: submission.id };
    }

    // TODO: Production AEAT endpoint integration
    // const aeatUrl = 'https://www1.agenciatributaria.gob.es/wlpl/SSII-FACT/ws/fe/SiiFactFEV2SOAP';
    // Implement SOAP call with certificate

    return { status: 'pending', submissionId: submission.id, xml };
  }

  /**
   * Get submission history for a document.
   */
  async getSubmissions(tenantId: string, documentId: string) {
    return this.prisma.verifactuSubmission.findMany({
      where: { tenantId, documentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private calculateTaxBreakdown(lines: any[]): string {
    const taxGroups: Record<string, { base: number; tax: number }> = {};
    for (const line of lines) {
      const rate = Number(line.taxRate);
      const key = rate.toFixed(2);
      if (!taxGroups[key]) taxGroups[key] = { base: 0, tax: 0 };
      taxGroups[key].base += Number(line.lineTotal);
      taxGroups[key].tax += Number(line.lineTotal) * rate / 100;
    }

    return Object.entries(taxGroups)
      .map(([rate, { base, tax }]) => `
                    <siiRL:DetalleIVA>
                      <siiRL:TipoImpositivo>${rate}</siiRL:TipoImpositivo>
                      <siiRL:BaseImponible>${base.toFixed(2)}</siiRL:BaseImponible>
                      <siiRL:CuotaRepercutida>${tax.toFixed(2)}</siiRL:CuotaRepercutida>
                    </siiRL:DetalleIVA>`)
      .join('');
  }

  private formatDateForAeat(date: Date | string): string {
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
