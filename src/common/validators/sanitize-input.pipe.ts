import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { DatabaseException } from '../exceptions/database.exception';

@Injectable()
export class SanitizeInputPipe implements PipeTransform {
  /**
   * SQL injection patterns to check for
   */
  private readonly sqlInjectionPatterns = [
    /('\s*OR\s*'\d+'\s*=\s*'\d+)/i, // 'OR '1'='1
    /(\s+OR\s+\d+=\d+)/i, // OR 1=1
    /(\s+OR\s+["']\w+["']\s*=\s*["']\w+)/i, // OR "a"="a"
    /(\s+UNION\s+SELECT)/i, // UNION SELECT
    /(\s+INSERT\s+INTO)/i, // INSERT INTO
    /(\s+DELETE\s+FROM)/i, // DELETE FROM
    /(\s+DROP\s+TABLE)/i, // DROP TABLE
    /(\s+TRUNCATE\s+TABLE)/i, // TRUNCATE TABLE
    /(\s+UPDATE\s+\w+\s+SET)/i, // UPDATE x SET
    /(\s+EXEC\s+\w+)/i, // EXEC xp_cmdshell
    /(;\s*\w+)/i, // ; followed by word
    /(--\s*$)/, // SQL comment at end
  ];

  /**
   * Characters that should trigger validation
   */
  private readonly suspiciousChars = [
    '\\',
    ';',
    '--',
    '/*',
    '*/',
    '@@',
    '@',
    'char',
    'nchar',
    'varchar',
    'nvarchar',
  ];

  /**
   * Transform method required by PipeTransform interface
   * @param value The input value to transform
   * @param metadata Metadata about the target object
   * @returns The sanitized value
   */
  transform(value: any, metadata: ArgumentMetadata) {
    if (value && typeof value === 'object') {
      // Recursively check all object properties
      return this.sanitizeObject(value);
    } else if (typeof value === 'string') {
      // Check string values directly
      return this.sanitizeString(value);
    }

    // Return other types unchanged
    return value;
  }

  /**
   * Sanitizes an object by checking all its string properties
   * @param obj The object to sanitize
   * @returns The sanitized object
   */
  private sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized = { ...obj };

    for (const key in sanitized) {
      if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
        const value = sanitized[key];

        if (typeof value === 'string') {
          sanitized[key] = this.sanitizeString(value);
        } else if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value)
        ) {
          sanitized[key] = this.sanitizeObject(value);
        } else if (Array.isArray(value)) {
          sanitized[key] = value.map((item) => {
            if (typeof item === 'string') {
              return this.sanitizeString(item);
            } else if (item && typeof item === 'object') {
              return this.sanitizeObject(item);
            }
            return item;
          });
        }
      }
    }

    return sanitized;
  }

  /**
   * Sanitizes a string by checking for SQL injection patterns
   * @param value The string to sanitize
   * @returns The sanitized string
   */
  private sanitizeString(value: string): string {
    // Quick check for suspicious characters
    const hasSuspiciousChars = this.suspiciousChars.some((char) =>
      value.toLowerCase().includes(char.toLowerCase()),
    );

    // If suspicious characters found, do a more thorough check
    if (hasSuspiciousChars) {
      const hasSqlInjection = this.sqlInjectionPatterns.some((pattern) =>
        pattern.test(value),
      );

      if (hasSqlInjection) {
        throw DatabaseException.sqlInjectionAttempt();
      }
    }

    // Escape single quotes and return
    return value.replace(/'/g, "''");
  }
}
