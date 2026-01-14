import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

const ROLES = ['owner', 'admin', 'member'] as const;

export class CreateTeamMemberDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  temporaryPassword: string;

  @IsOptional()
  @IsIn(ROLES as unknown as string[])
  role?: (typeof ROLES)[number];
}
