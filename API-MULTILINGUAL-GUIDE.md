# Hướng dẫn triển khai API đa ngôn ngữ

Tệp này mô tả cách triển khai và sử dụng hệ thống API đa ngôn ngữ trong dự án ICCautoTravel Backend.

## Cách hoạt động

Hệ thống API đa ngôn ngữ cho phép các endpoint API trả về dữ liệu theo ngôn ngữ mà người dùng yêu cầu (tiếng Anh, tiếng Việt, hoặc tiếng Hàn).

### Quy trình xử lý

1. **Nhận diện ngôn ngữ**: Xác định ngôn ngữ yêu cầu từ query parameter, header, hoặc tùy chọn người dùng
2. **Xử lý dữ liệu**: Biến đổi các trường đa ngôn ngữ (`*_i18n`) thành giá trị phù hợp với ngôn ngữ yêu cầu
3. **Trả về kết quả**: Kèm theo metadata về ngôn ngữ đã sử dụng và các ngôn ngữ hỗ trợ

## Cách triển khai

### 1. Cấu trúc dữ liệu đa ngôn ngữ

```typescript
// Cấu trúc dữ liệu với các trường đa ngôn ngữ (suffix _i18n)
const serviceData = {
  id: '123',
  name_i18n: {
    en: 'Airport Transfer',
    vi: 'Đưa đón sân bay',
    ko: '공항 환승'
  },
  description_i18n: {
    en: 'Comfortable airport pickup and drop-off service',
    vi: 'Dịch vụ đón và trả khách tại sân bay thoải mái',
    ko: '편안한 공항 픽업 및 하차 서비스'
  },
  price: 100
};
```

### 2. Tạo Controller với decorator @Multilingual()

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { Multilingual } from '../i18n/decorators/multilingual.decorator';
import { MultilingualService } from '../i18n/services/multilingual.service';

@Controller('api/v1/services')
@Multilingual() // Áp dụng cho toàn bộ controller
export class ServicesController {
  constructor(private readonly multilingualService: MultilingualService) {}
  
  @Get()
  getAllServices(@Query('lang') lang = 'en') {
    // Lấy dữ liệu dịch vụ
    const services = [...]; // Dữ liệu có cấu trúc _i18n
    
    // Trả về response đa ngôn ngữ
    return this.multilingualService.createMultilingualResponse(
      services,
      lang,
      'services.list_success'
    );
  }
}
```

### 3. Xử lý trong Service

```typescript
@Injectable()
export class ServiceService {
  constructor(private readonly multilingualService: MultilingualService) {}
  
  async getServiceDetails(id: string, lang: string) {
    // Lấy dữ liệu từ database
    const serviceData = await this.prisma.service.findUnique({
      where: { id },
      include: {
        serviceDetails: true,
        serviceOptions: true,
      },
    });
    
    // Chuyển đổi sang định dạng đa ngôn ngữ
    const serviceWithMultilingual = this.transformToMultilingual(serviceData);
    
    // Trả về response đa ngôn ngữ
    return this.multilingualService.createMultilingualResponse(
      serviceWithMultilingual,
      lang,
      'services.details_success'
    );
  }
  
  private transformToMultilingual(data) {
    // Logic chuyển đổi dữ liệu từ database sang định dạng _i18n
    // ...
  }
}
```

## Cách test API đa ngôn ngữ

Bạn có thể test API đa ngôn ngữ bằng các lệnh curl sau:

```bash
# Test với tiếng Anh (mặc định)
curl http://localhost:1337/api/v1/services

# Test với tiếng Việt
curl http://localhost:1337/api/v1/services?lang=vi

# Test với tiếng Hàn
curl http://localhost:1337/api/v1/services?lang=ko

# Test với header Accept-Language
curl -H "Accept-Language: vi" http://localhost:1337/api/v1/services
```

## Mở rộng hỗ trợ thêm ngôn ngữ

Để thêm một ngôn ngữ mới (ví dụ: tiếng Nhật - 'ja'):

1. Tạo file translation mới: `src/i18n/updated-ja.json`
2. Cập nhật `getSupportedLanguages()` trong `TranslationService`:
   ```typescript
   getSupportedLanguages(): string[] {
     return ['en', 'vi', 'ko', 'ja'];
   }
   ```
3. Cập nhật cấu trúc dữ liệu đa ngôn ngữ:
   ```typescript
   const data = {
     name_i18n: {
       en: 'English Name',
       vi: 'Tên tiếng Việt',
       ko: '한국어 이름',
       ja: '日本語の名前'
     }
   };
   ```
