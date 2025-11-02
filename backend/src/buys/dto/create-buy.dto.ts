import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class BuyItemInput {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price!: number;
}

export class CreateBuyDto {
  @ApiPropertyOptional({ description: 'Optional vendor name' })
  @IsOptional()
  @IsString()
  vendorName?: string;

  @ApiPropertyOptional({ description: 'Optional vendor phone' })
  @IsOptional()
  @IsString()
  vendorPhone?: string;

  @ApiProperty({ type: [BuyItemInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BuyItemInput)
  items!: BuyItemInput[];

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

