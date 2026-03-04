import { IsString, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvoiceLineDto {
  @ApiPropertyOptional() @IsOptional() @IsString() productId?: string;
  @ApiProperty({ example: 'Servicio de consultoría' }) @IsString() description: string;
  @ApiProperty({ example: 1 }) @IsNumber() quantity: number;
  @ApiProperty({ example: 100 }) @IsNumber() unitPrice: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() discountPercent?: number;
  @ApiProperty({ example: 21 }) @IsNumber() taxRate: number;
}

export class CreateInvoiceDto {
  @ApiProperty() @IsString() customerId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() series?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() date?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() discountAmount?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() withholdingTax?: number;

  @ApiProperty({ type: [CreateInvoiceLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceLineDto)
  lines: CreateInvoiceLineDto[];
}
