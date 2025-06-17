declare module 'bcrypt';
declare module 'passport-jwt';
declare module 'passport-local';

declare namespace jest {
  interface SpyInstance<
    T extends (...args: any[]) => any = (...args: any[]) => any,
  > extends MockInstance<T> {}
  type Mocked<T> = {
    [P in keyof T]: T[P] extends (...args: any[]) => any
      ? MockInstance<T[P]>
      : T[P];
  } & T;
}
