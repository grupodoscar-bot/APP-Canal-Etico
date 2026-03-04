import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CloseCashSessionDto {
  @ApiProperty({ description: 'Actual cash amount counted at closing' })
  @IsNumber()
  closingAmount: number;
}
