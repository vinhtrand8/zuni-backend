import { validateSync, ValidationError } from 'class-validator';

export class ClassPropertyValidationError extends Error {
  constructor(errors: ValidationError[]) {
    const errorMessage = errors
      .map((error) => Object.values(error.constraints ?? {}).join('; '))
      .join('; ');
    super(errorMessage);
    this.name = 'ClassPropertyValidationError';
  }
}
export class BaseClassValidator<T> {
  constructor(data: any) {
    Object.assign(this, data);
    this.validateTypeSync();
  }

  protected validateTypeSync() {
    const errors: ValidationError[] = validateSync(this);
    if (errors.length > 0) {
      console.log('Bad assignment to object ', this, errors);
      throw new ClassPropertyValidationError(errors);
    }
  }

  protected clone(): T {
    throw new Error(
      'clone() must be implemented by child classes of BaseClassValidator',
    );
  }
}
