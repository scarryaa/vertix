import { BaseError } from "./base.error";

export class ValidationError extends BaseError {
    constructor(message: string, data?: any) {
      super(message, 'VALIDATION_ERROR', data);
    }
  }