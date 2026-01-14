import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('team')
  team(@Req() req: any) {
    return this.users.listTeamMembers(req.user.userId);
  }

  @Post('team')
  addMember(@Req() req: any, @Body() dto: CreateTeamMemberDto) {
    return this.users.createTeamMember(req.user.userId, dto);
  }

  @Patch('team/:memberId')
  updateMember(@Req() req: any, @Param('memberId') memberId: string, @Body() dto: UpdateTeamMemberDto) {
    return this.users.updateTeamMember(req.user.userId, memberId, dto);
  }

  @Delete('team/:memberId')
  removeMember(@Req() req: any, @Param('memberId') memberId: string) {
    return this.users.removeTeamMember(req.user.userId, memberId);
  }

  @Post('me/change-password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.users.changePassword(req.user.userId, dto.currentPassword, dto.newPassword);
  }

  @Get('me/login-activity')
  loginActivity(@Req() req: any, @Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : undefined;
    const safeLimit = parsed && !Number.isNaN(parsed) ? parsed : undefined;
    return this.users.getLoginActivity(req.user.userId, safeLimit);
  }
}
