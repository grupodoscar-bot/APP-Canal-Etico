import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'admin@empresa.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Mi Empresa S.L.' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  // Tenant data
  @ApiProperty({ example: 'B12345678' })
  @IsString()
  nif: string;

  @ApiProperty({ example: 'Mi Empresa S.L.' })
  @IsString()
  companyName: string;

  @ApiPropertyOptional({ example: 'Mi Empresa' })
  @IsOptional()
  @IsString()
  tradeName?: string;

  @ApiProperty({ example: 'Calle Principal 1' })
  @IsString()
  addressLine1: string;

  @ApiProperty({ example: '28001' })
  @IsString()
  postalCode: string;

  @ApiProperty({ example: 'Madrid' })
  @IsString()
  city: string;
}
