import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Amount received or paid. Must be positive.' })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ description: 'Customer the money came from (incoming payments).' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Vendor the money went to (outgoing payments).' })
  @IsOptional()
  @IsString()
  vendorId?: string;

  @ApiPropertyOptional({ description: 'Settle one specific sale. Omit to spread across unpaid invoices, oldest first.' })
  @IsOptional()
  @IsString()
  sellId?: string;

  @ApiPropertyOptional({ description: 'Settle one specific purchase.' })
  @IsOptional()
  @IsString()
  buyId?: string;

  @ApiPropertyOptional({ description: 'Defaults to now.' })
  @IsOptional()
  @IsISO8601()
  date?: string;

  @ApiPropertyOptional({ enum: ['cash', 'bank', 'mobile', 'cheque', 'other'] })
  @IsOptional()
  @IsIn(['cash', 'bank', 'mobile', 'cheque', 'other'])
  method?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
