export class BaseError extends Error {
    constructor(message: string, public code: string, public data?: any) {
      super(message);
      this.name = this.constructor.name;
      Error.captureStackTrace(this, this.constructor);
    }
  }