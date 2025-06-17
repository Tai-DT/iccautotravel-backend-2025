import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateBlogCategoryDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsString()
  lang!: string;
}
