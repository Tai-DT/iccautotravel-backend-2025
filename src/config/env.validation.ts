import { plainToClass, Transform } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  PORT: number = 1337;

  @IsString()
  @IsOptional()
  HOST: string = '0.0.0.0';

  @IsString()
  @IsOptional()
  API_PREFIX: string = '/api';

  @IsString()
  DATABASE_URL: string;

  @IsString()
  @IsOptional()
  DIRECT_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '7d';

  @IsString()
  @IsOptional()
  JWT_ACCESS_TOKEN_EXPIRATION_TIME: string = '1h';

  @IsString()
  @IsOptional()
  JWT_REFRESH_TOKEN_EXPIRATION_TIME: string = '7d';

  @IsString()
  @IsOptional()
  REDIS_URL: string = 'redis://localhost:6379';

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  DISABLE_REDIS: boolean = false;

  @IsString()
  @IsOptional()
  DASHBOARD_URL: string = 'http://localhost:3000';

  @IsString()
  @IsOptional()
  API_URL: string = 'http://localhost:1337';

  @IsString()
  @IsOptional()
  ADMIN_EMAIL: string = 'admin@iccautotravel.com';

  @IsString()
  @IsOptional()
  ADMIN_PASSWORD: string;

  @IsString()
  @IsOptional()
  UPLOAD_DIR: string = './uploads';

  @IsString()
  @IsOptional()
  MAX_FILE_SIZE: string = '10mb';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.toString()}`);
  }

  return validatedConfig;
}

export { EnvironmentVariables };
