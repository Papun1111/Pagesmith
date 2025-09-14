
export class ApiError extends Error {
  public readonly statusCode: number;


  constructor(statusCode: number, message: string) {

    super(message);

    // Assign the status code.
    this.statusCode = statusCode;

    // This is a common practice to restore the prototype chain.
    Object.setPrototypeOf(this, ApiError.prototype);

    // Captures the stack trace, excluding the constructor call from it.
    Error.captureStackTrace(this, this.constructor);
  }
}
