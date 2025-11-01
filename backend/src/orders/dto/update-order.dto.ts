import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateOrderDto {
  @ApiPropertyOptional({ enum: ['pending', 'processing', 'delivered', 'cancelled'] })
  @IsOptional()
  @IsIn(['pending', 'processing', 'delivered', 'cancelled'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryAddress?: string;
}

