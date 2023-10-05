import { newMemEmptyTrie } from 'circomlibjs';
import { ecdhDecrypt, ecdhEncrypt, ecdsaSign, ecdsaVerify } from './crypto_lib';
import {
  buildKeyMap,
  encodeChunksToField,
  generate_prover_inputs,
  ignoreFields,
  verify_presentation_snark_proof,
} from './vc_core';
import {
  CredentialInterface,
  DataSignatureInterface,
  FieldIndexInterface,
  ProofPurpose,
  getPublicCredential,
} from './credential';
import { FieldString, convertTo256BitNumber } from './input_handling';
import { flattenJson } from './main';
import { SchemaInterface, VCSynthesisError } from './schema';
import { VCPresentationInterface } from './presentation';

const JSONStringify = require('json-stable-stringify');
const sha256 = require('crypto-js/sha256');

export interface IssueVCInput {
  issuer: string;
  holder: string;
  issuerPublicKey: string;
  issuerPrivateKey: string;
  holderPublicKey: string;
  types: Array<string>;
  expirationDate?: string;
  credentialSubject: any;
}

export interface SchemaInput {
  name: string;
  verifier: string;
  verifierPublicKey: string;
  verifierPrivateKey: string;
  checks: Array<any>;
  requests: string[];
}

export async function issueVC({
  issuer,
  holder,
  issuerPublicKey,
  issuerPrivateKey,
  holderPublicKey,
  types,
  expirationDate,
  credentialSubject,
}: IssueVCInput): Promise<CredentialInterface> {
  const curDate = new Date().toISOString();
  const fieldIndexes: Array<FieldIndexInterface> = [];

  const tempCred: any = {
    issuer,
    holder,
    issuerPublicKey,
    holderPublicKey,
    types,
    issuanceDate: curDate,
    ...(expirationDate && { expirationDate }),
    fieldIndexes: '',
    encryptedData: '',
    fieldMerkleRoot: '',
    credentialSubject,
  };

  const standardPublicCred = ignoreFields(tempCred, [
    'id',
    'fieldIndexes',
    'encryptedData',
    'proof',
    'fieldMerkleRoot',
  ]);

  const credFieldsArray = flattenJson(standardPublicCred);
  const credSMT = await newMemEmptyTrie();

  const Fr = credSMT.F;
  await credSMT.insert(Fr.e(1), Fr.e(0)); // Dummy node

  const keyMap = buildKeyMap(standardPublicCred);

  for (let j = 0; j < credFieldsArray.length; ++j) {
    const key = credFieldsArray[j][0];

    fieldIndexes.push({
      fieldName: key,
      fieldIndex: keyMap[key],
    } as FieldIndexInterface);

    const value = credFieldsArray[j][1];
    const fValue: FieldString = convertTo256BitNumber(value);
    const fValueHash = encodeChunksToField(Fr, fValue);
    // insert this field into the map
    await credSMT.insert(Fr.e(keyMap[key]), fValueHash);
  }

  delete tempCred.credentialSubject;

  tempCred.fieldMerkleRoot = Fr.toString(credSMT.root, 16);
  tempCred.fieldIndexes = fieldIndexes;
  tempCred.encryptedData = ecdhEncrypt(
    issuerPrivateKey,
    holderPublicKey,
    JSONStringify(credentialSubject),
  );

  const signature = ecdsaSign(issuerPrivateKey, JSONStringify(tempCred));
  const id = sha256(signature).toString();

  const cred: CredentialInterface = {
    ...tempCred,
    id,
    credentialSubject,
    proof: {
      type: 'ECDSA_secp256k1',
      created: curDate,
      proofPurpose: ProofPurpose.ASSERTION,
      value: signature,
      verificationMethod: issuerPublicKey,
    } as DataSignatureInterface,
  };

  return cred;
}

export function verifyValidVC(credential: CredentialInterface): boolean {
  const {
    proof,
    id,
    ...otherFields
  }: {
    proof: DataSignatureInterface;
    credentialSubject?: any;
    id: string;
  } = credential;

  const cred = { ...otherFields } as CredentialInterface;
  const publicFields = {
    ...(cred.id && { id: cred.id }),
    ...(cred.issuer && { issuer: cred.issuer }),
    ...(cred.holder && { holder: cred.holder }),
    ...(cred.issuerPublicKey && { issuerPublicKey: cred.issuerPublicKey }),
    ...(cred.holderPublicKey && { holderPublicKey: cred.holderPublicKey }),
    ...(cred.types && { types: cred.types }),
    ...(cred.issuanceDate && { issuanceDate: cred.issuanceDate }),
    ...(cred.expirationDate && { expirationDate: cred.expirationDate }),
    ...(cred.encryptedData && { encryptedData: cred.encryptedData }),
    ...(cred.fieldIndexes && { fieldIndexes: cred.fieldIndexes }),
    ...(cred.fieldMerkleRoot && { fieldMerkleRoot: cred.fieldMerkleRoot }),
    ...(cred.proof && { proof: cred.proof }),
  } as CredentialInterface;
  const signature = proof.value;

  try {
    const result =
      ecdsaVerify(
        (publicFields as any).issuerPublicKey,
        JSONStringify(publicFields),
        signature,
      ) && id == sha256(signature).toString();

    return result;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export function decryptVC({
  credential,
  holderPrivateKey,
}: {
  credential: CredentialInterface;
  holderPrivateKey: string;
}): CredentialInterface {
  if (!verifyValidVC(credential)) throw VCSynthesisError.InvalidCredential;

  credential.credentialSubject = JSON.parse(
    ecdhDecrypt(
      holderPrivateKey,
      credential.issuerPublicKey,
      credential.encryptedData,
    ),
  );

  return credential;
}

export async function createSchema({
  name,
  verifier,
  verifierPublicKey,
  verifierPrivateKey,
  checks,
  requests,
}: SchemaInput): Promise<SchemaInterface> {
  const curDate = new Date().toISOString();

  const tempSchema: any = {
    name,
    verifier,
    verifierPublicKey,
    issuanceDate: curDate,
    checks,
    requests,
    checkMerkleRoots: [],
  };

  for (let i = 0; i < checks.length; ++i) {
    const schemaCheckFieldArray = flattenJson(checks[i]);
    const checkSMT = await newMemEmptyTrie();

    const Fr = checkSMT.F;
    await checkSMT.insert(Fr.e(1), Fr.e(0)); // Dummy node

    const keyMap = buildKeyMap(checks[i]);

    for (let j = 0; j < schemaCheckFieldArray.length; ++j) {
      const key = schemaCheckFieldArray[j][0];

      const value = schemaCheckFieldArray[j][1][1];
      const fValue: FieldString = convertTo256BitNumber(value);
      const fValueHash = encodeChunksToField(Fr, fValue);
      // insert this field into the map
      await checkSMT.insert(Fr.e(keyMap[key]), fValueHash);
    }
    tempSchema.checkMerkleRoots.push(Fr.toString(checkSMT.root, 16)); // fieldToBigInt(checkSMT.root).toString())
  }

  const signature = ecdsaSign(verifierPrivateKey, JSONStringify(tempSchema));

  const id = sha256(signature).toString();

  const schema: SchemaInterface = {
    ...tempSchema,
    id,
    proof: {
      type: 'ECDSA_secp256k1',
      created: curDate,
      proofPurpose: ProofPurpose.ASSERTION,
      value: signature,
      verificationMethod: verifierPublicKey,
    } as DataSignatureInterface,
  };

  return schema;
}

export function verifyValidSchema(schema: SchemaInterface): boolean {
  const {
    proof,
    id,
    ...publicFields
  }: {
    proof: DataSignatureInterface;
    id: string;
  } = schema;
  const signature = proof.value;

  const result =
    ecdsaVerify(
      (publicFields as any).verifierPublicKey,
      JSONStringify(publicFields),
      signature,
    ) && id == sha256(signature).toString();

  return result;
}

export async function generateVCPresentation({
  holder,
  holderPrivateKey,
  holderPublicKey,
  verifierPublicKey,
  schema,
  credentials,
  Fr,
}: {
  holder: string;
  holderPrivateKey: string;
  holderPublicKey: string;
  verifierPublicKey: string;
  schema: SchemaInterface;
  credentials: CredentialInterface[];
  Fr;
}): Promise<any> {
  const { requestedRawValues, ...snarkInput } = await generate_prover_inputs(
    schema,
    credentials,
    Fr,
  );

  const curDate = new Date().toISOString();

  credentials = credentials.map((x) => getPublicCredential(x));

  const tempPresentation: any = {
    holder,
    schema,
    credentials,
    encryptedData: '',
  };

  tempPresentation.encryptedData = ecdhEncrypt(
    holderPrivateKey,
    verifierPublicKey,
    JSONStringify(requestedRawValues),
  );

  const signature = ecdsaSign(
    holderPrivateKey,
    JSONStringify(tempPresentation),
  );
  const id = sha256(signature).toString();
  const presentation: VCPresentationInterface = {
    ...tempPresentation,
    id,
    proof: {
      type: 'ECDSA_secp256k1',
      created: curDate,
      proofPurpose: ProofPurpose.ASSERTION,
      value: signature,
      verificationMethod: holderPublicKey,
    } as DataSignatureInterface,
  };
  return {
    presentation,
    snarkInput,
  };
}

export async function generateFullVCPresentation({
  holder,
  holderPrivateKey,
  holderPublicKey,
  verifierPublicKey,
  schema,
  credentials,
  Fr,
  snarkjs,
  circuitWasmPath = 'circuits/artifacts/vc_js/vc.wasm',
  citcuitZkeyPath = 'circuits/artifacts/circuit_final.zkey',
}: {
  holder: string;
  holderPrivateKey: string;
  holderPublicKey: string;
  verifierPublicKey: string;
  schema: SchemaInterface;
  credentials: CredentialInterface[];
  Fr: any;
  snarkjs: any;
  circuitWasmPath?: string;
  citcuitZkeyPath?: string;
}): Promise<VCPresentationInterface> {
  const { snarkInput, presentation } = await generateVCPresentation({
    holder: holder,
    holderPrivateKey: holderPrivateKey,
    holderPublicKey: holderPublicKey,
    verifierPublicKey: verifierPublicKey,
    schema,
    credentials,
    Fr,
  });

  console.log('Presentation = ', presentation);

  const { proof /*publicSignals*/ } = await snarkjs.groth16.fullProve(
    snarkInput,
    circuitWasmPath,
    citcuitZkeyPath,
  );
  return {
    ...presentation,
    snarkProof: proof,
  };
}
export function verifyVCPresentationSignatures(
  presentation: VCPresentationInterface,
): boolean {
  const { proof, id, ...otherFields } = presentation;
  const publicFields = ignoreFields(otherFields, ['snarkProof']);
  const { value: signature, verificationMethod: holderPublicKey } = proof;

  try {
    // validate credentials
    const credentials = presentation.credentials;
    const schema = presentation.schema;
    if (
      !(
        ecdsaVerify(holderPublicKey, JSONStringify(publicFields), signature) &&
        id == sha256(signature).toString()
      ) ||
      credentials.length !== schema.checks.length
    )
      throw VCSynthesisError.InvalidVCPresentation; // validate signature & schema

    if (!verifyValidSchema(schema)) {
      throw VCSynthesisError.InvalidSchema;
    }

    for (let i = 0; i < credentials.length; ++i) {
      if (!verifyValidVC(credentials[i])) {
        throw VCSynthesisError.InvalidCredential;
      }
    }
  } catch (err) {
    console.log(err);
    return false;
  }

  return true;
}

export async function verifyVCPresentation({
  verifierPrivateKey,
  schema,
  presentation,
  Fr,
  snarkjs,
  verificationKey,
}: // publicSignals,
{
  verifierPrivateKey: string;
  schema: SchemaInterface;
  presentation: VCPresentationInterface;
  Fr: any;
  snarkjs: any;
  verificationKey: JSON;
}) {
  const { proof, snarkProof } = presentation;
  const { verificationMethod: holderPublicKey } = proof;
  const credentials = presentation.credentials;

  if (
    JSONStringify(presentation.schema) != JSONStringify(schema) ||
    !verifyVCPresentationSignatures(presentation)
  )
    throw VCSynthesisError.InvalidVCPresentation;

  // get raw requested values
  const requestedRawValues = JSON.parse(
    ecdhDecrypt(
      verifierPrivateKey,
      holderPublicKey,
      presentation.encryptedData,
    ),
  );

  if (
    !(await verify_presentation_snark_proof(
      snarkProof,
      schema,
      credentials,
      requestedRawValues,
      Fr,
      snarkjs,
      verificationKey,
    ))
  ) {
    throw VCSynthesisError.BadAssignment;
  }

  // verify using SNARK proof
  return requestedRawValues;
}
