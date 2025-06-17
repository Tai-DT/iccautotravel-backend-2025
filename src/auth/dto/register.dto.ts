// src/auth/dto/register.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  Matches,
  IsEnum,
} from 'class-validator';
// import { Role } from '@prisma/client'; // Removed import as we will use string directly

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain at least 1 uppercase letter and 1 number',
  })
  // TODO: Add more complex password policy validation (uppercase, number, special char)
  password!: string;

  @IsNotEmpty()
  fullName!: string;

  // @IsEnum(Role, { message: 'Role must be admin, staff, or customer' })
  @IsNotEmpty({ message: 'Role is required' })
  role!: string; // Changed to string
}
