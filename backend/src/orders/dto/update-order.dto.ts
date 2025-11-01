import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateOrderDto {
  @ApiPropertyOptional({ enum: ['pending', 'processing', 'delivered', 'cancelled'] })
  @IsOptional()
  @IsIn(['pending', 'processing', 'delivered', 'cancelled'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

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
