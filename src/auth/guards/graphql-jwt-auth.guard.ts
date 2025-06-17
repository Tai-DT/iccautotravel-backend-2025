import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GraphQLJwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    // Ensure the request object has the necessary methods for Passport
    if (request && !request.logIn) {
      request.logIn = function (user: any, callback?: any) {
        this.user = user;
        if (callback) callback();
      };
      request.logout = function (callback?: any) {
        this.user = null;
        if (callback) callback();
      };
      request.login = request.logIn;
    }

    return request;
  }
}
