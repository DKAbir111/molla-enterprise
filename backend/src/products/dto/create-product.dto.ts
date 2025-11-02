import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  grade?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Buying price per unit' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  buyPrice?: number;

  @ApiPropertyOptional({ description: 'Target sell price per unit' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  targetPrice?: number;

  @ApiProperty()
  @IsString()
  unit: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether product is active/visible' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
