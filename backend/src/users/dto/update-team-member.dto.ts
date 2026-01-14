import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

const ROLES = ['owner', 'admin', 'member'] as const;

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsIn(ROLES as unknown as string[])
  role?: (typeof ROLES)[number];
}
