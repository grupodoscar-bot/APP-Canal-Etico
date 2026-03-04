import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { AccessLogsService } from '../access-logs/access-logs.service';
import { Request } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private accessLogs: AccessLogsService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new tenant and admin user' })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const result = await this.auth.register(dto);
    await this.accessLogs.log({
      tenantId: result.tenant.id,
      userId: result.user.id,
      userEmail: result.user.email,
      userName: result.user.name,
      eventType: 'REGISTER',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });
    return result;
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email, password and tenant NIF' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const result = await this.auth.login(dto);
    await this.accessLogs.log({
      tenantId: result.tenant.id,
      userId: result.user.id,
      userEmail: result.user.email,
      userName: result.user.name,
      eventType: 'LOGIN',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });
    return result;
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  async logout(@CurrentUser() user: JwtPayload, @Req() req: Request) {
    await this.auth.logout(user.sub);
    await this.accessLogs.log({
      tenantId: user.tenantId,
      userId: user.sub,
      userEmail: user.email,
      eventType: 'LOGOUT',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile with tenant' })
  async me(@CurrentUser() user: JwtPayload) {
    return this.auth.getProfile(user.sub);
  }
}
