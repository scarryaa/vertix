import { BaseError } from "./base.error";

export class ValidationError extends BaseError {
    constructor(message: string, data?: unknown) {
      super(message, 'VALIDATION_ERROR', data);
    }
  }