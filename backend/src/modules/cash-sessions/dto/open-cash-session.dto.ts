import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class OpenCashSessionDto {
  @ApiPropertyOptional({ default: 'TPV-1' }) @IsOptional() @IsString() terminalId?: string;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() openingAmount?: number;
}
