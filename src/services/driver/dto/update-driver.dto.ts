import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateDriverDto } from './create-driver.dto';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@InputType()
export class UpdateDriverDto extends PartialType(CreateDriverDto) {
  @ApiProperty({
    description: 'Status of driver approval',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    required: false,
  })
  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(['PENDING', 'APPROVED', 'REJECTED'], {
    message: 'Status must be one of: PENDING, APPROVED, REJECTED',
  })
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
