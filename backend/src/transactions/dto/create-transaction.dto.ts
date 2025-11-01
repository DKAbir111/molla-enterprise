import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ['income', 'expense'] })
  @IsIn(['income', 'expense'])
  type: 'income' | 'expense';

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ description: 'ISO date string' })
  @IsOptional()
  date?: string;
}

