# 🔐 Authentication & Authorization Module

## 📋 Overview

The Authentication & Authorization module provides secure user management, JWT-based authentication, role-based access control, and comprehensive security features for the ICC Auto Travel platform.

## 🎯 Features

- **🔑 JWT Authentication** - Token-based authentication system
- **👥 Role-Based Access Control** - Multi-level authorization (Admin, Staff, Customer)
- **🔒 Password Security** - Bcrypt hashing with salt
- **🔄 Token Management** - Refresh token mechanism
- **🛡️ Security Guards** - NestJS guards for route protection
- **📱 Multi-Platform Support** - Web, mobile, and admin panel authentication
- **🌍 User Preferences** - Language and profile management
- **⏰ Session Management** - Token expiration and renewal
- **🔍 Audit Logging** - Security event tracking

## 📁 Module Structure

```
auth/
├── 📄 auth.module.ts               # Module configuration
├── 🎯 auth.service.ts              # Core authentication logic
├── 🎛️ auth.controller.ts           # REST API endpoints
├── 🌐 auth.resolver.ts             # GraphQL resolvers
├── 📋 dto/                         # Data Transfer Objects
│   ├── login.dto.ts
│   ├── register.dto.ts
│   ├── change-password.dto.ts
│   ├── forgot-password.dto.ts
│   └── refresh-token.dto.ts
├── 🛡️ guards/                      # Security guards
│   ├── jwt-auth.guard.ts
│   ├── jwt-refresh.guard.ts
│   ├── roles.guard.ts
│   └── local-auth.guard.ts
├── 🎨 decorators/                  # Custom decorators
│   ├── current-user.decorator.ts
│   ├── roles.decorator.ts
│   └── public.decorator.ts
├── 🔧 strategies/                  # Passport strategies
│   ├── jwt.strategy.ts
│   ├── jwt-refresh.strategy.ts
│   └── local.strategy.ts
├── 🔒 middleware/                  # Authentication middleware
│   └── auth.middleware.ts
└── 📊 interfaces/                  # Type definitions
    ├── jwt-payload.interface.ts
    ├── auth-response.interface.ts
    └── user-context.interface.ts
```

## 🔧 Core Components

### AuthService

The main service class that handles authentication business logic.

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditLogService: AuditLogService,
  ) {}

  // Authentication methods
  async validateUser(email: string, password: string): Promise<User | null>
  async login(user: User): Promise<AuthResponse>
  async register(registerDto: RegisterDto): Promise<AuthResponse>
  async refreshTokens(refreshToken: string): Promise<AuthResponse>
  async logout(userId: string): Promise<void>

  // Password management
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void>
  async forgotPassword(email: string): Promise<void>
  async resetPassword(token: string, newPassword: string): Promise<void>

  // Token management
  async generateTokens(user: User): Promise<TokenPair>
  async validateToken(token: string): Promise<JwtPayload>
  async revokeToken(token: string): Promise<void>

  // Security methods
  async hashPassword(password: string): Promise<string>
  async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean>
  async generateResetToken(): Promise<string>
}
```

### User Roles & Permissions

The system implements a hierarchical role-based access control:

#### 👨‍💼 ADMIN
- **Full System Access**: Complete control over all modules
- **User Management**: Create, update, delete users
- **Service Management**: Manage all travel services
- **Financial Access**: View all payments and invoices
- **System Configuration**: Modify system settings

#### 👨‍💻 STAFF
- **Operational Management**: Day-to-day operations
- **Booking Management**: Handle customer bookings
- **Customer Support**: Manage customer inquiries
- **Content Management**: Update service information
- **Limited Financial Access**: View assigned bookings

#### 👤 CUSTOMER
- **Personal Profile**: Manage own account and preferences
- **Booking Services**: Create and manage own bookings
- **Review System**: Leave reviews for services
- **Payment History**: View own transactions
- **Support Requests**: Submit support tickets

## 📊 Data Transfer Objects (DTOs)

### LoginDto
```typescript
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
```

### RegisterDto
```typescript
export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  })
  password: string;

  @IsOptional()
  @IsPhoneNumber('VN')
  phone?: string;

  @IsOptional()
  @IsIn(['vi', 'en', 'ko'])
  language?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
```

### ChangePasswordDto
```typescript
export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  })
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword: string;

  @Validate(PasswordMatchValidator)
  passwordMatch: boolean;
}
```

## 🛡️ Security Guards & Decorators

### JWT Authentication Guard
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }
    
    return super.canActivate(context);
  }
}
```

### Roles Guard
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

### Custom Decorators
```typescript
// Current User Decorator
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// Roles Decorator
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// Public Route Decorator
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

## 🔑 JWT Strategy & Configuration

### JWT Strategy
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return user;
  }
}
```

### Token Configuration
```typescript
interface TokenConfig {
  access: {
    secret: string;
    expiresIn: string; // '15m'
  };
  refresh: {
    secret: string;
    expiresIn: string; // '7d'
  };
  resetPassword: {
    secret: string;
    expiresIn: string; // '1h'
  };
}
```

## 🔌 API Endpoints

### REST API
```
POST   /auth/login                 # User login
POST   /auth/register              # User registration
POST   /auth/logout                # User logout
POST   /auth/refresh               # Refresh access token
POST   /auth/change-password       # Change password
POST   /auth/forgot-password       # Request password reset
POST   /auth/reset-password        # Reset password with token
GET    /auth/profile               # Get current user profile
PUT    /auth/profile               # Update user profile
GET    /auth/verify-email/:token   # Verify email address
```

### GraphQL API
```graphql
type AuthResponse {
  accessToken: String!
  refreshToken: String!
  user: User!
  expiresIn: Int!
  tokenType: String!
}

type User {
  id: ID!
  email: String!
  fullName: String!
  role: Role!
  isActive: Boolean!
  language: String!
  avatarUrl: String
  phone: String
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Mutation {
  login(input: LoginInput!): AuthResponse!
  register(input: RegisterInput!): AuthResponse!
  refreshToken(refreshToken: String!): AuthResponse!
  changePassword(input: ChangePasswordInput!): Boolean!
  forgotPassword(email: String!): Boolean!
  resetPassword(input: ResetPasswordInput!): Boolean!
  updateProfile(input: UpdateProfileInput!): User!
}

type Query {
  me: User!
  validateToken(token: String!): Boolean!
}
```

## 🔒 Password Security

### Password Hashing
```typescript
private readonly saltRounds = 12;

async hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, this.saltRounds);
}

async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
```

### Password Policy
```typescript
const passwordPolicy = {
  minLength: 6,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
  maxAttempts: 5,
  lockoutDuration: '15m',
};
```

## 📱 Multi-Platform Authentication

### Web Application
```typescript
// Standard JWT authentication for web clients
@Post('login')
@Public()
async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
  const user = await this.authService.validateUser(loginDto.email, loginDto.password);
  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }
  return this.authService.login(user);
}
```

### Mobile Application
```typescript
// Enhanced authentication for mobile with device tracking
@Post('mobile/login')
@Public()
async mobileLogin(
  @Body() loginDto: MobileLoginDto,
  @Headers('user-agent') userAgent: string,
  @Ip() ip: string,
): Promise<MobileAuthResponse> {
  const result = await this.authService.login(user);
  
  // Track device information
  await this.deviceService.registerDevice({
    userId: user.id,
    deviceId: loginDto.deviceId,
    platform: loginDto.platform,
    userAgent,
    ip,
  });
  
  return {
    ...result,
    deviceToken: await this.generateDeviceToken(user.id, loginDto.deviceId),
  };
}
```

## 🔍 Security Features

### Rate Limiting
```typescript
// Login rate limiting
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 5 attempts per minute
@Post('login')
async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
  // Login logic
}
```

### Audit Logging
```typescript
async login(user: User): Promise<AuthResponse> {
  const tokens = await this.generateTokens(user);
  
  // Log successful login
  await this.auditLogService.log({
    userId: user.id,
    action: 'LOGIN',
    entityType: 'User',
    entityId: user.id,
    metadata: {
      timestamp: new Date(),
      userAgent: this.request.headers['user-agent'],
      ip: this.request.ip,
    },
  });
  
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user,
    expiresIn: 900, // 15 minutes
    tokenType: 'Bearer',
  };
}
```

### Input Validation & Sanitization
```typescript
// Email sanitization
@Transform(({ value }) => value?.toLowerCase().trim())
@IsEmail()
email: string;

// XSS protection for text inputs
@Transform(({ value }) => sanitizeHtml(value))
@IsString()
fullName: string;
```

## 🧪 Testing

### Unit Tests
```typescript
describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: createMockUsersService(),
        },
        {
          provide: JwtService,
          useValue: createMockJwtService(),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'validPassword';
      
      const result = await service.validateUser(email, password);
      
      expect(result).toBeDefined();
      expect(result.email).toBe(email);
    });

    it('should return null when password is invalid', async () => {
      const result = await service.validateUser('test@example.com', 'invalidPassword');
      expect(result).toBeNull();
    });
  });
});
```

### Integration Tests
```typescript
describe('Auth Controller (e2e)', () => {
  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'validPassword',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.user).toBeDefined();
      });
  });
});
```

## 📊 Monitoring & Analytics

### Authentication Metrics
```typescript
interface AuthMetrics {
  totalLogins: number;
  failedAttempts: number;
  successRate: number;
  averageSessionDuration: number;
  activeUsers: number;
  newRegistrations: number;
  passwordResets: number;
  deviceTypes: Record<string, number>;
  geographicDistribution: Record<string, number>;
}
```

### Security Alerts
```typescript
enum SecurityEvent {
  MULTIPLE_FAILED_LOGINS = 'MULTIPLE_FAILED_LOGINS',
  SUSPICIOUS_LOGIN_LOCATION = 'SUSPICIOUS_LOGIN_LOCATION',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
}
```

## 🚀 Deployment & Configuration

### Environment Variables
```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Password Reset
PASSWORD_RESET_SECRET=your-reset-secret
PASSWORD_RESET_EXPIRES_IN=1h
PASSWORD_RESET_URL=https://iccautotravel.com/reset-password

# Security Settings
BCRYPT_SALT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION=15m

# Email Service (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@iccautotravel.com
SMTP_PASS=your-smtp-password
```

### Production Security Checklist
- [ ] Strong JWT secrets (minimum 32 characters)
- [ ] HTTPS enforcement
- [ ] Rate limiting enabled
- [ ] Password policy enforcement
- [ ] Account lockout mechanism
- [ ] Audit logging active
- [ ] Security headers configured
- [ ] Token expiration properly set
- [ ] Refresh token rotation
- [ ] Email verification required

## 📚 Usage Examples

### Protecting Routes with Guards
```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  @Get('users')
  async getUsers(@CurrentUser() user: User) {
    // Only admins can access this endpoint
    return this.usersService.findAll();
  }
}
```

### Accessing Current User
```typescript
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  @Get()
  async getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  }
}
```

### Public Endpoints
```typescript
@Controller('public')
export class PublicController {
  @Get('services')
  @Public()
  async getPublicServices() {
    // This endpoint is accessible without authentication
    return this.servicesService.findAllPublic();
  }
}
```

---

## 🤝 Contributing

1. Follow security best practices
2. Write comprehensive tests for security features
3. Update documentation for any auth changes
4. Conduct security reviews for new features
5. Monitor for security vulnerabilities

## 📞 Support

For security-related questions:
- 📧 Email: security@iccautotravel.com
- 📱 Slack: #security-team
- 🚨 Security Issues: security-reports@iccautotravel.com

---

**Authentication Module - Securing ICC Auto Travel Platform** 🔐 