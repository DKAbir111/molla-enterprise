import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class CreateDryingGainDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productId!: string

  @ApiProperty({ description: 'Dry quantity added to stock' })
  @IsInt()
  @Min(1)
  quantity!: number

  @ApiPropertyOptional({ description: 'Per-unit cost of the dried quantity; informational only' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string
}

