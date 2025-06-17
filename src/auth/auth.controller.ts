import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Post,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '@prisma/client';
// Removed explicit ProcessEnv import and global declaration
import { CurrentUser } from './decorators/current-user.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuditLogService } from '../audit-log/audit-log.service';

@ApiTags('auth')
@Controller('auth')
// @UseGuards(ThrottlerGuard) // Temporarily disabled for testing
export class AuthController {
  private logger = new Logger('AuthController');
  constructor(
    private authService: AuthService,
    private auditLogService: AuditLogService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.log(`Registration attempt for ${registerDto.email}`);
    const user = await this.authService.register({
      email: registerDto.email,
      password: registerDto.password,
      fullName: registerDto.fullName,
      roleId: registerDto.role,
    });
    await this.auditLogService.log(user.id, 'REGISTER', { email: user.email });
    const { accessToken, refreshToken } = this.authService.login(user);
    return { accessToken, refreshToken, user: this.sanitizeUser(user) };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async login(
    @Body() loginDto: LoginDto,
    @Res() response: Response,
  ): Promise<any> {
    this.logger.log(`Login attempt for ${loginDto.email}`);
    try {
      if (!loginDto.email || !loginDto.password) {
        return response
          .status(HttpStatus.BAD_REQUEST)
          .header('Access-Control-Allow-Origin', 'http://localhost:3000')
          .header('Access-Control-Allow-Credentials', 'true')
          .json({
            message: 'Email and password are required',
            statusCode: HttpStatus.BAD_REQUEST,
          });
      }

      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
      );

      if (!user) {
        await this.auditLogService.log(null, 'LOGIN_FAIL', {
          email: loginDto.email,
          reason: 'Invalid credentials',
        });
        return response
          .status(HttpStatus.UNAUTHORIZED)
          .header('Access-Control-Allow-Origin', 'http://localhost:3000')
          .header('Access-Control-Allow-Credentials', 'true')
          .json({
            message: 'Email hoặc mật khẩu không đúng',
            statusCode: HttpStatus.UNAUTHORIZED,
          });
      }

      if (!user.isActive) {
        await this.auditLogService.log(user.id, 'LOGIN_FAIL', {
          email: loginDto.email,
          reason: 'Account is inactive',
        });
        return response
          .status(HttpStatus.FORBIDDEN)
          .header('Access-Control-Allow-Origin', 'http://localhost:3000')
          .header('Access-Control-Allow-Credentials', 'true')
          .json({
            message: 'Tài khoản đã bị khóa',
            statusCode: HttpStatus.FORBIDDEN,
          });
      }

      const { accessToken, refreshToken } = this.authService.login(user);

      // Set cookies if USE_COOKIE is true
      if (process.env.USE_COOKIE === 'true') {
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite:
            process.env.NODE_ENV === 'production'
              ? ('none' as const)
              : ('lax' as const),
        };

        response.cookie('accessToken', accessToken, {
          ...cookieOptions,
          maxAge: 1000 * 60 * 60, // 1 hour
        });

        response.cookie('refreshToken', refreshToken, {
          ...cookieOptions,
          path: '/auth/refresh',
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        });
      }

      await this.auditLogService.log(user.id, 'LOGIN_SUCCESS', {
        email: user.email,
      });

      return response
        .status(HttpStatus.OK)
        .header('Access-Control-Allow-Origin', 'http://localhost:3000')
        .header('Access-Control-Allow-Credentials', 'true')
        .json({
          accessToken,
          refreshToken,
          user: this.sanitizeUser(user),
          message: 'Đăng nhập thành công',
        });
    } catch (error) {
      this.logger.error(`Login error for ${loginDto.email}:`, error);
      await this.auditLogService.log(null, 'LOGIN_FAIL', {
        email: loginDto.email,
        error: (error as any).message,
      });

      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .header('Access-Control-Allow-Origin', 'http://localhost:3000')
        .header('Access-Control-Allow-Credentials', 'true')
        .json({
          message: 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        });
    }
  }

  @Post('login-supabase')
  @ApiOperation({ summary: 'Login using Supabase authentication' })
  @ApiResponse({ status: 200, description: 'Supabase login successful' })
  @ApiResponse({ status: 401, description: 'Invalid Supabase credentials' })
  async loginWithSupabase(
    @Body() loginDto: LoginDto,
    @Res() response: Response,
  ): Promise<any> {
    this.logger.log(`Supabase login attempt for ${loginDto.email}`);
    try {
      // Use the Supabase auth service directly
      const authData = await this.authService.authenticateWithSupabase(
        loginDto.email,
        loginDto.password,
      );

      if (!authData || !authData.user) {
        await this.auditLogService.log(null, 'SUPABASE_LOGIN_FAIL', {
          email: loginDto.email,
        });
        return response
          .status(HttpStatus.UNAUTHORIZED)
          .header('Access-Control-Allow-Origin', 'http://localhost:3000')
          .header('Access-Control-Allow-Credentials', 'true')
          .json({
            message: 'Invalid Supabase credentials',
            statusCode: HttpStatus.UNAUTHORIZED,
          });
      }

      // Log the successful login
      await this.auditLogService.log(
        authData.user.id,
        'SUPABASE_LOGIN_SUCCESS',
        {
          email: loginDto.email,
        },
      );

      // Return the Supabase session tokens along with user data
      return response
        .status(HttpStatus.OK)
        .header('Access-Control-Allow-Origin', 'http://localhost:3000')
        .header('Access-Control-Allow-Credentials', 'true')
        .json({
          accessToken: authData.session.access_token,
          refreshToken: authData.session.refresh_token,
          user: authData.user,
          message: 'Supabase login successful',
        });
    } catch (error: any) {
      this.logger.error(`Supabase login error for ${loginDto.email}:`, error);
      await this.auditLogService.log(null, 'SUPABASE_LOGIN_ERROR', {
        email: loginDto.email,
        error: error.message || 'Unknown error',
      });

      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .header('Access-Control-Allow-Origin', 'http://localhost:3000')
        .header('Access-Control-Allow-Credentials', 'true')
        .json({
          message: 'An error occurred during Supabase login',
          error: error.message || 'Unknown error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        });
    }
  }

  @Post('register-supabase')
  @ApiOperation({ summary: 'Register a new user via Supabase' })
  @ApiResponse({ status: 201, description: 'User registered in Supabase' })
  @ApiResponse({ status: 400, description: 'Registration failed' })
  async registerWithSupabase(
    @Body() registerDto: RegisterDto,
    @Res() response: Response,
  ): Promise<any> {
    this.logger.log(`Supabase registration attempt for ${registerDto.email}`);

    try {
      const registrationData = await this.authService.registerWithSupabase({
        email: registerDto.email,
        password: registerDto.password,
        fullName: registerDto.fullName,
        roleId: registerDto.role || 'customer-role-id',
      });

      if (!registrationData || !registrationData.user) {
        return response
          .status(HttpStatus.BAD_REQUEST)
          .header('Access-Control-Allow-Origin', 'http://localhost:3000')
          .header('Access-Control-Allow-Credentials', 'true')
          .json({
            message: 'Registration failed',
            statusCode: HttpStatus.BAD_REQUEST,
          });
      }

      // Log the successful registration
      await this.auditLogService.log(
        registrationData.user.id,
        'SUPABASE_REGISTER',
        { email: registerDto.email },
      );

      return response
        .status(HttpStatus.CREATED)
        .header('Access-Control-Allow-Origin', 'http://localhost:3000')
        .header('Access-Control-Allow-Credentials', 'true')
        .json({
          user: registrationData.user,
          session: registrationData.session,
          message: 'Successfully registered with Supabase',
        });
    } catch (error: any) {
      this.logger.error(
        `Supabase registration error for ${registerDto.email}:`,
        error,
      );

      await this.auditLogService.log(null, 'SUPABASE_REGISTER_FAIL', {
        email: registerDto.email,
        error: error.message || 'Unknown error',
      });

      return response
        .status(HttpStatus.BAD_REQUEST)
        .header('Access-Control-Allow-Origin', 'http://localhost:3000')
        .header('Access-Control-Allow-Credentials', 'true')
        .json({
          message: error.message || 'Registration failed',
          statusCode: HttpStatus.BAD_REQUEST,
        });
    }
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Refresh JWT token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  async refresh(@CurrentUser() user: User): Promise<AuthResponseDto> {
    this.logger.log(`Token refresh for user ${user.id}`);
    const { accessToken, refreshToken } =
      await this.authService.refreshToken(user);
    return { accessToken, refreshToken, user: this.sanitizeUser(user) };
  }

  @Post('refresh-supabase')
  @ApiOperation({ summary: 'Refresh Supabase tokens' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshSupabaseToken(
    @Body() body: { refreshToken: string },
    @Res() response: Response,
  ): Promise<any> {
    try {
      if (!body.refreshToken) {
        return response
          .status(HttpStatus.BAD_REQUEST)
          .header('Access-Control-Allow-Origin', 'http://localhost:3000')
          .header('Access-Control-Allow-Credentials', 'true')
          .json({
            message: 'Refresh token is required',
            statusCode: HttpStatus.BAD_REQUEST,
          });
      }

      const refreshData = await this.authService.refreshSupabaseToken(
        body.refreshToken,
      );

      // Log the successful token refresh
      await this.auditLogService.log(
        refreshData.user.id,
        'SUPABASE_TOKEN_REFRESH',
        { email: refreshData.user.email },
      );

      return response
        .status(HttpStatus.OK)
        .header('Access-Control-Allow-Origin', 'http://localhost:3000')
        .header('Access-Control-Allow-Credentials', 'true')
        .json({
          accessToken: refreshData.session.access_token,
          refreshToken: refreshData.session.refresh_token,
          user: refreshData.user,
          message: 'Tokens refreshed successfully',
        });
    } catch (error: any) {
      this.logger.error(`Supabase token refresh error:`, error);

      return response
        .status(HttpStatus.UNAUTHORIZED)
        .header('Access-Control-Allow-Origin', 'http://localhost:3000')
        .header('Access-Control-Allow-Credentials', 'true')
        .json({
          message: error.message || 'Failed to refresh tokens',
          statusCode: HttpStatus.UNAUTHORIZED,
        });
    }
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Request password reset email via Supabase' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async resetPassword(
    @Body() body: { email: string },
    @Res() response: Response,
  ): Promise<any> {
    try {
      if (!body.email) {
        return response
          .status(HttpStatus.BAD_REQUEST)
          .header('Access-Control-Allow-Origin', 'http://localhost:3000')
          .header('Access-Control-Allow-Credentials', 'true')
          .json({
            message: 'Email is required',
            statusCode: HttpStatus.BAD_REQUEST,
          });
      }

      // Get instance of SupabaseAuthService
      const supabaseAuthService = this.authService['supabaseAuthService'];
      await supabaseAuthService.resetPassword(body.email);

      // Log the password reset request
      await this.auditLogService.log(null, 'PASSWORD_RESET_REQUEST', {
        email: body.email,
      });

      return response
        .status(HttpStatus.OK)
        .header('Access-Control-Allow-Origin', 'http://localhost:3000')
        .header('Access-Control-Allow-Credentials', 'true')
        .json({
          message: 'Password reset email sent',
        });
    } catch (error: any) {
      this.logger.error(`Password reset error for ${body.email}:`, error);

      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .header('Access-Control-Allow-Origin', 'http://localhost:3000')
        .header('Access-Control-Allow-Credentials', 'true')
        .json({
          message: error.message || 'Failed to send password reset email',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        });
    }
  }

  @Post('verify-token')
  @ApiOperation({ summary: 'Verify a Supabase token and get user info' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async verifySupabaseToken(
    @Body() body: { accessToken: string },
    @Res() response: Response,
  ): Promise<any> {
    try {
      if (!body.accessToken) {
        return response
          .status(HttpStatus.BAD_REQUEST)
          .header('Access-Control-Allow-Origin', 'http://localhost:3000')
          .header('Access-Control-Allow-Credentials', 'true')
          .json({
            message: 'Access token is required',
            statusCode: HttpStatus.BAD_REQUEST,
          });
      }

      const userData = await this.authService.verifySupabaseToken(
        body.accessToken,
      );

      return response
        .status(HttpStatus.OK)
        .header('Access-Control-Allow-Origin', 'http://localhost:3000')
        .header('Access-Control-Allow-Credentials', 'true')
        .json({
          valid: true,
          user: userData,
        });
    } catch (error: any) {
      this.logger.error(`Token verification error:`, error);

      return response
        .status(HttpStatus.UNAUTHORIZED)
        .header('Access-Control-Allow-Origin', 'http://localhost:3000')
        .header('Access-Control-Allow-Credentials', 'true')
        .json({
          valid: false,
          message: error.message || 'Invalid token',
          statusCode: HttpStatus.UNAUTHORIZED,
        });
    }
  }

  @Post('sync-user')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Sync user data between Supabase and local database',
  })
  @ApiResponse({ status: 200, description: 'User data synchronized' })
  async syncUser(
    @CurrentUser() user: User,
    @Body() body: { supabaseToken: string },
    @Res() response: Response,
  ): Promise<any> {
    try {
      if (!body.supabaseToken) {
        return response
          .status(HttpStatus.BAD_REQUEST)
          .header('Access-Control-Allow-Origin', 'http://localhost:3000')
          .header('Access-Control-Allow-Credentials', 'true')
          .json({
            message: 'Supabase token is required',
            statusCode: HttpStatus.BAD_REQUEST,
          });
      }

      const syncedUser = await this.authService.syncUserWithSupabase(
        user.id,
        body.supabaseToken,
      );

      return response
        .status(HttpStatus.OK)
        .header('Access-Control-Allow-Origin', 'http://localhost:3000')
        .header('Access-Control-Allow-Credentials', 'true')
        .json({
          user: this.sanitizeUser(syncedUser),
          message: 'User data synchronized successfully',
        });
    } catch (error: any) {
      this.logger.error(`User sync error for user ${user.id}:`, error);

      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .header('Access-Control-Allow-Origin', 'http://localhost:3000')
        .header('Access-Control-Allow-Credentials', 'true')
        .json({
          message: error.message || 'Failed to sync user data',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        });
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @CurrentUser() user: User,
    @Res() response: Response,
  ): Promise<any> {
    this.logger.log(`Logout for user ${user.id}`);
    try {
      await this.authService.revokeTokens(user.id);
      if (process.env.USE_COOKIE === 'true') {
        response.clearCookie('accessToken');
        response.clearCookie('refreshToken');
      }
      await this.auditLogService.log(user.id, 'LOGOUT', {});
      return response.status(HttpStatus.OK).json({
        message: 'Logout successful',
      });
    } catch (error) {
      this.logger.error(`Logout error for user ${user.id}:`, error);
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'An error occurred during logout',
      });
    }
  }

  @Get('debug/token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Debug token information' })
  @ApiResponse({ status: 200, description: 'Token debug info' })
  debugToken(@CurrentUser() user: User, @Req() request: any): any {
    return {
      message: 'Token is valid',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: (user as any).role?.name || 'Unknown',
        isActive: user.isActive,
      },
      headers: {
        authorization: request.headers.authorization ? 'Present' : 'Missing',
        userAgent: request.headers['user-agent'],
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('check-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check JWT token validity' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  checkToken(@CurrentUser() user: User): { valid: boolean; user: any } {
    return {
      valid: true,
      user: this.sanitizeUser(user),
    };
  }

  // Phương thức để loại bỏ thông tin nhạy cảm trước khi trả về client
  private sanitizeUser(user: User): any {
    const { password, ...result } = user;
    return result;
  }
}
