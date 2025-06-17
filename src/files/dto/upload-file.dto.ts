import { IsString, IsInt, IsOptional } from 'class-validator';

export class UploadFileDto {
  @IsString()
  originalName!: string;

  @IsString()
  mimeType!: string;

  @IsInt()
  size!: number;

  @IsString()
  url!: string;

  @IsString()
  uploaderId!: string;

  @IsString()
  bucket!: string;

  @IsOptional()
  @IsString()
  createdAt?: string;
}
