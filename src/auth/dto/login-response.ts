import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class LoginResponse {
  @Field(() => String)
  accessToken!: string; // Sửa access_token thành accessToken

  @Field(() => String, { nullable: true }) // Thêm refreshToken, cho phép nullable nếu có thể không có
  refreshToken?: string;
}
