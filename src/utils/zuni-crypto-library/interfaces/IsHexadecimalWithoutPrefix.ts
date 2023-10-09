import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { ValidationArguments } from 'class-validator';

@ValidatorConstraint({
  name: 'IsHexadecimalWithoutPrefix',
  async: false,
})
export class IsHexadecimalWithoutPrefix
  implements ValidatorConstraintInterface
{
  validate(value: string, args: ValidationArguments) {
    const hexadecimal = /^[0-9A-Fa-f]+$/i;
    if (
      typeof value !== 'string' ||
      value.length <= 0 ||
      !hexadecimal.test(value)
    ) {
      args.constraints = [{ damem: 'false' }];
      return false;
    }
    return true;
  }

  defaultMessage(_args: ValidationArguments) {
    return `$property must be a non-empty hexadecimal string`;
  }
}
