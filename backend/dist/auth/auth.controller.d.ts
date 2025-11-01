import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthController {
    private auth;
    constructor(auth: AuthService);
    register(dto: RegisterDto): Promise<{
        user: any;
        token: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: any;
        token: string;
    }>;
    forgot(dto: ForgotPasswordDto): Promise<{
        ok: boolean;
        token?: undefined;
    } | {
        ok: boolean;
        token: string;
    }>;
    reset(dto: ResetPasswordDto): Promise<{
        ok: boolean;
    }>;
}
