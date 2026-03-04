import { Builder } from 'xml2js';
import { Invoice } from '../models/Invoice';
import { CompanySettings } from '../models/User';
import { AEAT_ENDPOINTS } from '../utils/constants';

export interface AeatResponse {
  success: boolean;
  responseCode: string;
  message: string;
}

const xmlBuilder = new Builder({
  xmldec: { version: '1.0', encoding: 'UTF-8' },
  renderOpts: { pretty: true },
});

/**
 * Generates the XML payload for submitting an invoice record to AEAT.
 * Follows the SuministroLRFacturasEmitidas format for Verifactu.
 */
export function generateInvoiceXml(
  invoice: Invoice,
  company: CompanySettings,
): string {
  const xmlObj = {
    'soapenv:Envelope': {
      $: {
        'xmlns:soapenv': 'http://schemas.xmlsoap.org/soap/envelope/',
        'xmlns:siiLR': 'https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroLR.xsd',
        'xmlns:sii': 'https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroInformacion.xsd',
      },
      'soapenv:Header': {},
      'soapenv:Body': {
        'siiLR:SuministroLRFacturasEmitidas': {
          'sii:Cabecera': {
            'sii:IDVersionSii': '1.1',
            'sii:Titular': {
              'sii:NombreRazon': company.companyName,
              'sii:NIF': company.nif,
            },
            'sii:TipoComunicacion': 'A0',
          },
          'siiLR:RegistroLRFacturasEmitidas': {
            'sii:PeriodoLiquidacion': {
              'sii:Ejercicio': invoice.issueDate.substring(0, 4),
              'sii:Periodo': invoice.issueDate.substring(5, 7),
            },
            'siiLR:IDFactura': {
              'sii:IDEmisorFactura': {
                'sii:NIF': company.nif,
              },
              'sii:NumSerieFacturaEmisor': invoice.invoiceNumber,
              'sii:FechaExpedicionFacturaEmisor': formatDateForAeat(invoice.issueDate),
            },
            'siiLR:FacturaExpedida': {
              'sii:TipoFactura': 'F1',
              'sii:ClaveRegimenEspecialOTrascendencia': '01',
              'sii:DescripcionOperacion': invoice.description || 'Prestación de servicios',
              'sii:TipoDesglose': {
                'sii:DesgloseFactura': {
                  'sii:Sujeta': {
                    'sii:NoExenta': {
                      'sii:TipoNoExenta': 'S1',
                      'sii:DesgloseIVA': {
                        'sii:DetalleIVA': {
                          'sii:TipoImpositivo': '21.00',
                          'sii:BaseImponible': invoice.taxBase.toFixed(2),
                          'sii:CuotaRepercutida': invoice.totalVat.toFixed(2),
                        },
                      },
                    },
                  },
                },
              },
              'sii:Contraparte': {
                'sii:NombreRazon': invoice.clientName || '',
                'sii:NIF': invoice.clientNif || '',
              },
            },
            'siiLR:Huella': {
              'sii:Hash': invoice.hash,
              'sii:HashAnterior': invoice.previousHash,
              'sii:Fingerprint': invoice.fingerprint,
              'sii:SoftwareName': 'Verifactu',
              'sii:SoftwareVersion': '1.0.0',
            },
          },
        },
      },
    },
  };

  return xmlBuilder.buildObject(xmlObj);
}

/**
 * Sends the invoice to AEAT.
 * In production, this would make an actual HTTPS request with a digital certificate.
 * For now, it simulates the submission.
 */
export async function sendInvoiceToAeat(
  invoice: Invoice,
  company: CompanySettings,
  testMode: boolean = true,
): Promise<AeatResponse> {
  const _xml = generateInvoiceXml(invoice, company);
  const _endpoint = testMode ? AEAT_ENDPOINTS.testing : AEAT_ENDPOINTS.production;

  // TODO: In production, implement actual SOAP request with digital certificate
  // For now, simulate a successful response
  if (testMode) {
    return {
      success: true,
      responseCode: '0',
      message: 'Registro aceptado (modo pruebas)',
    };
  }

  // Production implementation would use fetch with client certificate
  // const response = await fetch(endpoint, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': '...' },
  //   body: xml,
  // });

  return {
    success: false,
    responseCode: '-1',
    message: 'Envío a producción no implementado. Configure el certificado digital.',
  };
}

function formatDateForAeat(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year}`;
}
