import { newMemEmptyTrie } from 'circomlibjs';
import { FieldString, convertTo256BitNumber } from './input_handling';
import { SchemaInterface, VCSynthesisError } from './schema';
import { evaluate_check, flattenJson, getOpId } from './main';
import { CredentialInterface } from './credential';

export const MAX_VALUE_CHUNK = 4;
const MAX_NUM_CHECKS = 2;
const MAX_CHECK_SIZE = 3;
const SMT_LEVEL = 6;

const getSiblings = async (tree: any, key: number) => {
  const res = await tree.find(key);
  const siblings = res.siblings;
  while (siblings.length < SMT_LEVEL) siblings.push(0);

  return siblings;
};

const D123 = (x: number, y = -1, z = -1): Array<any> => {
  const a = [];
  for (let i = 0; i < x; ++i) {
    if (y < 0) a.push(0);
    else {
      a.push([]);
      for (let j = 0; j < y; ++j) {
        if (z < 0) a[i].push(0);
        else {
          a[i].push([]);
          for (let k = 0; k < z; ++k) a[i][j].push(0);
        }
      }
    }
  }
  return a;
};

function flattenArraysRecursive(arrays: Array<any>) {
  let flattenedArray: any[] = [];

  arrays.forEach((item: any) => {
    if (Array.isArray(item)) {
      flattenedArray = flattenedArray.concat(flattenArraysRecursive(item));
    } else {
      flattenedArray.push(item);
    }
  });

  return flattenedArray;
}

function byteArrayToBigInt(byteArray: Array<number>): bigint {
  let res = 0n;
  for (let i = 0; i < byteArray.length; ++i) {
    res = BigInt(256) * res + BigInt(byteArray[i]);
  }
  return res;
}

export function fieldToBigInt(fieldVal: any): bigint {
  const tmp = JSON.parse('[' + fieldVal.toString() + ']');
  tmp.reverse();
  return byteArrayToBigInt(tmp);
}

// return a string representation of a field point
export function encodeChunksToField(Fr: any, chunks: Array<any>) {
  // const chunks = convertTo256BitNumber(x)
  const base = Fr.e(
    '21888242871839275222246405745257275088548364400416034343698204186575808495616',
  );

  let result = Fr.e(0);

  for (let i = chunks.length - 1; i >= 0; --i) {
    result = Fr.add(Fr.mul(result, base), Fr.e(chunks[i]));
  }

  return result;
}

export interface VCSMTProof {
  credentialSMTs: Array<any>;
  schemaCheckSMTs: Array<any>;
  requestedValues: Array<any>;
  keyMapCredential: Array<any>;
  keyMapSchemaCheck: Array<any>;
}

export function buildKeyMap(obj: any) {
  const keyMap = {};
  const fieldsArray = flattenJson(obj);
  //
  for (let j = 0; j < fieldsArray.length; ++j) {
    const key = fieldsArray[j][0];
    if (!(key in keyMap))
      (keyMap as any)[key as any] = Object.entries(keyMap).length + 2;
  }

  return keyMap;
}

export function ignoreFields(x: any, fields: Array<string>) {
  const newX = { ...x };
  Object.assign(newX, x);
  for (let i = 0; i < fields.length; i++) {
    if (Object.prototype.hasOwnProperty.call(newX, fields[i])) {
      delete newX[fields[i]];
    }
  }
  return newX;
}
export async function generate_smt_proof(
  schema: SchemaInterface,
  credentials: CredentialInterface[],
): Promise<VCSMTProof> {
  if (schema.checks.length !== credentials.length) {
    throw VCSynthesisError.BadAssignment;
  }

  const vcSMT: VCSMTProof = {
    credentialSMTs: [],
    schemaCheckSMTs: [],
    requestedValues: [],
  } as VCSMTProof;

  vcSMT['keyMapCredential'] = [];
  vcSMT['keyMapSchemaCheck'] = [];

  for (let i = 0; i < schema.checks.length; ++i) {
    if (!evaluate_check(schema.checks[i], credentials[i])) {
      throw VCSynthesisError.Unsatisfiable;
    }

    {
      const standardPublicCred = ignoreFields(credentials[i], [
        'id',
        'fieldIndexes',
        'encryptedData',
        'proof',
        'fieldMerkleRoot',
      ]);
      vcSMT['keyMapCredential'].push(buildKeyMap(standardPublicCred));
      const keyMap = vcSMT['keyMapCredential'][i];
      // generate SMT root for the current credentital

      const credFieldsArray = flattenJson(standardPublicCred);
      const credSMT = await newMemEmptyTrie(); //
      const credentialSMTProofMap = {} as any;
      const Fr = credSMT.F;
      await credSMT.insert(Fr.e(1), Fr.e(0)); // Dummy node

      for (let j = 0; j < credFieldsArray.length; ++j) {
        const key = credFieldsArray[j][0];

        const value = credFieldsArray[j][1];
        const fValue: FieldString = convertTo256BitNumber(value);
        const fValueHash = encodeChunksToField(Fr, fValue);

        const insertionProof = await credSMT.insert(
          Fr.e(keyMap[key]),
          fValueHash,
        );

        credentialSMTProofMap[key] = {
          fValue,
          fValueHash,
          key,
          value,
          insertionProof,
          fKey: keyMap[key],
        };
      }

      credentialSMTProofMap['tree'] = credSMT;

      vcSMT['credentialSMTs'].push(credentialSMTProofMap);
    }

    {
      vcSMT['keyMapSchemaCheck'].push(buildKeyMap(schema.checks[i]));
      const keyMap = vcSMT['keyMapSchemaCheck'][i];
      /// generate SMT root for the current schema check
      const checkFieldsArray = flattenJson(schema.checks[i]);
      const checkSMT = await newMemEmptyTrie(); //
      const checkSMTProofMap = {} as any;
      const Fr = checkSMT.F;
      await checkSMT.insert(Fr.e(1), Fr.e(0)); // Dummy node

      for (let j = 0; j < checkFieldsArray.length; ++j) {
        const key = checkFieldsArray[j][0];
        const operatorId = getOpId(checkFieldsArray[j][1][0]);
        const value = checkFieldsArray[j][1][1]; // compared_value
        const fValue: FieldString = convertTo256BitNumber(value);
        const fValueHash = encodeChunksToField(Fr, fValue);
        const insertionProof = await checkSMT.insert(
          Fr.e(keyMap[key]),
          fValueHash,
        );

        checkSMTProofMap[key] = {
          fValue,
          fValueHash,
          key,
          value,
          insertionProof,
          operatorId,
          fKey: keyMap[key],
        };
      }

      checkSMTProofMap['tree'] = checkSMT;
      vcSMT['schemaCheckSMTs'].push(checkSMTProofMap);
    }
  }

  console.log('All checks passed!');

  for (const requestStr of schema.requests) {
    const fields = requestStr.split('.');

    if (fields.length <= 0) {
      throw VCSynthesisError.InvalidSchema;
    }

    const fieldPath = fields.slice(1).join('.');

    const index = Number(fields[0]);
    if (isNaN(index) || index >= schema.checks.length) {
      throw VCSynthesisError.InvalidSchema;
    }

    const keyMap = vcSMT['keyMapCredential'][index];

    // generate SMT proof for the current requested field

    if (!(fieldPath in keyMap)) {
      throw new Error(`Requested field ${requestStr} not exists`);
    }
    vcSMT['requestedValues'].push({
      credential_index: index,
      fieldPath,
    });
  }

  return vcSMT;
}

const toObjectArray = (arr: Array<any>, Fr: any): Array<any> => {
  for (let i = 0; i < arr.length; ++i) {
    if (arr[i] !== 0) {
      if (Array.isArray(arr[i])) arr[i] = toObjectArray(arr[i], Fr);
      else arr[i] = Fr.toObject(arr[i]);
    }
  }
  return arr;
};

export const generate_prover_inputs = async (
  schema: SchemaInterface,
  credentials: CredentialInterface[],
  Fr: any,
  // vcVerifierCircuit,
): Promise<any> => {
  const vcSMT = await generate_smt_proof(schema, credentials);

  // SMT roots
  // signal input credentialRoots[MAX_NUM_CHECKS];
  // signal input schemaCheckRoots[MAX_NUM_CHECKS];
  // signal input requestedCredentialRoots[MAX_NUM_CHECKS];
  // // the credentials below must MATCH the schema checks
  // signal input credentialsProof[MAX_NUM_CHECKS][MAX_CHECK_SIZE][SMT_LEVEL + 1]; // [fValue, siblings...]
  // signal input credentialsFieldIndex[MAX_NUM_CHECKS][MAX_CHECK_SIZE]; // fKey
  // signal input credentialsValue[MAX_NUM_CHECKS][MAX_CHECK_SIZE][MAX_VALUE_CHUNK]; // [raw data]
  // // schema checks
  // signal input schemaChecksProof[MAX_NUM_CHECKS][MAX_CHECK_SIZE][SMT_LEVEL + 1]; // [fKey, fValue, siblings...]
  // signal input schemaChecksFieldIndex[MAX_NUM_CHECKS][MAX_CHECK_SIZE]; // fKey
  // signal input schemaChecksValue[MAX_NUM_CHECKS][MAX_CHECK_SIZE][MAX_VALUE_CHUNK]; // [raw data]
  // signal input schemaChecksOperation[MAX_NUM_CHECKS][MAX_CHECK_SIZE]; //
  // // schema checks
  // signal input requestedValue[MAX_NUM_CHECKS][MAX_VALUE_CHUNK]; // [raw data] -> generated from credentials
  // signal input requestedCredentialFieldIndex[MAX_NUM_CHECKS]; // public
  // signal input requestedCredentialProof[MAX_NUM_CHECKS][SMT_LEVEL + 1]; // [fValue, siblings...]

  let credentialRoots = D123(MAX_NUM_CHECKS);
  let schemaCheckRoots = D123(MAX_NUM_CHECKS);
  let requestedCredentialRoots = D123(MAX_NUM_CHECKS);

  let credentialsProof = D123(MAX_NUM_CHECKS, MAX_CHECK_SIZE, SMT_LEVEL + 1);
  let credentialsValue = D123(MAX_NUM_CHECKS, MAX_CHECK_SIZE, MAX_VALUE_CHUNK);
  let credentialsFieldIndex = D123(MAX_NUM_CHECKS, MAX_CHECK_SIZE); // fKey

  let schemaChecksProof = D123(MAX_NUM_CHECKS, MAX_CHECK_SIZE, SMT_LEVEL + 1);
  let schemaChecksValue = D123(MAX_NUM_CHECKS, MAX_CHECK_SIZE, MAX_VALUE_CHUNK);
  let schemaChecksFieldIndex = D123(MAX_NUM_CHECKS, MAX_CHECK_SIZE); // fKey

  let schemaChecksOperation = D123(MAX_NUM_CHECKS, MAX_CHECK_SIZE);
  let requestedValue = D123(MAX_NUM_CHECKS, MAX_VALUE_CHUNK);
  let requestedCredentialProof = D123(MAX_NUM_CHECKS, SMT_LEVEL + 1);
  let requestedCredentialFieldIndex = D123(MAX_NUM_CHECKS);

  const requestedRawValues = [];

  // initialize dummy SMT proofs
  const dummyTree = await newMemEmptyTrie(); //
  await dummyTree.insert((Fr as any).e(1), (Fr as any).e(0)); // Dummy node

  for (let i = 0; i < MAX_NUM_CHECKS; ++i) {
    for (let j = 0; j < MAX_CHECK_SIZE; ++j) {
      let curTree =
        i < schema.checks.length ? vcSMT['schemaCheckSMTs'][i].tree : dummyTree;
      schemaChecksProof[i][j] = [Fr.e(0), ...(await getSiblings(curTree, 1))];
      //
      curTree =
        i < schema.checks.length ? vcSMT['credentialSMTs'][i].tree : dummyTree;
      credentialsProof[i][j] = [Fr.e(0), ...(await getSiblings(curTree, 1))];

      credentialsFieldIndex[i][j] = schemaChecksFieldIndex[i][j] = Fr.e(1);
    }
    requestedCredentialProof[i] = [
      Fr.e(0),
      ...(await getSiblings(dummyTree, 1)),
    ];
    requestedCredentialFieldIndex[i] = Fr.e(1);
    schemaCheckRoots[i] =
      credentialRoots[i] =
      requestedCredentialRoots[i] =
        dummyTree.root;
  }

  for (let i = 0; i < vcSMT['requestedValues'].length; ++i) {
    const cred_index = vcSMT['requestedValues'][i].credential_index;
    const fieldPath = vcSMT['requestedValues'][i].fieldPath;

    requestedCredentialRoots[i] =
      vcSMT['credentialSMTs'][cred_index]['tree'].root;
    const keyMap = vcSMT['keyMapCredential'][cred_index];
    const keyId = keyMap[fieldPath];

    requestedCredentialProof[i] = [
      vcSMT['credentialSMTs'][cred_index][fieldPath].fValueHash,
      ...(await getSiblings(vcSMT['credentialSMTs'][cred_index].tree, keyId)),
    ];

    requestedCredentialFieldIndex[i] = Fr.e(keyId);
    requestedValue[i] = vcSMT['credentialSMTs'][cred_index][
      fieldPath
    ].fValue.map((x) => Fr.e(x));
    requestedRawValues.push(
      vcSMT['credentialSMTs'][cred_index][fieldPath].value,
    );
  }

  for (let i = 0; i < MAX_NUM_CHECKS; ++i) {
    if (i >= vcSMT['schemaCheckSMTs'].length) break;

    schemaCheckRoots[i] = vcSMT['schemaCheckSMTs'][i]['tree'].root;
    credentialRoots[i] = vcSMT['credentialSMTs'][i]['tree'].root;

    const keyMapCredential = vcSMT['keyMapCredential'][i];
    const keyMapSchemaCheck = vcSMT['keyMapSchemaCheck'][i];

    let j = 0;
    for (const key in vcSMT['schemaCheckSMTs'][i]) {
      if (key == 'tree') continue;

      schemaChecksProof[i][j] = [
        vcSMT['schemaCheckSMTs'][i][key].fValueHash,
        ...(await getSiblings(
          vcSMT['schemaCheckSMTs'][i].tree,
          keyMapSchemaCheck[key],
        )),
      ];
      schemaChecksFieldIndex[i][j] = Fr.e(keyMapSchemaCheck[key]);

      credentialsProof[i][j] = [
        vcSMT['credentialSMTs'][i][key].fValueHash,
        ...(await getSiblings(
          vcSMT['credentialSMTs'][i].tree,
          keyMapCredential[key],
        )),
      ];
      credentialsFieldIndex[i][j] = Fr.e(keyMapCredential[key]);

      schemaChecksOperation[i][j] = Fr.e(
        vcSMT['schemaCheckSMTs'][i][key].operatorId,
      );

      credentialsValue[i][j] = vcSMT['credentialSMTs'][i][key].fValue.map((x) =>
        Fr.e(x),
      );
      schemaChecksValue[i][j] = vcSMT['schemaCheckSMTs'][i][key].fValue.map(
        (x) => Fr.e(x),
      );
      ++j;
    }
  }

  credentialRoots = toObjectArray(credentialRoots, Fr);
  schemaCheckRoots = toObjectArray(schemaCheckRoots, Fr);
  credentialsProof = toObjectArray(credentialsProof, Fr);
  credentialsValue = toObjectArray(credentialsValue, Fr);
  credentialsFieldIndex = toObjectArray(credentialsFieldIndex, Fr);

  schemaChecksProof = toObjectArray(schemaChecksProof, Fr);
  schemaChecksValue = toObjectArray(schemaChecksValue, Fr);
  schemaChecksOperation = toObjectArray(schemaChecksOperation, Fr);
  schemaChecksFieldIndex = toObjectArray(schemaChecksFieldIndex, Fr);
  //
  requestedCredentialRoots = toObjectArray(requestedCredentialRoots, Fr);
  requestedCredentialProof = toObjectArray(requestedCredentialProof, Fr);
  requestedCredentialFieldIndex = toObjectArray(
    requestedCredentialFieldIndex,
    Fr,
  );
  requestedValue = toObjectArray(requestedValue, Fr);

  return {
    credentialRoots,
    schemaCheckRoots,
    requestedCredentialRoots,

    credentialsProof,
    credentialsValue,
    credentialsFieldIndex,

    schemaChecksProof,
    schemaChecksValue,
    schemaChecksOperation,
    schemaChecksFieldIndex,

    requestedCredentialProof,
    requestedCredentialFieldIndex,
    requestedValue,
    requestedRawValues,
  };
};

export const verify_presentation_snark_proof = async (
  snarkProof: any,
  schema: SchemaInterface,
  credentials: CredentialInterface[],
  requestedRawValues: Array<any>,
  Fr: any,
  snarkjs,
  verificationKey: JSON,
): Promise<any> => {
  // SMT roots
  // signal input credentialRoots[MAX_NUM_CHECKS];
  // signal input schemaCheckRoots[MAX_NUM_CHECKS];
  // signal input requestedCredentialRoots[MAX_NUM_CHECKS];
  // // the credentials below must MATCH the schema checks
  // signal input credentialsProof[MAX_NUM_CHECKS][MAX_CHECK_SIZE][SMT_LEVEL + 1]; // [fValue, siblings...]
  // signal input credentialsFieldIndex[MAX_NUM_CHECKS][MAX_CHECK_SIZE]; // fKey
  // signal input credentialsValue[MAX_NUM_CHECKS][MAX_CHECK_SIZE][MAX_VALUE_CHUNK]; // [raw data]
  // // schema checks
  // signal input schemaChecksProof[MAX_NUM_CHECKS][MAX_CHECK_SIZE][SMT_LEVEL + 1]; // [fKey, fValue, siblings...]
  // signal input schemaChecksFieldIndex[MAX_NUM_CHECKS][MAX_CHECK_SIZE]; // fKey
  // signal input schemaChecksValue[MAX_NUM_CHECKS][MAX_CHECK_SIZE][MAX_VALUE_CHUNK]; // [raw data]
  // signal input schemaChecksOperation[MAX_NUM_CHECKS][MAX_CHECK_SIZE]; //
  // // schema checks
  // signal input requestedValue[MAX_NUM_CHECKS][MAX_VALUE_CHUNK]; // [raw data] -> generated from credentials
  // signal input requestedCredentialFieldIndex[MAX_NUM_CHECKS]; // public
  // signal input requestedCredentialProof[MAX_NUM_CHECKS][SMT_LEVEL + 1]; // [fValue, siblings...]

  let credentialRoots = D123(MAX_NUM_CHECKS);
  let schemaCheckRoots = D123(MAX_NUM_CHECKS);
  let requestedCredentialRoots = D123(MAX_NUM_CHECKS);

  // let credentialsProof = D123(MAX_NUM_CHECKS, MAX_CHECK_SIZE, SMT_LEVEL + 1)
  // let credentialsValue = D123(MAX_NUM_CHECKS, MAX_CHECK_SIZE, MAX_VALUE_CHUNK)
  let credentialsFieldIndex = D123(MAX_NUM_CHECKS, MAX_CHECK_SIZE); // fKey

  // let schemaChecksProof = D123(MAX_NUM_CHECKS, MAX_CHECK_SIZE, SMT_LEVEL + 1)
  // let schemaChecksValue = D123(MAX_NUM_CHECKS, MAX_CHECK_SIZE, MAX_VALUE_CHUNK)
  let schemaChecksFieldIndex = D123(MAX_NUM_CHECKS, MAX_CHECK_SIZE); // fKey

  let schemaChecksOperation = D123(MAX_NUM_CHECKS, MAX_CHECK_SIZE);
  let requestedValue = D123(MAX_NUM_CHECKS, MAX_VALUE_CHUNK);
  // let requestedCredentialProof = D123(MAX_NUM_CHECKS, SMT_LEVEL + 1)
  let requestedCredentialFieldIndex = D123(MAX_NUM_CHECKS);

  // const requestedRawValues = []

  // initialize dummy SMT proofs
  const dummyTree = await newMemEmptyTrie(); //
  await dummyTree.insert(Fr.e(1), Fr.e(0)); // Dummy node

  for (let i = 0; i < MAX_NUM_CHECKS; ++i) {
    for (let j = 0; j < MAX_CHECK_SIZE; ++j) {
      // let curTree = i < schema.checks.length ? vcSMT['schemaCheckSMTs'][i].tree : dummyTree
      // schemaChecksProof[i][j] = [Fr.e(0), ...(await getSiblings(curTree, 1))]
      //
      // curTree = i < schema.checks.length ? vcSMT['credentialSMTs'][i].tree : dummyTree
      // credentialsProof[i][j] = [Fr.e(0), ...(await getSiblings(curTree, 1))]

      credentialsFieldIndex[i][j] = schemaChecksFieldIndex[i][j] = Fr.e(1);
    }
    // requestedCredentialProof[i] = [Fr.e(0), ...(await getSiblings(dummyTree, 1))]
    requestedCredentialFieldIndex[i] = Fr.e(1);
    schemaCheckRoots[i] =
      credentialRoots[i] =
      requestedCredentialRoots[i] =
        dummyTree.root;
  }

  for (let i = 0; i < schema.requests.length; ++i) {
    const fields = schema.requests[i].split('.');
    if (fields.length <= 0) throw VCSynthesisError.InvalidSchema;
    const fieldPath = fields.slice(1).join('.');

    const cred_index = Number(fields[0]);
    if (isNaN(cred_index) || cred_index >= schema.checks.length) {
      throw VCSynthesisError.InvalidSchema;
    }
    //
    requestedCredentialRoots[i] = Fr.e(
      credentials[cred_index].fieldMerkleRoot,
      16,
    );
    let keyId = -1;
    for (let j = 0; j < credentials[cred_index].fieldIndexes.length; ++j) {
      if (credentials[cred_index].fieldIndexes[j].fieldName === fieldPath) {
        keyId = credentials[cred_index].fieldIndexes[j].fieldIndex;
        break;
      }
    }

    if (keyId < 0) {
      throw VCSynthesisError.BadAssignment; // requested field not exists
    }

    requestedCredentialFieldIndex[i] = Fr.e(keyId);
    const fValue: FieldString = convertTo256BitNumber(requestedRawValues[i]);
    requestedValue[i] = fValue.map((x) => Fr.e(x));
  }

  for (let i = 0; i < MAX_NUM_CHECKS; ++i) {
    if (i >= schema.checks.length) break;

    schemaCheckRoots[i] = Fr.e(schema.checkMerkleRoots[i], 16);
    credentialRoots[i] = Fr.e(credentials[i].fieldMerkleRoot, 16);

    const keyMapSchemaCheck = buildKeyMap(schema.checks[i]);
    const checkFieldsArray = flattenJson(schema.checks[i]);
    let j = 0;
    for (const key in keyMapSchemaCheck) {
      if (key == 'tree') continue;

      schemaChecksFieldIndex[i][j] = Fr.e(keyMapSchemaCheck[key]);

      let keyId = -1;
      for (let j = 0; j < credentials[i].fieldIndexes.length; ++j) {
        if (credentials[i].fieldIndexes[j].fieldName === key) {
          keyId = credentials[i].fieldIndexes[j].fieldIndex;
          break;
        }
      }

      if (keyId < 0) {
        throw VCSynthesisError.BadAssignment; // requested field not exists
      }

      credentialsFieldIndex[i][j] = Fr.e(keyId);

      let operatorId = -1;
      for (let k = 0; k < checkFieldsArray.length; ++k) {
        if (checkFieldsArray[k][0] == key) {
          operatorId = getOpId(checkFieldsArray[k][1][0]);
          break;
        }
      }

      schemaChecksOperation[i][j] = Fr.e(operatorId);
      ++j;
    }
  }

  credentialRoots = toObjectArray(credentialRoots, Fr);
  schemaCheckRoots = toObjectArray(schemaCheckRoots, Fr);
  // credentialsProof = toObjectArray(credentialsProof, Fr)
  // credentialsValue = toObjectArray(credentialsValue, Fr)
  credentialsFieldIndex = toObjectArray(credentialsFieldIndex, Fr);

  // schemaChecksProof = toObjectArray(schemaChecksProof, Fr)
  // schemaChecksValue = toObjectArray(schemaChecksValue, Fr)
  schemaChecksOperation = toObjectArray(schemaChecksOperation, Fr);
  schemaChecksFieldIndex = toObjectArray(schemaChecksFieldIndex, Fr);
  //
  requestedCredentialRoots = toObjectArray(requestedCredentialRoots, Fr);
  // requestedCredentialProof = toObjectArray(requestedCredentialProof, Fr)
  requestedCredentialFieldIndex = toObjectArray(
    requestedCredentialFieldIndex,
    Fr,
  );
  requestedValue = toObjectArray(requestedValue, Fr);

  let publicInputs = [
    0,
    credentialRoots,
    schemaCheckRoots,
    requestedCredentialRoots,
    credentialsFieldIndex,
    schemaChecksFieldIndex,
    schemaChecksOperation,
    requestedValue,
    requestedCredentialFieldIndex,
  ]; // same order as in the circuit

  publicInputs = flattenArraysRecursive(publicInputs)
    .flat()
    .map((x) => x.toString());

  const res = await snarkjs.groth16.verify(
    verificationKey,
    publicInputs,
    snarkProof,
  );

  return res;
};
