import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    register(dto: RegisterDto): Promise<{
        user: any;
        token: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: any;
        token: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        ok: boolean;
        token?: undefined;
    } | {
        ok: boolean;
        token: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        ok: boolean;
    }>;
    private sign;
    private sanitize;
}
