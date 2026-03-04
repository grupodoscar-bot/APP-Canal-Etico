import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@empresa.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Juan García' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'user', enum: ['admin', 'user', 'cashier'] })
  @IsOptional()
  @IsIn(['admin', 'user', 'cashier'])
  role?: string;
}
