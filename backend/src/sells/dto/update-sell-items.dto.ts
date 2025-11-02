import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class UpdateSellItemInput {
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

export class UpdateSellItemsDto {
  @ApiProperty({ type: [UpdateSellItemInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSellItemInput)
  items!: UpdateSellItemInput[];
}

