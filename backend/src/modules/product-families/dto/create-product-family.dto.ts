import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductFamilyDto {
  @ApiProperty({ example: 'FAM01' }) @IsString() code: string;
  @ApiProperty({ example: 'Alimentación' }) @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() legacyId?: string;
}
