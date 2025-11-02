import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class UpdateBuyItemInput {
  @ApiProperty()
  productId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ required: false })
  @IsNumber()
  price?: number;
}

export class UpdateBuyItemsDto {
  @ApiProperty({ type: [UpdateBuyItemInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateBuyItemInput)
  items!: UpdateBuyItemInput[];
}

