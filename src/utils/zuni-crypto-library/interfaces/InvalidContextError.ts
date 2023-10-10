export class InvalidContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidContextError';
  }
}
