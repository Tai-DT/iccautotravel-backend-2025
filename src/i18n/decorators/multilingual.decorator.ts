import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { LanguageInterceptor } from '../interceptors/language.interceptor';

/**
 * Decorator để áp dụng đa ngôn ngữ cho controllers hoặc handlers
 * @example
 * @ApiTags('Services')
 * @Controller('api/services')
 * @Multilingual() // Áp dụng cho toàn bộ controller
 * export class ServicesController {}
 * 
 * @example
 * @Get('details/:id')
 * @Multilingual() // Áp dụng cho một route cụ thể
 * async getServiceDetails(@Param('id') id: string) {}
 */
export function Multilingual() {
  return applyDecorators(
    UseInterceptors(LanguageInterceptor)
  );
}
