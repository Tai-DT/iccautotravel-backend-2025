import { CustomScalar, Scalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('JSONObject')
export class JSONObjectScalar
  implements CustomScalar<Record<string, any>, Record<string, any>>
{
  description = 'JSON custom scalar type that supports arbitrary JSON objects';

  parseValue(value: unknown): Record<string, any> {
    return typeof value === 'object' && value !== null
      ? (value as Record<string, any>)
      : {};
  }

  serialize(value: unknown): Record<string, any> {
    return typeof value === 'object' && value !== null
      ? (value as Record<string, any>)
      : {};
  }

  parseLiteral(ast: ValueNode): Record<string, any> {
    if (ast.kind === Kind.OBJECT) {
      const result: Record<string, any> = {};
      ast.fields.forEach((field) => {
        const fieldName = field.name.value;
        result[fieldName] = this.parseValueAST(field.value);
      });
      return result;
    }
    return {};
  }

  private parseValueAST(ast: ValueNode): any {
    switch (ast.kind) {
      case Kind.STRING:
        return ast.value;
      case Kind.BOOLEAN:
        return ast.value;
      case Kind.INT:
      case Kind.FLOAT:
        return parseFloat(ast.value);
      case Kind.OBJECT:
        const obj: Record<string, any> = {};
        ast.fields.forEach((field) => {
          obj[field.name.value] = this.parseValueAST(field.value);
        });
        return obj;
      case Kind.LIST:
        return ast.values.map((value) => this.parseValueAST(value));
      default:
        return null;
    }
  }
}
