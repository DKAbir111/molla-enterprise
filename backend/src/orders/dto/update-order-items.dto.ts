import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class UpdateOrderItemInput {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  price?: number;
}

export class UpdateOrderItemsDto {
  @ApiProperty({ type: [UpdateOrderItemInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemInput)
  items!: UpdateOrderItemInput[];
}

