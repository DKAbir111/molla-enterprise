import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateBuyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  paidAmount?: number;

  @ApiPropertyOptional({ description: 'Transportation cost per trip' })
  @IsOptional()
  @IsNumber()
  transportPerTrip?: number;

  @ApiPropertyOptional({ description: 'Number of transportation trips' })
  @IsOptional()
  @IsNumber()
  transportTrips?: number;
}

