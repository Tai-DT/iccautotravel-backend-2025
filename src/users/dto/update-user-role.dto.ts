// src/users/dto/update-user-role.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';
import { RoleName } from '../../common/constants/roles';

@InputType()
export class UpdateUserRoleDto {
  @IsNotEmpty()
  @IsString()
  @Field(() => String, { description: 'User role name (ADMIN, STAFF, etc.)' })
  role!: RoleName;
}
