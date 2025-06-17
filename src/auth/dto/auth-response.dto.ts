// src/auth/dto/auth-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

// @ObjectType() // Chỉ dùng nếu là GraphQL
export class AuthResponseDto {
  // @Field() // Chỉ dùng nếu là GraphQL
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  // @Field({ nullable: true }) // Chỉ dùng nếu là GraphQL
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  refreshToken?: string; // TODO: Implement refresh token

  // @Field({ nullable: true }) // Chỉ dùng nếu là GraphQL
  @ApiProperty({
    description: 'User information',
    required: false,
  })
  user?: any; // Có thể sử dụng kiểu cụ thể hơn nếu cần
}
