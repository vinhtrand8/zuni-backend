import { VCSynthesisError, type SchemaInterface } from './schema';
import { CredentialInterface } from './credential';
const JSONStringify = require('json-stable-stringify');

/*
  name: string
  verifier: string
  checks: Object
  requests: string[]
  proof: DataSignatureInterface
  */
export enum NativeOperator {
  EQ = '$EQ',
  NE = '$NE',
  LT = '$LT',
  LTE = '$LTE',
  GT = '$GT',
  GTE = '$GTE',
  INVALID_OP = '',
}

export function getOp(opStr: string): NativeOperator {
  switch (opStr) {
    case '$EQ':
      return NativeOperator.EQ;
    case '$GT':
      return NativeOperator.GT;
    case '$GTE':
      return NativeOperator.GTE;
    case '$NE':
      return NativeOperator.NE;
    case '$LT':
      return NativeOperator.LT;
    case '$LTE':
      return NativeOperator.LTE;
    default:
      return NativeOperator.INVALID_OP;
  }
}
export function getOpId(opStr: string): number {
  switch (opStr) {
    case '$EQ':
      return 0;
    case '$NE':
      return 1;
    case '$LT':
      return 2;
    case '$LTE':
      return 3;
    case '$GT':
      return 4;
    case '$GTE':
      return 5;
    default:
      return 6;
  }
}

export function flattenJson(obj: any, prefix = ''): [string, any][] {
  const result: [string, any][] = [];

  for (const key in obj) {
    if (typeof obj === 'object' && obj[key]) {
      const value = obj[key];
      const field = prefix ? `${prefix}.${key}` : key;

      if (value instanceof Array || typeof value !== 'object') {
        result.push([field, value]);
      } else if (value !== null) {
        const nestedPrefix = prefix ? `${prefix}.${key}` : key;
        result.push(...flattenJson(value, nestedPrefix));
      }
    }
  }

  result.sort();

  return result;
}

export function evaluate_check(check: any, cred: any): boolean {
  const checkFieldsArray = flattenJson(check);
  const credFieldsArray = flattenJson(cred);
  const credFieldsMap = {} as any;

  for (let i = 0; i < credFieldsArray.length; ++i) {
    credFieldsMap[credFieldsArray[i][0]] = credFieldsArray[i][1];
  }

  let result = true;
  for (let i = 0; i < checkFieldsArray.length && result; ++i) {
    const requiredField = checkFieldsArray[i][0];
    const op = checkFieldsArray[i][1][0];
    const compared_value = checkFieldsArray[i][1][1];

    if (typeof credFieldsMap === 'object' && credFieldsMap[requiredField]) {
      let checkVal = compared_value;
      let credVal = credFieldsMap[requiredField];

      switch (op) {
        case NativeOperator.EQ:
          checkVal = JSONStringify(compared_value);
          credVal = JSONStringify(credFieldsMap[requiredField]);
          result &&= credVal === checkVal;
          break;
        case NativeOperator.NE:
          checkVal = JSONStringify(compared_value);
          credVal = JSONStringify(credFieldsMap[requiredField]);
          result &&= credVal !== checkVal;
          break;
        case NativeOperator.GT:
          result &&= credVal > checkVal;
          break;
        case NativeOperator.GTE:
          result &&= credVal >= checkVal;
          break;
        case NativeOperator.LT:
          result &&= credVal < checkVal;
          break;
        case NativeOperator.LTE:
          result &&= credVal <= checkVal;
          break;
        default:
          throw VCSynthesisError.InvalidSchema;
      }
    } else {
      result = false;
      console.log('LACK:', requiredField, op, compared_value);
    }
  }
  return result;
}

export function generate_presentation(
  schema: SchemaInterface,
  credentials: CredentialInterface[],
): Array<any> {
  if (schema.checks.length !== credentials.length) {
    throw VCSynthesisError.BadAssignment;
  }

  for (let i = 0; i < schema.checks.length; ++i) {
    if (!evaluate_check(schema.checks[i], credentials[i])) {
      throw VCSynthesisError.Unsatisfiable;
    }
  }

  const result: Array<any> = [];
  for (const requestStr of schema.requests) {
    const fields = requestStr.split('.');

    if (fields.length <= 0) {
      throw VCSynthesisError.InvalidSchema;
    }

    const index = Number(fields[0]);
    if (isNaN(index) || index >= schema.checks.length) {
      throw VCSynthesisError.InvalidSchema;
    }
    let tmp = credentials[index] as any;

    for (const field of fields.slice(1)) {
      if (!tmp || !(field in tmp)) {
        throw VCSynthesisError.Unsatisfiable;
      } else {
        tmp = tmp[field];
      }
    }

    result.push(tmp);
  }

  return result;
}
