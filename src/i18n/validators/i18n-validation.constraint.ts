import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { TranslationService } from '../translation.service';
import { Injectable } from '@nestjs/common';

@ValidatorConstraint({ name: 'i18nValidation', async: false })
@Injectable()
export class I18nValidationConstraint implements ValidatorConstraintInterface {
  constructor(private readonly translationService: TranslationService) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(value: any, args: ValidationArguments) {
    // This is just a placeholder - actual validation should be implemented based on needs
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const { constraints, property } = args;
    const validationType = constraints[0];

    // Extract language from context if available
    const lang = 'en'; // Default language, should be extracted from request context

    switch (validationType) {
      case 'isEmail':
        return this.translationService.translateWithLang(
          'validation.isEmail',
          lang,
        );
      case 'isNotEmpty':
        return this.translationService.translateWithLang(
          'validation.isNotEmpty',
          lang,
        );
      case 'minLength':
        return this.translationService.translateWithLang(
          'validation.minLength',
          lang,
          { min: constraints[1] },
        );
      case 'maxLength':
        return this.translationService.translateWithLang(
          'validation.maxLength',
          lang,
          { max: constraints[1] },
        );
      default:
        return `Validation failed for ${property}`;
    }
  }
}

// Helper function to create localized validation messages
export function createI18nValidationMessage(type: string, options?: any) {
  return (args: ValidationArguments) => {
    // This would ideally get the language from the request context
    // For now, we'll use English as default

    switch (type) {
      case 'isEmail':
        return 'Email must be a valid email address';
      case 'isNotEmpty':
        return 'Field cannot be empty';
      case 'minLength':
        return `Field must be at least ${options?.min || args.constraints[0]} characters long`;
      case 'maxLength':
        return `Field must be at most ${options?.max || args.constraints[0]} characters long`;
      default:
        return 'Validation failed';
    }
  };
}
