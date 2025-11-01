import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, Min, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemInput {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  customerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  deliveryAddress?: string;

  @ApiProperty({ type: [OrderItemInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items: OrderItemInput[];

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
