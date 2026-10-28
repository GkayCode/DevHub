class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    details?: unknown
  ) {
    super(message);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export default ApiError;