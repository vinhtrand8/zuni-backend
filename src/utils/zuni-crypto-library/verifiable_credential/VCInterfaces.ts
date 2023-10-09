import { BigNumberish } from 'circomlibjs';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
} from 'class-validator';
import { FFMathUtility } from 'library/BabyJub/FFMathUtility';
import {
  MAX_CHECK_SIZE,
  MAX_VALUE_CHUNK,
  VC_SMT_LEVEL,
} from 'library/constants/VCConstants';
import { BaseClassValidator } from 'library/interfaces/BaseClassValidator';
import { ECCCurvePoint } from 'library/interfaces/BasePoint';
import { ECCPrivateKeyInterface } from 'library/interfaces/ECCPrivateKey';
import { InterfaceWithoutMethodsOf } from 'library/interfaces/InterfaceWithoutMethodsOf';
import { IsHexadecimalWithoutPrefix } from 'library/interfaces/IsHexadecimalWithoutPrefix';
import { ZKProof } from 'library/interfaces/ZKEngine';
import { ECCUtility } from 'library/utility/ECCUtility';
import { CircuitSignals, PublicSignals } from 'snarkjs';

export enum ProofPurpose {
  ASSERTION = 'ASSERTION',
  AUTHENTICATION = 'AUTHENTICATION',
}

export enum VCSynthesisError {
  InvalidSchemaRequestedFields = 'VCSynthesisError: InvalidSchemaRequestedFields',
  InvalidSchema = 'VCSynthesisError: InvalidSchema',
  InvalidCredential = 'VCSynthesisError: InvalidCredential',
  SchemaRequestedFieldsUnsatisfiable = 'VCSynthesisError: SchemaRequestedFieldsUnsatisfiable',
  Unsatisfiable = 'VCSynthesisError: Unsatisfiable',
  UnsatisfiableVCPresentation = 'VCSynthesisError: UnsatisfiableVCPresentation',
  BadAssignment = 'VCSynthesisError: BadAssignment',
  NotEnoughCredentials = 'VCSynthesisError: NotEnoughCredentials',
  InvalidVCPresentation = 'VCSynthesisError: InvalidVCPresentation',
}
export type FieldString = Array<string>;

/*
  0: eq
  1: neq
  2: lt
  3: geq
  4: gt
  5: leq
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

export class DataSignature<P extends ECCCurvePoint> extends BaseClassValidator<
  DataSignature<P>
> {
  type: string;

  @IsISO8601()
  created: string;

  @IsEnum(ProofPurpose)
  proofPurpose: ProofPurpose;

  @MinLength(1)
  @MaxLength(300)
  value: string;

  @Validate(IsHexadecimalWithoutPrefix)
  verificationMethod: string;

  constructor(data: {
    type: string;
    created: string;
    proofPurpose: ProofPurpose;
    value: string;
    verificationMethod: string;
  }) {
    super(data);
    this.type = data.type;
    this.created = data.created;
    this.proofPurpose = data.proofPurpose;
    this.value = data.value;
    this.verificationMethod = data.verificationMethod;
  }

  clone(): DataSignature<P> {
    return new DataSignature<P>({
      type: this.type,
      created: this.created,
      proofPurpose: this.proofPurpose,
      value: this.value,
      verificationMethod: this.verificationMethod,
    });
  }
}

export type DataWithSignature<T, P extends ECCCurvePoint> = T & {
  id: string;
  signatureProof: DataSignature<P>;
};

export class FieldIndex<P extends ECCCurvePoint> extends BaseClassValidator<
  FieldIndex<P>
> {
  fieldName: string;

  @IsInt()
  @Min(1)
  @Max(1 << (VC_SMT_LEVEL - 1))
  fieldIndex: number;

  constructor(data: { fieldName: string; fieldIndex: number }) {
    super(data);
    this.fieldName = data.fieldName;
    this.fieldIndex = data.fieldIndex;
  }

  clone(): FieldIndex<P> {
    return new FieldIndex<P>({
      fieldName: this.fieldName,
      fieldIndex: this.fieldIndex,
    });
  }
}

export class PublicCredential<
  P extends ECCCurvePoint,
> extends BaseClassValidator<PublicCredential<P>> {
  id: string;
  types: string[];
  issuer: string;
  holder: string;

  @Validate(IsHexadecimalWithoutPrefix)
  issuerPublicKey: string;

  @Validate(IsHexadecimalWithoutPrefix)
  holderPublicKey: string;

  @IsISO8601()
  issuanceDate: string;

  @IsISO8601()
  expirationDate?: string;

  fieldIndexes: Array<FieldIndex<P>>;
  fieldMerkleRoot: string;

  encryptedData: string;
  signatureProof: DataSignature<P>;

  constructor(data: {
    id: string;
    types: string[];
    issuer: string;
    issuerPublicKey: string;
    holderPublicKey: string;
    holder: string;
    issuanceDate: string;
    expirationDate?: string;
    fieldIndexes: Array<FieldIndex<P>>;
    fieldMerkleRoot: string;
    encryptedData: string;
    signatureProof: DataSignature<P>;
  }) {
    super(data);
    this.id = data.id;
    this.types = data.types;
    this.issuer = data.issuer;
    this.issuerPublicKey = data.issuerPublicKey;
    this.holderPublicKey = data.holderPublicKey;
    this.holder = data.holder;
    this.issuanceDate = data.issuanceDate;
    this.expirationDate = data.expirationDate;
    this.fieldIndexes = data.fieldIndexes;
    this.fieldMerkleRoot = data.fieldMerkleRoot;
    this.encryptedData = data.encryptedData;
    this.signatureProof = data.signatureProof;
  }

  clone(): PublicCredential<P> {
    return new PublicCredential<P>({
      id: this.id,
      types: this.types,
      issuer: this.issuer,
      issuerPublicKey: this.issuerPublicKey,
      holderPublicKey: this.holderPublicKey,
      holder: this.holder,
      issuanceDate: this.issuanceDate,
      expirationDate: this.expirationDate,
      fieldIndexes: this.fieldIndexes.map((fieldIndex) => fieldIndex.clone()),
      fieldMerkleRoot: this.fieldMerkleRoot,
      encryptedData: this.encryptedData,
      signatureProof: this.signatureProof.clone(),
    });
  }
}

export class PrivateCredential<
  P extends ECCCurvePoint,
> extends PublicCredential<P> {
  credentialSubject: JSON;

  constructor(
    data: InterfaceWithoutMethodsOf<PublicCredential<P>> & {
      credentialSubject: JSON;
    },
  ) {
    super(data);
    this.credentialSubject = data.credentialSubject;
    this.validateTypeSync();
  }

  clone(): PrivateCredential<P> {
    return new PrivateCredential<P>({
      ...(super.clone() as InterfaceWithoutMethodsOf<PublicCredential<P>>),
      credentialSubject: Object.assign({}, this.credentialSubject),
    });
  }

  toPublicCredential(): PublicCredential<P> {
    return super.clone();
  }
}

export class SchemaCredentialCheck<
  P extends ECCCurvePoint,
> extends BaseClassValidator<SchemaCredentialCheck<P>> {
  fieldValidationObject: JSON;
  fieldIndexes: Array<FieldIndex<P>>;
  fieldMerkleRoot: BigNumberish;

  constructor(data: {
    fieldValidationObject: JSON;
    fieldIndexes: Array<FieldIndex<P>>;
    fieldMerkleRoot: BigNumberish;
  }) {
    super(data);
    this.fieldValidationObject = data.fieldValidationObject;
    this.fieldIndexes = data.fieldIndexes;
    this.fieldMerkleRoot = data.fieldMerkleRoot;
  }

  clone(): SchemaCredentialCheck<P> {
    return new SchemaCredentialCheck<P>({
      fieldValidationObject: JSON.parse(
        JSON.stringify(this.fieldValidationObject),
      ),
      fieldIndexes: this.fieldIndexes.map((x) => x.clone()),
      fieldMerkleRoot: JSON.parse(JSON.stringify(this.fieldMerkleRoot)),
    });
  }
}

export class Schema<P extends ECCCurvePoint> extends BaseClassValidator<
  Schema<P>
> {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  verifier: string;

  @IsArray()
  credentialChecks: Array<SchemaCredentialCheck<P>>;

  @IsArray()
  requestedFields: string[];

  signatureProof: DataSignature<P>;

  @IsString()
  issuanceDate: string;

  @Validate(IsHexadecimalWithoutPrefix)
  verifierPublicKey: string;

  constructor(data: {
    id: string;
    name: string;
    verifier: string;
    credentialChecks: Array<SchemaCredentialCheck<P>>;
    requestedFields: string[];
    signatureProof: DataSignature<P>;
    issuanceDate: string;
    verifierPublicKey: string;
  }) {
    super(data);
    this.id = data.id;
    this.name = data.name;
    this.verifier = data.verifier;
    this.credentialChecks = data.credentialChecks;
    this.requestedFields = data.requestedFields;
    this.signatureProof = data.signatureProof;
    this.issuanceDate = data.issuanceDate;
    this.verifierPublicKey = data.verifierPublicKey;
  }

  clone(): Schema<P> {
    const {
      id,
      name,
      verifier,
      credentialChecks,
      requestedFields,
      signatureProof,
      issuanceDate,
      verifierPublicKey,
    } = this;
    return new Schema({
      id,
      name,
      verifier,
      credentialChecks: credentialChecks.map((x) => x.clone()),
      requestedFields,
      signatureProof,
      issuanceDate,
      verifierPublicKey,
    });
  }
}
// // SMT roots
// signal input credentialRoot;
// signal input schemaCheckRoot;
// // the credentials below must MATCH the schema credentialChecks
// signal input credentialFieldIndex;
// signal input credentialFieldProof[SMT_LEVEL + 1]; // [fValue, siblings...]
// signal input credentialFieldValue[MAX_VALUE_CHUNK]; // [raw data]
// // schema credentialChecks
// signal input schemaCheckFieldIndex;
// signal input schemaCheckFieldProof[SMT_LEVEL + 1]; // [fValue, siblings...]
// signal input schemaCheckFieldValue[MAX_VALUE_CHUNK]; // [raw data]
// signal input schemaCheckFieldOperation; //

////////// Single field validation interfaces
export class SingleCredentialFieldValidationPublicInput<
  P extends ECCCurvePoint,
> extends BaseClassValidator<SingleCredentialFieldValidationPublicInput<P>> {
  credentialRoot: BigNumberish;
  schemaCheckRoot: BigNumberish;

  @Min(1)
  @Max(1 << (MAX_CHECK_SIZE - 1))
  credentialFieldIndex: number;

  @Min(1)
  @Max(1 << (MAX_CHECK_SIZE - 1))
  schemaCheckFieldIndex: number;

  // @IsInt()
  // @Min(0)
  // @Max(6)
  schemaCheckFieldOperation: BigNumberish;

  constructor(data: {
    credentialRoot: BigNumberish;
    schemaCheckRoot: BigNumberish;
    //
    credentialFieldIndex: number;
    schemaCheckFieldIndex: number;
    //
    schemaCheckFieldOperation: BigNumberish;
  }) {
    super(data);
    this.credentialRoot = data.credentialRoot;
    this.schemaCheckRoot = data.schemaCheckRoot;
    //
    this.credentialFieldIndex = data.credentialFieldIndex;
    this.schemaCheckFieldIndex = data.schemaCheckFieldIndex;
    //
    this.schemaCheckFieldOperation = data.schemaCheckFieldOperation;
  }

  clone(): SingleCredentialFieldValidationPublicInput<P> {
    return new SingleCredentialFieldValidationPublicInput({
      credentialRoot: this.credentialRoot,
      schemaCheckRoot: this.schemaCheckRoot,
      //
      credentialFieldIndex: this.credentialFieldIndex,
      schemaCheckFieldIndex: this.schemaCheckFieldIndex,
      //
      schemaCheckFieldOperation: JSON.parse(
        JSON.stringify(this.schemaCheckFieldOperation),
      ),
    });
  }

  toCircuitSignals(): CircuitSignals {
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
    return {
      credentialRoot: FFMathUtility.F.toString(this.credentialRoot, 10),
      schemaCheckRoot: FFMathUtility.F.toString(this.schemaCheckRoot, 10),
      credentialFieldIndex: FFMathUtility.toCircomFieldNumString(
        this.credentialFieldIndex,
      ),
      schemaCheckFieldIndex: FFMathUtility.toCircomFieldNumString(
        this.schemaCheckFieldIndex,
      ),
      schemaCheckFieldOperation: FFMathUtility.toCircomFieldNumString(
        this.schemaCheckFieldOperation,
      ),
    };
  }

  toPublicSignals(): PublicSignals {
    // signal input credentialRoot;
    // signal input schemaCheckRoot;
    // signal input credentialFieldIndex;
    // signal input schemaCheckFieldIndex;
    // signal input schemaCheckFieldOperation;
    return [
      '0', // padding
      FFMathUtility.toCircomFieldNumString(this.credentialRoot),
      FFMathUtility.toCircomFieldNumString(this.schemaCheckRoot),
      FFMathUtility.toCircomFieldNumString(this.credentialFieldIndex),
      FFMathUtility.toCircomFieldNumString(this.schemaCheckFieldIndex),
      FFMathUtility.toCircomFieldNumString(this.schemaCheckFieldOperation),
    ] as PublicSignals;
  }
}

export class SingleCredentialFieldValidationPrivateInput<
  P extends ECCCurvePoint,
> extends SingleCredentialFieldValidationPublicInput<P> {
  @ArrayMinSize(VC_SMT_LEVEL + 1)
  @ArrayMaxSize(VC_SMT_LEVEL + 1)
  credentialFieldProof: Array<BigNumberish>;

  @ArrayMinSize(MAX_VALUE_CHUNK)
  @ArrayMaxSize(MAX_VALUE_CHUNK)
  credentialFieldValue: Array<BigNumberish>;

  @ArrayMinSize(VC_SMT_LEVEL + 1)
  @ArrayMaxSize(VC_SMT_LEVEL + 1)
  schemaCheckFieldProof: Array<BigNumberish>;

  @ArrayMinSize(MAX_VALUE_CHUNK)
  @ArrayMaxSize(MAX_VALUE_CHUNK)
  schemaCheckFieldValue: Array<BigNumberish>;

  constructor(
    data: InterfaceWithoutMethodsOf<
      SingleCredentialFieldValidationPublicInput<P>
    > & {
      credentialFieldProof: Array<BigNumberish>;
      schemaCheckFieldProof: Array<BigNumberish>;
      //
      credentialFieldValue: Array<BigNumberish>;
      schemaCheckFieldValue: Array<BigNumberish>;
    },
  ) {
    super(data);
    this.credentialFieldProof = data.credentialFieldProof;
    this.schemaCheckFieldProof = data.schemaCheckFieldProof;
    //
    this.credentialFieldValue = data.credentialFieldValue;
    this.schemaCheckFieldValue = data.schemaCheckFieldValue;
    this.validateTypeSync();
  }

  toCircuitSignals(): CircuitSignals {
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
    return {
      ...super.toCircuitSignals(),
      credentialFieldProof: this.credentialFieldProof.map((x) =>
        FFMathUtility.toCircomFieldNumString(x),
      ),
      credentialFieldValue: this.credentialFieldValue.map((x) =>
        FFMathUtility.toCircomFieldNumString(x),
      ),
      schemaCheckFieldProof: this.schemaCheckFieldProof.map((x) =>
        FFMathUtility.toCircomFieldNumString(x),
      ),
      schemaCheckFieldValue: this.schemaCheckFieldValue.map((x) =>
        FFMathUtility.toCircomFieldNumString(x),
      ),
    };
  }

  clone(): SingleCredentialFieldValidationPrivateInput<P> {
    return new SingleCredentialFieldValidationPrivateInput<P>({
      ...(super.clone() as InterfaceWithoutMethodsOf<
        SingleCredentialFieldValidationPublicInput<P>
      >),
      credentialFieldProof: this.credentialFieldProof.map((x) =>
        JSON.parse(JSON.stringify(x)),
      ),
      schemaCheckFieldProof: this.schemaCheckFieldProof.map((x) =>
        JSON.parse(JSON.stringify(x)),
      ),
      //
      credentialFieldValue: JSON.parse(
        JSON.stringify(this.credentialFieldValue),
      ),
      schemaCheckFieldValue: JSON.parse(
        JSON.stringify(this.schemaCheckFieldValue),
      ),
    });
  }
}

export class SingleCredentialFieldValidationSnarkProof<
  P extends ECCCurvePoint,
  ZP extends ZKProof,
> extends SingleCredentialFieldValidationPublicInput<P> {
  snarkProof: ZP;

  constructor(
    data: InterfaceWithoutMethodsOf<
      SingleCredentialFieldValidationPublicInput<P>
    > & {
      snarkProof: ZP;
    },
  ) {
    super(data);
    this.snarkProof = data.snarkProof;
    this.validateTypeSync();
  }

  clone(): SingleCredentialFieldValidationSnarkProof<P, ZP> {
    return new SingleCredentialFieldValidationSnarkProof<P, ZP>({
      ...(super.clone() as InterfaceWithoutMethodsOf<
        SingleCredentialFieldValidationPublicInput<P>
      >),
      snarkProof: JSON.parse(JSON.stringify(this.snarkProof)),
    });
  }
}

/// VC
export class VCPresentation<
  P extends ECCCurvePoint,
  ZP extends ZKProof,
> extends BaseClassValidator<VCPresentation<P, ZP>> {
  @IsString()
  id: string;

  @IsString()
  holder: string;

  @IsArray()
  publicCredentials: Array<PublicCredential<P>>;

  schema: Schema<P>;

  @IsArray()
  // @ArrayMinSize(MAX_NUM_CHECKS)
  // @ArrayMaxSize(MAX_NUM_CHECKS)
  fieldValidationProofs: Array<
    Array<SingleCredentialFieldValidationSnarkProof<P, ZP>>
  >;

  @IsString()
  encryptedData: string;

  signatureProof: DataSignature<P>;

  constructor(data: {
    id: string;
    holder: string;
    publicCredentials: Array<PublicCredential<P>>;
    schema: Schema<P>;
    encryptedData: string;
    signatureProof: DataSignature<P>;
    fieldValidationProofs: Array<
      Array<SingleCredentialFieldValidationSnarkProof<P, ZP>>
    >;
  }) {
    super(data);
    this.id = data.id;
    this.holder = data.holder;
    this.publicCredentials = data.publicCredentials;
    this.schema = data.schema;
    this.encryptedData = data.encryptedData;
    this.signatureProof = data.signatureProof;
    this.fieldValidationProofs = data.fieldValidationProofs;
  }

  clone(): VCPresentation<P, ZP> {
    const {
      id,
      holder,
      publicCredentials,
      schema,
      encryptedData,
      signatureProof,
    } = this;
    return new VCPresentation<P, ZP>({
      id,
      holder,
      publicCredentials: publicCredentials.map((x) => x.clone()),
      schema: schema.clone(),
      fieldValidationProofs: this.fieldValidationProofs.map((x) =>
        x.map((y) => y.clone()),
      ),
      encryptedData,
      signatureProof,
    });
  }

  getRawRequestedFieldValues(
    verifierPrivateKey: ECCPrivateKeyInterface<P>,
  ): Array<any> {
    return JSON.parse(
      ECCUtility.ecdhDecrypt(
        verifierPrivateKey,
        ECCUtility.newPublicKey(this.publicCredentials[0].holderPublicKey),
        this.encryptedData,
      ),
    );
  }
}
