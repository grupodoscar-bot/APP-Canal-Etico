import { IsString, IsOptional, IsNumber, IsBoolean, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'ART001' }) @IsString() code: string;
  @ApiProperty({ example: 'Café solo' }) @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shortName?: string;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() salePrice?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() costPrice?: number;
  @ApiPropertyOptional({ default: 21 }) @IsOptional() @IsNumber() vatRate?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() familyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() trackStock?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() currentStock?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() minStock?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional({ description: 'TPV button color hex' }) @IsOptional() @IsString() tpvColor?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() sortOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() showInWeb?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() webDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() legacyId?: string;
}
