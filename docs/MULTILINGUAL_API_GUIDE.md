# Multilingual API Guide for ICCautoTravel

This guide explains how to use and extend the multilingual API system in the ICCautoTravel backend.

## Overview

The multilingual API system allows API responses to be automatically translated based on the user's language preference. It supports multiple languages including English (en), Vietnamese (vi), and Korean (ko), with the ability to add more languages as needed.

## Key Components

1. **LanguageInterceptor**: Automatically processes API responses to translate them according to the requested language.

2. **MultilingualService**: Helper service to create multilingual objects and standardized API responses.

3. **@Multilingual() Decorator**: Easy way to apply multilingual processing to controllers or individual routes.

4. **Translation Files**: JSON files containing translations for various keys in different languages.

## How to Use the Multilingual System

### 1. Structure Your Data with Multilingual Fields

Use the `_i18n` suffix for fields that should be translated:

```typescript
const product = {
  id: '1',
  name_i18n: {
    en: 'Car Rental',
    vi: 'Thuê xe',
    ko: '자동차 대여'
  },
  description_i18n: {
    en: 'Luxury car rental service',
    vi: 'Dịch vụ thuê xe cao cấp',
    ko: '고급 자동차 렌탈 서비스'
  }
};
```

### 2. Add the @Multilingual() Decorator

Apply the decorator to your controller class or individual methods:

```typescript
import { Multilingual } from '../i18n/decorators/multilingual.decorator';

@Controller('api/v1/products')
@Multilingual() // Apply to the entire controller
export class ProductsController {
  // All methods will support multilingual responses
}

// OR

@Controller('api/v1/products')
export class ProductsController {
  @Get()
  @Multilingual() // Apply to a specific method
  getAllProducts() {
    // This method will support multilingual responses
  }
}
```

### 3. Use the MultilingualService in Your Controllers

For consistent, standardized responses:

```typescript
import { MultilingualService } from '../i18n/services/multilingual.service';

@Controller('api/v1/products')
@Multilingual()
export class ProductsController {
  constructor(private readonly multilingualService: MultilingualService) {}

  @Get()
  getAllProducts(@Query('lang') lang = 'en') {
    // Your data source here
    const products = [...]; // With _i18n fields

    return this.multilingualService.createMultilingualResponse(
      products,
      lang,
      'products.list_success' // Optional translation key for the response message
    );
  }
}
```

### 4. Handle the Language Parameter

The language can be specified in multiple ways (in order of precedence):

1. Query parameter: `?lang=vi`
2. HTTP header: `X-Language: vi` or `Accept-Language: vi`
3. User preference (if logged in): `user.preferredLanguage`

If no language is specified or the specified language is not supported, the system will default to English (en).

## Adding Support for More Languages

To add support for a new language:

1. Create or update the translation files in `src/i18n/`:
   - `updated-[lang_code].json`

2. Add the new language code to the supported languages in the TranslationService:

```typescript
getSupportedLanguages(): string[] {
  return ['en', 'vi', 'ko', 'new_lang_code'];
}
```

## Testing Multilingual API Endpoints

You can test your multilingual API endpoints using the following curl commands:

```bash
# English (default)
curl http://localhost:1337/api/v1/services

# Vietnamese
curl http://localhost:1337/api/v1/services?lang=vi

# Korean
curl http://localhost:1337/api/v1/services?lang=ko

# Using header
curl -H "X-Language: vi" http://localhost:1337/api/v1/services
```

## Adding Translations for New Keys

To add new translation keys:

1. Add the keys to the translation files:
   - `updated-en.json`
   - `updated-vi.json`
   - `updated-ko.json`

Example:

```json
{
  "products": {
    "list_success": "Product list retrieved successfully",
    "categories": {
      "electronics": "Electronics",
      "clothing": "Clothing"
    }
  }
}
```

## Best Practices

1. **Naming Convention**: Always use the `_i18n` suffix for multilingual fields.

2. **Fallback Mechanism**: Always provide an English translation as a fallback.

3. **Nested Objects**: The system supports deep translation of nested objects.

4. **Arrays**: Arrays of objects with multilingual fields are also supported.

5. **Consistency**: Use the MultilingualService for consistent response formatting.

6. **Documentation**: Document the available languages and translation keys for other developers.

## Example Response Structure

A multilingual API response will have the following structure:

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Car Rental", // Translated to the requested language
      "description": "Luxury car rental service"
    }
  ],
  "message": "Service list retrieved successfully", // Translated message
  "language": "en", // The language used for this response
  "meta": {
    "timestamp": "2023-06-17T12:34:56.789Z",
    "availableLanguages": ["en", "vi", "ko"],
    "version": "1.0.0"
  }
}
```
