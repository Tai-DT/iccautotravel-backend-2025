/**
 * Utility class for SQL query sanitization to prevent SQL injection
 */
export class SqlSanitizer {
  /**
   * Builds a safe WHERE clause from an object of conditions
   * @param conditions Object with field-value pairs for WHERE clause
   * @returns Sanitized WHERE clause string
   */
  static buildWhereClause(conditions: Record<string, any>): string {
    if (!conditions || Object.keys(conditions).length === 0) {
      return '1=1'; // Default true condition if no conditions provided
    }

    const clauses = Object.entries(conditions)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        const sanitizedKey = this.sanitizeIdentifier(key);

        if (value === null) {
          return `"${sanitizedKey}" IS NULL`;
        }

        const sanitizedValue = this.sanitizeValue(value);
        return `"${sanitizedKey}" = ${sanitizedValue}`;
      });

    return clauses.length > 0 ? clauses.join(' AND ') : '1=1';
  }

  /**
   * Builds a safe SET clause for UPDATE statements
   * @param data Object with field-value pairs to update
   * @returns Sanitized SET clause string
   */
  static buildSetClause(data: Record<string, any>): string {
    if (!data || Object.keys(data).length === 0) {
      throw new Error('No data provided for update operation');
    }

    return Object.entries(data)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => {
        const sanitizedKey = this.sanitizeIdentifier(key);
        const sanitizedValue = this.sanitizeValue(value);
        return `"${sanitizedKey}" = ${sanitizedValue}`;
      })
      .join(', ');
  }

  /**
   * Sanitizes a string value for SQL injection prevention
   * @param value String to sanitize
   * @returns Sanitized string
   */
  static sanitizeString(value: string): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }

    // Escape single quotes by doubling them
    const escaped = value.replace(/'/g, "''");
    return `'${escaped}'`;
  }

  /**
   * Sanitizes a number value
   * @param value Number to sanitize
   * @returns Sanitized number string
   */
  static sanitizeNumber(value: number): string {
    if (value === null || value === undefined || isNaN(value)) {
      return 'NULL';
    }

    // Convert to string to prevent injection
    return value.toString();
  }

  /**
   * Sanitizes a boolean value
   * @param value Boolean to sanitize
   * @returns Sanitized boolean string
   */
  static sanitizeBoolean(value: boolean): string {
    return value ? 'TRUE' : 'FALSE';
  }

  /**
   * Sanitizes a date value
   * @param value Date to sanitize
   * @returns Sanitized date string
   */
  static sanitizeDate(value: Date): string {
    if (value === null || value === undefined || !(value instanceof Date)) {
      return 'NULL';
    }

    return `'${value.toISOString()}'`;
  }

  /**
   * Sanitizes an identifier (table or column name)
   * @param identifier Identifier to sanitize
   * @returns Sanitized identifier
   */
  private static sanitizeIdentifier(identifier: string): string {
    // Remove any dangerous characters from identifiers
    return identifier.replace(/[^\w]/g, '');
  }

  /**
   * Sanitizes a value based on its type
   * @param value Value to sanitize
   * @returns Sanitized value string
   */
  private static sanitizeValue(value: any): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }

    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (typeof value === 'number') {
      return this.sanitizeNumber(value);
    }

    if (typeof value === 'boolean') {
      return this.sanitizeBoolean(value);
    }

    if (value instanceof Date) {
      return this.sanitizeDate(value);
    }

    // Handle objects and arrays by converting to JSON string
    return this.sanitizeString(JSON.stringify(value));
  }
}
