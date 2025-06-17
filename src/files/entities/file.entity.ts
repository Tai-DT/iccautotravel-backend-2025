export class FileEntity {
  id!: string;
  originalName!: string;
  mimeType!: string;
  size!: number;
  url!: string;
  uploaderId!: string;
  bucket!: string;
  createdAt!: Date;
}
