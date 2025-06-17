// src/auth/guards/custom-jwt.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CustomJwtGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    // Xử lý cho cả GraphQL và REST
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest();
    }

    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    // Đảm bảo rằng request không gây lỗi khi được xử lý bởi passport
    if (!request.session) {
      request.session = {};
    }

    // Đảm bảo không gọi logIn nếu không có
    if (!request.logIn) {
      request.logIn = () => Promise.resolve();
    }

    return request;
  }
}
