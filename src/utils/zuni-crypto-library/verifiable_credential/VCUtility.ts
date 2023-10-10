import { assert } from 'chai';
import { BigNumberish, SMT } from 'circomlibjs';
import { isInt, isJSON } from 'class-validator';
import { SHA256 } from 'crypto-js';
import JSONStringify from 'json-stable-stringify';
import { FFMathUtility } from 'library/BabyJub/FFMathUtility';
import {
  MAX_STRING_LENGTH,
  MAX_VALUE_CHUNK,
  NUM_CHAR_EACH_CHUNK,
  VC_SMT_LEVEL,
} from 'library/constants/VCConstants';
import { ECCCurvePoint } from 'library/interfaces/BasePoint';
import { ECCKeyStringPair } from 'library/interfaces/ECCKeyStringPair';
import { ECCPrivateKeyInterface } from 'library/interfaces/ECCPrivateKey';
import { ECCPublicKeyInterface } from 'library/interfaces/ECCPublicKey';
import { WasmField1Interface } from 'library/interfaces/WasmFieldInterface';
import { ZKEngine, ZKProof } from 'library/interfaces/ZKEngine';
import { ECCUtility } from 'library/utility/ECCUtility';
import { omit } from 'lodash';
import {
  DataSignature,
  DataWithSignature,
  FieldIndex,
  FieldString,
  NativeOperator,
  PrivateCredential,
  ProofPurpose,
  PublicCredential,
  Schema,
  SchemaCredentialCheck,
  SingleCredentialFieldValidationPrivateInput,
  SingleCredentialFieldValidationPublicInput,
  SingleCredentialFieldValidationSnarkProof,
  VCPresentation,
  VCSynthesisError,
} from './VCInterfaces';

function _getOp(opStr: string): NativeOperator {
  switch (opStr) {
    case '$EQ':
      return NativeOperator.EQ;
    case '$NE':
      return NativeOperator.NE;
    case '$LT':
      return NativeOperator.LT;
    case '$GTE':
      return NativeOperator.GTE;
    case '$GT':
      return NativeOperator.GT;
    case '$LTE':
      return NativeOperator.LTE;
    default:
      return NativeOperator.INVALID_OP;
  }
}

function getOpId(opStr: string): number {
  switch (opStr) {
    case '$EQ':
      return 0;
    case '$NE':
      return 1;
    case '$LT':
      return 2;
    case '$GTE':
      return 3;
    case '$GT':
      return 4;
    case '$LTE':
      return 5;
    default:
      return 6;
  }
}

function reverseString(str: string): string {
  return str.split('').reverse().join('');
}

function intTo256BitNumber(value: number): FieldString {
  const result: Array<string> = [];
  for (let i = 0; i < MAX_VALUE_CHUNK - 1; ++i) result.push('0');
  result.push(value.toString());
  return result;
}

// USAGE: convertTo256BitNumber(12123987123), convertTo256BitNumber('abc'), convertTo256BitNumber('abd'), convertTo256BitNumber(['UniveristyDegree'])
function convertTo256BitNumber(value: any): FieldString {
  if (Number.isInteger(value)) {
    return intTo256BitNumber(value);
  }
  //
  let strValue: string = reverseString(JSONStringify(value));
  while (strValue.length < MAX_STRING_LENGTH) {
    strValue += '\0';
  }

  // fold => this raises error when the real value is >   MAX_STRING_LENGTH
  while (strValue.length > MAX_STRING_LENGTH) {
    const i: number = strValue.length - MAX_STRING_LENGTH - 1;
    const x = strValue[i].charCodeAt(0);
    const y = strValue[strValue.length - 1].charCodeAt(0);
    const z = x ^ y;
    strValue = String.fromCharCode(z) + strValue.slice(1, strValue.length - 1);
    // strValue[strValue.length - MAX_STRING_LENGTH]
  }
  strValue = reverseString(strValue);

  // convert this string into 248-bit chunks
  const result: FieldString = [];
  for (let i = 0; i < strValue.length; ++i) {
    const l = i,
      r = l + NUM_CHAR_EACH_CHUNK - 1;
    // convert strValue[l -> r] into a Field value
    let curVal = 0n;
    for (let j = l; j <= r; ++j) {
      curVal = curVal * 256n + BigInt(strValue.charCodeAt(j));
    }
    //
    result.push(curVal.toString());
    i = r;
  }
  return result;
}

function flattenJson(obj: any, prefix = ''): Array<[string, any]> {
  const keyValuePairs: Array<[string, any]> = [];

  for (const key in obj) {
    if (typeof obj === 'object' && obj[key]) {
      const value = obj[key];
      const field = prefix ? `${prefix}.${key}` : key;

      if (value instanceof Array || typeof value !== 'object') {
        keyValuePairs.push([field, value]);
      } else if (value !== null) {
        const nestedPrefix = prefix ? `${prefix}.${key}` : key;
        keyValuePairs.push(...flattenJson(value, nestedPrefix));
      }
    }
  }

  keyValuePairs.sort();

  return keyValuePairs;
}

function evaluateCheck<P extends ECCCurvePoint>(
  check: SchemaCredentialCheck<P>,
  privateCredential: PrivateCredential<P>,
): boolean {
  const checkFieldsArray = flattenJson(check.fieldValidationObject);
  const credFieldsArray = flattenJson(privateCredential.credentialSubject);
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

export async function getSiblings(
  tree: SMT,
  key: number,
): Promise<Array<BigNumberish>> {
  const res = await tree.find(key);
  assert.equal(res.found && res.foundValue && res.siblings != undefined, true);
  const siblings = res.siblings.map((x) => tree.F.toObject(x));
  while (siblings.length < VC_SMT_LEVEL) siblings.push(0);
  return siblings;
}

// return a string representation of a field point
function encodeChunksToField(
  Fr: WasmField1Interface,
  chunks: Array<any>,
): Uint8Array {
  const base = Fr.e(
    '21888242871839275222246405745257275088548364400416034343698204186575808495616',
  );

  let result = Fr.e(0);

  for (let i = chunks.length - 1; i >= 0; --i) {
    result = Fr.add(Fr.mul(result, base), Fr.e(chunks[i]));
  }

  return result;
}

function buildDataWithSignature<T, P extends ECCCurvePoint>(
  data: T,
  privateKey: ECCPrivateKeyInterface<P>,
): DataWithSignature<T, P> {
  const signature = ECCUtility.ecdsaSign(privateKey, JSONStringify(data));
  const id = SHA256(signature).toString();

  const dataWithSignature = {
    ...data,
    id,
    signatureProof: new DataSignature({
      type: 'ECDSA_secp256k1',
      created: new Date().toISOString(),
      proofPurpose: ProofPurpose.ASSERTION,
      value: signature,
      verificationMethod: privateKey.toPublicKey().toHexString(),
    }),
  };
  return dataWithSignature;
}
function verifyDataWithSignature<T, P extends ECCCurvePoint>(
  dataWithSignature: DataWithSignature<T, P>,
  signerPublicKey: ECCPublicKeyInterface<P>,
): boolean {
  return (
    ECCUtility.ecdsaVerify(
      signerPublicKey,
      JSONStringify(omit(dataWithSignature, ['id', 'signatureProof'])),
      dataWithSignature.signatureProof.value,
    ) &&
    SHA256(dataWithSignature.signatureProof.value).toString() ===
      dataWithSignature.id
  );
}

async function jsonDataToFieldSMT<P extends ECCCurvePoint>(
  data: JSON,
  isSchemaCheck = false,
): Promise<{
  fieldIndexes: Array<FieldIndex<P>>;
  smt: SMT;
  keyValuePairs: Array<[string, any]>;
}> {
  const fieldIndexes: Array<FieldIndex<P>> = [];
  const keyValuePairs = flattenJson(data);
  const smt = await FFMathUtility.createSMT();
  const Fr = smt.F;

  // gen SMT for this (raw) credential
  for (let j = 0; j < keyValuePairs.length; ++j) {
    const key = keyValuePairs[j][0];
    const fieldIndex = j + 1;

    fieldIndexes.push(
      new FieldIndex({
        fieldName: key,
        fieldIndex,
      }),
    );

    const value = isSchemaCheck ? keyValuePairs[j][1][1] : keyValuePairs[j][1];
    const fValue: FieldString = convertTo256BitNumber(value);
    const fValueEncoding = encodeChunksToField(Fr, fValue);
    await smt.insert(Fr.e(fieldIndex), fValueEncoding);

    const foundValue = await smt.find(Fr.e(fieldIndex));
    assert(
      foundValue &&
        foundValue.found &&
        foundValue.foundValue &&
        FFMathUtility.F.toString(fValueEncoding, 10) ==
          FFMathUtility.F.toString(foundValue.foundValue, 10),
    );
  }

  return { fieldIndexes, smt, keyValuePairs };
}

// For issuer
export async function issueVC<P extends ECCCurvePoint>({
  issuer,
  holder,
  types,
  issuerKeyPair,
  holderPublicKey,
  expirationDate,
  credentialSubject,
}: {
  issuer: string;
  holder: string;
  issuerKeyPair: ECCKeyStringPair<P>;
  holderPublicKey: ECCPublicKeyInterface<P>;
  types: Array<string>;
  expirationDate?: string;
  credentialSubject: JSON;
}): Promise<PrivateCredential<P>> {
  const curDate = new Date().toISOString();
  const { fieldIndexes, smt: credentialSMT } = await jsonDataToFieldSMT(
    credentialSubject,
  );
  const fieldMerkleRoot = credentialSMT.F.toString(credentialSMT.root, 10);
  const encryptedData = ECCUtility.ecdhEncrypt(
    issuerKeyPair.getPrivateKey(),
    holderPublicKey,
    JSONStringify(credentialSubject),
  );

  const publicCredentialWithoutSignature = {
    types,
    issuer,
    issuerPublicKey: issuerKeyPair.getPublicKey().toHexString(),
    holderPublicKey: holderPublicKey.toHexString(),
    holder,
    issuanceDate: curDate,
    ...(expirationDate && { expirationDate }),
    fieldIndexes,
    fieldMerkleRoot,
    encryptedData,
  };

  const rawPublicCredentialWithSignature = buildDataWithSignature(
    publicCredentialWithoutSignature,
    issuerKeyPair.getPrivateKey(),
  );

  return new PrivateCredential({
    ...rawPublicCredentialWithSignature,
    credentialSubject,
  });
}

// For holder & anyone has the public credential
export function verifyValidPublicCredential<P extends ECCCurvePoint>(
  publicCredential: PublicCredential<P>,
): boolean {
  return verifyDataWithSignature(
    publicCredential,
    ECCUtility.newPublicKey(publicCredential.issuerPublicKey),
  );
}

// For holder
export function decryptPublicCredential<P extends ECCCurvePoint>(
  publicCredential: PublicCredential<P>,
  holderPrivateKey: ECCPrivateKeyInterface<P>,
): PrivateCredential<P> {
  if (!verifyValidPublicCredential(publicCredential))
    throw VCSynthesisError.InvalidCredential;

  const credentialSubject = ECCUtility.ecdhDecrypt(
    holderPrivateKey,
    ECCUtility.newPublicKey(publicCredential.issuerPublicKey),
    publicCredential.encryptedData,
  );

  if (!isJSON(credentialSubject)) throw VCSynthesisError.InvalidCredential;

  return new PrivateCredential({
    ...publicCredential.clone(),
    credentialSubject: JSON.parse(credentialSubject),
  });
}

export async function createVerificationSchema<P extends ECCCurvePoint>({
  name,
  verifier,
  verifierKeyPair,
  checks,
  requestedFields,
}: {
  name: string;
  verifier: string;
  verifierKeyPair: ECCKeyStringPair<P>;
  checks: Array<JSON>;
  requestedFields: string[];
}): Promise<Schema<P>> {
  const curDate = new Date().toISOString();
  const credentialChecks: Array<SchemaCredentialCheck<P>> = [];

  for (let i = 0; i < checks.length; ++i) {
    const { fieldIndexes, smt: checkSMT } = await jsonDataToFieldSMT(
      checks[i],
      true,
    );
    credentialChecks.push(
      new SchemaCredentialCheck({
        fieldValidationObject: checks[i],
        fieldIndexes,
        fieldMerkleRoot: checkSMT.F.toString(checkSMT.root, 10),
      }),
    );
  }

  const schemaWithoutSignature = {
    name,
    verifier,
    credentialChecks,
    requestedFields,
    issuanceDate: curDate,
    verifierPublicKey: verifierKeyPair.getPublicKey().toHexString(),
  };

  const rawSchemaWithSignature = buildDataWithSignature(
    schemaWithoutSignature,
    verifierKeyPair.getPrivateKey(),
  );

  return new Schema({
    ...rawSchemaWithSignature,
  });
}

export function verifyValidSchema<P extends ECCCurvePoint>(
  schema: Schema<P>,
): boolean {
  return verifyDataWithSignature(
    schema,
    ECCUtility.newPublicKey(schema.verifierPublicKey),
  );
}

export async function generateVCPresentation<
  P extends ECCCurvePoint,
  ZP extends ZKProof,
>(
  schema: Schema<P>,
  privateCredentials: Array<PrivateCredential<P>>,
  zkEngine: ZKEngine<ZP>,
  holder: string,
  holderPrivateKey: ECCPrivateKeyInterface<P>,
  vcSingleFieldProofWasmPath: string,
  vcSingleFieldProofZkeyPath: string,
): Promise<VCPresentation<P, ZP>> {
  if (schema.credentialChecks.length !== privateCredentials.length) {
    throw VCSynthesisError.NotEnoughCredentials;
  }

  // // SMT roots
  // signal input credentialRoot;
  // signal input schemaCheckRoot;
  // // the credentials below must MATCH the schema checks
  // signal input credentialFieldIndex;
  // signal input credentialFieldProof[SMT_LEVEL + 1]; // [fValue, siblings...]
  // signal input credentialFieldValue[MAX_VALUE_CHUNK]; // [raw data]
  // // schema checks
  // signal input schemaCheckFieldIndex;
  // signal input schemaCheckFieldProof[SMT_LEVEL + 1]; // [fValue, siblings...]
  // signal input schemaCheckFieldValue[MAX_VALUE_CHUNK]; // [raw data]
  // signal input schemaCheckFieldOperation; //

  const fieldValidationProofs: Array<
    Array<SingleCredentialFieldValidationSnarkProof<P, ZP>>
  > = [];

  for (let i = 0; i < schema.credentialChecks.length; ++i) {
    if (!evaluateCheck(schema.credentialChecks[i], privateCredentials[i])) {
      throw VCSynthesisError.Unsatisfiable;
    }
    const fieldValidationProofsInCurrentCredential: Array<
      SingleCredentialFieldValidationSnarkProof<P, ZP>
    > = [];

    const {
      fieldIndexes: credentialFieldIndexes,
      smt: credentialSMT,
      keyValuePairs: credentialKeyValuePairs,
    } = await jsonDataToFieldSMT(privateCredentials[i].credentialSubject);
    const {
      fieldIndexes: schemaCheckFieldIndexes,
      smt: checkSMT,
      keyValuePairs: schemaCheckKeyValuePairs,
    } = await jsonDataToFieldSMT(
      schema.credentialChecks[i].fieldValidationObject,
      true,
    );

    for (let j = 0; j < schemaCheckFieldIndexes.length; ++j) {
      const schemaCheckFieldIndex = schemaCheckFieldIndexes[j];

      const indexS = schemaCheckFieldIndex.fieldIndex;
      const credentialFieldIndex = credentialFieldIndexes.find(
        (x) => x.fieldName === schemaCheckFieldIndex.fieldName,
      );
      if (credentialFieldIndex) {
        const indexC = credentialFieldIndex.fieldIndex;
        const publicInputs = new SingleCredentialFieldValidationPublicInput({
          credentialRoot: credentialSMT.root,
          schemaCheckRoot: checkSMT.root,
          //
          credentialFieldIndex: indexC,
          schemaCheckFieldIndex: indexS,
          //
          schemaCheckFieldOperation: getOpId(schemaCheckKeyValuePairs[j][1][0]),
        });

        const credentialFieldValue = convertTo256BitNumber(
          credentialKeyValuePairs[indexC - 1][1],
        );
        const credentialFieldValueEncoding = encodeChunksToField(
          credentialSMT.F,
          credentialFieldValue,
        );

        const schemaCheckFieldValue = convertTo256BitNumber(
          schemaCheckKeyValuePairs[indexS - 1][1][1],
        );
        const schemaCheckFieldValueEncoding = encodeChunksToField(
          checkSMT.F,
          schemaCheckFieldValue,
        );

        const privateInputs = new SingleCredentialFieldValidationPrivateInput({
          ...publicInputs,
          credentialFieldProof: [
            credentialFieldValueEncoding,
            ...(await getSiblings(credentialSMT, credentialSMT.F.e(indexC))),
          ],
          schemaCheckFieldProof: [
            schemaCheckFieldValueEncoding,
            ...(await getSiblings(checkSMT, checkSMT.F.e(indexS))),
          ],
          credentialFieldValue,
          schemaCheckFieldValue,
        });

        const {
          proof: snarkProof,
          publicSignals: _publicSignals,
        }: { proof: ZP; publicSignals: snarkjs.PublicSignals } =
          await zkEngine.fullProve(
            privateInputs.toCircuitSignals(),
            // test,
            vcSingleFieldProofWasmPath,
            vcSingleFieldProofZkeyPath,
          );

        fieldValidationProofsInCurrentCredential.push(
          new SingleCredentialFieldValidationSnarkProof({
            ...publicInputs,
            snarkProof,
          }),
        );
      } else {
        throw VCSynthesisError.BadAssignment;
      }
    }

    fieldValidationProofs.push(fieldValidationProofsInCurrentCredential);
  }

  // get requested fields
  const requestedFieldValues: Array<any> = [];

  for (let i = 0; i < schema.requestedFields.length; ++i) {
    const [credentialIndexStr, fieldName] =
      schema.requestedFields[i].split(':');
    if (
      !isInt(Number(credentialIndexStr)) ||
      !fieldName ||
      Number(credentialIndexStr) < 0 ||
      Number(credentialIndexStr) >= schema.credentialChecks.length
    ) {
      throw VCSynthesisError.InvalidSchemaRequestedFields;
    }
    const credentialIndex = Number(credentialIndexStr);
    const credentialKeyValuePairs = flattenJson(
      privateCredentials[credentialIndex].credentialSubject,
    );
    const field = credentialKeyValuePairs.find((x) => x[0] === fieldName);
    if (!field) {
      throw VCSynthesisError.SchemaRequestedFieldsUnsatisfiable;
    }
    requestedFieldValues.push(field[1]);
  }

  //
  const encryptedData = ECCUtility.ecdhEncrypt(
    holderPrivateKey,
    ECCUtility.newPublicKey(schema.verifierPublicKey),
    JSONStringify(requestedFieldValues),
  );

  // id: string;
  // holder: string;
  // credentials: Array<PublicCredential<P>>;
  // schema: SchemaWithFieldCheckProofs<P, ZP>;
  // encryptedData: string;
  // signatureProof: DataSignature<P>;

  const vcPresentationWithoutSignature = {
    holder,
    publicCredentials: privateCredentials.map((x) => x.toPublicCredential()),
    schema: schema.clone(),
    encryptedData,
    fieldValidationProofs,
  };

  const vcPresentationWithSignature = buildDataWithSignature(
    vcPresentationWithoutSignature,
    holderPrivateKey,
  );

  return new VCPresentation({
    ...vcPresentationWithSignature,
  });
}

export function verifyVCPresentationFormat<
  P extends ECCCurvePoint,
  ZP extends ZKProof,
>(vcpresentation: VCPresentation<P, ZP>): boolean {
  if (!verifyValidSchema(vcpresentation.schema)) {
    throw VCSynthesisError.InvalidSchema;
  }

  if (
    vcpresentation.schema.credentialChecks.length !=
      vcpresentation.publicCredentials.length ||
    vcpresentation.schema.credentialChecks.length !=
      vcpresentation.fieldValidationProofs.length
  ) {
    throw VCSynthesisError.InvalidVCPresentation;
  }
  for (let i = 0; i < vcpresentation.schema.credentialChecks.length; ++i) {
    if (
      vcpresentation.schema.credentialChecks[i].fieldIndexes.length !=
      vcpresentation.fieldValidationProofs[i].length
    ) {
      throw VCSynthesisError.InvalidVCPresentation;
    }
  }

  for (let i = 0; i < vcpresentation.fieldValidationProofs.length; ++i) {
    for (let j = 0; j < vcpresentation.fieldValidationProofs[i].length; ++j) {
      const schemaCheckFieldIndex =
        vcpresentation.schema.credentialChecks[i].fieldIndexes[j];
      const credentialFieldIndex = vcpresentation.publicCredentials[
        i
      ].fieldIndexes.find(
        (x) => x.fieldName === schemaCheckFieldIndex.fieldName,
      );
      if (!credentialFieldIndex) {
        throw VCSynthesisError.InvalidVCPresentation;
      }
    }
  }

  return true;
}

export async function verifyVCPresentation<
  P extends ECCCurvePoint,
  ZP extends ZKProof,
>(
  vcpresentation: VCPresentation<P, ZP>,
  schema: Schema<P>,
  zkEngine: ZKEngine<ZP>,
  vKey: JSON,
): Promise<boolean> {
  /// check signatures & format
  verifyVCPresentationFormat(vcpresentation);
  if (JSONStringify(schema) != JSONStringify(vcpresentation.schema)) {
    throw VCSynthesisError.InvalidVCPresentation;
  }

  for (let i = 0; i < vcpresentation.fieldValidationProofs.length; ++i) {
    const {
      fieldIndexes: _schemaCheckFieldIndexes,
      smt: _checkSMT,
      keyValuePairs: schemaCheckKeyValuePairs,
    } = await jsonDataToFieldSMT(
      vcpresentation.schema.credentialChecks[i].fieldValidationObject,
      true,
    );

    for (let j = 0; j < vcpresentation.fieldValidationProofs[i].length; ++j) {
      const { snarkProof } = vcpresentation.fieldValidationProofs[i][j];
      const schemaCheckFieldIndex =
        vcpresentation.schema.credentialChecks[i].fieldIndexes[j];
      const indexS = schemaCheckFieldIndex.fieldIndex;
      const credentialFieldIndex = vcpresentation.publicCredentials[
        i
      ].fieldIndexes.find(
        (x) => x.fieldName === schemaCheckFieldIndex.fieldName,
      );
      if (credentialFieldIndex) {
        const indexC = credentialFieldIndex.fieldIndex;
        const publicInputs = new SingleCredentialFieldValidationPublicInput({
          credentialRoot: vcpresentation.publicCredentials[i].fieldMerkleRoot,
          schemaCheckRoot:
            vcpresentation.schema.credentialChecks[i].fieldMerkleRoot,
          //
          credentialFieldIndex: indexC,
          schemaCheckFieldIndex: indexS,
          //
          schemaCheckFieldOperation: getOpId(schemaCheckKeyValuePairs[j][1][0]),
        });

        if (
          !(await zkEngine.verify(
            vKey,
            publicInputs.toPublicSignals(),
            snarkProof,
          ))
        )
          throw VCSynthesisError.UnsatisfiableVCPresentation;
      } else {
        throw VCSynthesisError.InvalidVCPresentation;
      }
    }
  }

  return true;
}

export async function getRequestedFieldsFromVCPresentation<
  P extends ECCCurvePoint,
  ZP extends ZKProof,
>(
  vcpresentation: VCPresentation<P, ZP>,
  verifierPrivateKey: ECCPrivateKeyInterface<P>,
): Promise<Array<any>> {
  const data = ECCUtility.ecdhDecrypt(
    verifierPrivateKey,
    ECCUtility.newPublicKey(
      vcpresentation.publicCredentials[0].holderPublicKey,
    ),
    vcpresentation.encryptedData,
  );
  return JSON.parse(data);
}
