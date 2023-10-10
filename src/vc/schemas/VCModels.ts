import {
  Prop,
  Schema as SchemaDecorator,
  SchemaFactory,
} from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

import { ProofPurpose } from '@/src/utils/zuni-crypto-library/verifiable_credential/VCInterfaces';
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
import {
  MAX_CHECK_SIZE,
  MAX_NUM_CHECKS,
  VC_SMT_LEVEL,
} from 'library/constants/VCConstants';
import { BaseClassValidator } from 'library/interfaces/BaseClassValidator';
import { ECCCurvePoint } from 'library/interfaces/BasePoint';
import { IsHexadecimalWithoutPrefix } from 'library/interfaces/IsHexadecimalWithoutPrefix';
import { ZKProof } from 'library/interfaces/ZKEngine';

import { BabyJubCurvePoint } from '@/src/utils/zuni-crypto-library/BabyJub/BabyJubBasePoint';
import { InterfaceWithoutMethodsOf } from '@/src/utils/zuni-crypto-library/interfaces/InterfaceWithoutMethodsOf';
import * as snarkjs from 'snarkjs';
type Groth16Proof = snarkjs.Groth16Proof;

export type P = BabyJubCurvePoint;
export type ZP = Groth16Proof;

/////////////////////////// Hydrated Document ///////////////////////////
export type DataSignatureModelDocument = HydratedDocument<
  DataSignatureModel<P>
>;
export type FieldIndexModelDocument = HydratedDocument<FieldIndexModel<P>>;
export type PublicCredentialModelDocument = HydratedDocument<
  PublicCredentialModel<P>
>;
export type SchemaCredentialCheckModelDocument = HydratedDocument<
  SchemaCredentialCheckModel<P>
>;
export type SchemaModelDocument = HydratedDocument<SchemaModel<P>>;
export type SingleCredentialFieldValidationPublicInputModelDocument =
  HydratedDocument<SingleCredentialFieldValidationPublicInputModel<P>>;
export type SingleCredentialFieldValidationSnarkProofModelDocument =
  HydratedDocument<SingleCredentialFieldValidationSnarkProofModel<P, ZP>>;
export type VCPresentationModelDocument = HydratedDocument<
  VCPresentationModel<P, ZP>
>;
///////////////////////////
export class DataSignatureModel<
  P extends ECCCurvePoint,
> extends BaseClassValidator<DataSignatureModel<P>> {
  @ApiProperty()
  @Prop({ type: String })
  type: string;

  @ApiProperty()
  @Prop({ type: String })
  @IsISO8601()
  created: string;

  @ApiProperty()
  @Prop({ enum: ProofPurpose })
  @IsEnum(ProofPurpose)
  proofPurpose: ProofPurpose;

  @ApiProperty()
  @Prop({ type: String })
  @MinLength(1)
  @MaxLength(300)
  value: string;

  @ApiProperty()
  @Prop({ type: String })
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
}
export const DataSignatureMongooseSchema =
  SchemaFactory.createForClass(DataSignatureModel);

// export type DataWithSignatureModel<T, P extends ECCCurvePoint> = T & {
//   id: string;
//   signatureProof: DataSignatureModel<P>;
// };

export class FieldIndexModel<
  P extends ECCCurvePoint,
> extends BaseClassValidator<FieldIndexModel<P>> {
  @ApiProperty()
  @Prop({ type: String })
  fieldName: string;

  @ApiProperty()
  @Prop({ type: Number })
  @IsInt()
  @Min(1)
  @Max(1 << (VC_SMT_LEVEL - 1))
  fieldIndex: number;

  constructor(data: { fieldName: string; fieldIndex: number }) {
    super(data);
    this.fieldName = data.fieldName;
    this.fieldIndex = data.fieldIndex;
  }
}
export const FieldIndexMongooseSchema =
  SchemaFactory.createForClass(FieldIndexModel);

export class PublicCredentialModel<
  P extends ECCCurvePoint,
> extends BaseClassValidator<PublicCredentialModel<P>> {
  @ApiProperty()
  @Prop({ type: String, unique: true })
  id: string;

  @ApiProperty()
  @Prop({ type: String })
  types: string[];

  @ApiProperty()
  @Prop({ type: String })
  issuer: string;

  @ApiProperty()
  @Prop({ type: String })
  holder: string;

  @ApiProperty()
  @Prop({ type: String })
  @Validate(IsHexadecimalWithoutPrefix)
  issuerPublicKey: string;

  @ApiProperty()
  @Prop({ type: String })
  @Validate(IsHexadecimalWithoutPrefix)
  holderPublicKey: string;

  @ApiProperty()
  @Prop({ type: String })
  @IsISO8601()
  issuanceDate: string;

  @ApiProperty()
  @Prop({ type: String })
  @IsISO8601()
  expirationDate?: string;

  @ApiProperty()
  @Prop({ type: [FieldIndexMongooseSchema] })
  fieldIndexes: Array<FieldIndexModel<P>>;

  @ApiProperty()
  @Prop({ type: String })
  fieldMerkleRoot: string;

  @ApiProperty()
  @Prop({ type: String })
  encryptedData: string;

  @ApiProperty()
  @Prop({ type: DataSignatureMongooseSchema })
  signatureProof: DataSignatureModel<P>;

  constructor(data: {
    id: string;
    types: string[];
    issuer: string;
    issuerPublicKey: string;
    holderPublicKey: string;
    holder: string;
    issuanceDate: string;
    expirationDate?: string;
    fieldIndexes: Array<FieldIndexModel<P>>;
    fieldMerkleRoot: string;
    encryptedData: string;
    signatureProof: DataSignatureModel<P>;
  }) {
    super(data);
    this.id = data.id;
    this.types = data.types;
    this.issuer = data.issuer;
    this.holderPublicKey = data.holderPublicKey;
    this.holder = data.holder;
    this.issuanceDate = data.issuanceDate;
    this.expirationDate = data.expirationDate;
    this.fieldIndexes = data.fieldIndexes;
    this.fieldMerkleRoot = data.fieldMerkleRoot;
    this.encryptedData = data.encryptedData;
    this.signatureProof = data.signatureProof;
  }
}

export const PublicCredentialMongooseSchema = SchemaFactory.createForClass(
  PublicCredentialModel,
);

@SchemaDecorator()
export class SchemaCredentialCheckModel<
  P extends ECCCurvePoint,
> extends BaseClassValidator<SchemaCredentialCheckModel<P>> {
  @ApiProperty()
  @Prop({ type: JSON })
  fieldValidationObject: JSON;

  @ApiProperty()
  @Prop({ type: [FieldIndexMongooseSchema] })
  fieldIndexes: Array<FieldIndexModel<P>>;

  @ApiProperty()
  @Prop({ type: [Number] })
  fieldMerkleRoot: Array<number>;

  constructor(data: {
    fieldValidationObject: JSON;
    fieldIndexes: Array<FieldIndexModel<P>>;
    fieldMerkleRoot: Array<number>;
  }) {
    super(data);
    this.fieldValidationObject = data.fieldValidationObject;
    this.fieldIndexes = data.fieldIndexes;
    this.fieldMerkleRoot = Array.from(data.fieldMerkleRoot);
  }
}

export const SchemaCredentialCheckMongooseSchema = SchemaFactory.createForClass(
  SchemaCredentialCheckModel,
);

@SchemaDecorator()
export class SchemaModel<P extends ECCCurvePoint> extends BaseClassValidator<
  SchemaModel<P>
> {
  @ApiProperty()
  @Prop({ type: String, unique: true })
  @IsString()
  id: string;

  @ApiProperty()
  @Prop({ type: String })
  @IsString()
  name: string;

  @ApiProperty()
  @Prop({ type: String })
  @IsString()
  verifier: string;

  @ApiProperty()
  @Prop({ type: [SchemaCredentialCheckMongooseSchema] })
  @IsArray()
  credentialChecks: Array<SchemaCredentialCheckModel<P>>;

  @ApiProperty()
  @Prop({ type: [String] })
  @IsArray()
  requestedFields: string[];

  @ApiProperty()
  @Prop({ type: DataSignatureMongooseSchema })
  signatureProof: DataSignatureModel<P>;

  @ApiProperty()
  @Prop({ type: String })
  @IsString()
  issuanceDate: string;

  @ApiProperty()
  @Prop({ type: String })
  @Validate(IsHexadecimalWithoutPrefix)
  verifierPublicKey: string;

  constructor(data: {
    id: string;
    name: string;
    verifier: string;
    credentialChecks: Array<SchemaCredentialCheckModel<P>>;
    requestedFields: string[];
    signatureProof: DataSignatureModel<P>;
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
}

export const SchemaMongooseSchema = SchemaFactory.createForClass(SchemaModel);

@SchemaDecorator()
export class SingleCredentialFieldValidationPublicInputModel<
  P extends ECCCurvePoint,
> extends BaseClassValidator<
  SingleCredentialFieldValidationPublicInputModel<P>
> {
  @ApiProperty()
  @Prop()
  credentialRoot: Array<number>;

  @ApiProperty()
  @Prop()
  schemaCheckRoot: Array<number>;

  @ApiProperty()
  @Prop({ type: Number })
  @Min(1)
  @Max(1 << (MAX_CHECK_SIZE - 1))
  credentialFieldIndex: number;

  @ApiProperty()
  @Prop({ type: Number })
  @Min(1)
  @Max(1 << (MAX_CHECK_SIZE - 1))
  schemaCheckFieldIndex: number;

  @ApiProperty()
  @Prop()
  @IsInt()
  @Min(0)
  @Max(6)
  schemaCheckFieldOperation: Array<number>;

  constructor(data: {
    credentialRoot: Array<number>;
    schemaCheckRoot: Array<number>;
    credentialFieldIndex: number;
    schemaCheckFieldIndex: number;
    schemaCheckFieldOperation: Array<number>;
  }) {
    super(data);
    this.credentialRoot = data.credentialRoot;
    this.schemaCheckRoot = data.schemaCheckRoot;
    this.credentialFieldIndex = data.credentialFieldIndex;
    this.schemaCheckFieldIndex = data.schemaCheckFieldIndex;
    this.schemaCheckFieldOperation = data.schemaCheckFieldOperation;
  }
}

export const SingleCredentialFieldValidationPublicInputMongooseSchema =
  SchemaFactory.createForClass(SingleCredentialFieldValidationPublicInputModel);

@SchemaDecorator()
export class SingleCredentialFieldValidationSnarkProofModel<
  P extends ECCCurvePoint,
  ZP extends ZKProof,
> extends SingleCredentialFieldValidationPublicInputModel<P> {
  @ApiProperty()
  @Prop({ type: JSON })
  snarkProof: ZP;

  constructor(
    data: InterfaceWithoutMethodsOf<
      SingleCredentialFieldValidationPublicInputModel<P>
    > & {
      snarkProof: ZP;
    },
  ) {
    super(data);
    this.snarkProof = data.snarkProof;
    this.validateTypeSync();
  }
}

export const SingleCredentialFieldValidationSnarkProofMongooseSchema =
  SchemaFactory.createForClass(SingleCredentialFieldValidationSnarkProofModel);

/// VC
@SchemaDecorator()
export class VCPresentationModel<
  P extends ECCCurvePoint,
  ZP extends ZKProof,
> extends BaseClassValidator<VCPresentationModel<P, ZP>> {
  @ApiProperty()
  @Prop({ type: String, unique: true })
  @IsString()
  id: string;

  @ApiProperty()
  @Prop({ type: String })
  @IsString()
  holder: string;

  @ApiProperty()
  @Prop({ type: [PublicCredentialMongooseSchema] })
  @IsArray()
  publicCredentials: Array<PublicCredentialModel<P>>;

  @ApiProperty()
  @Prop({ type: () => SchemaMongooseSchema })
  schema: SchemaModel<P>;

  @ApiProperty()
  @Prop({
    type: () => [[SingleCredentialFieldValidationSnarkProofMongooseSchema]],
  })
  @IsArray()
  @ArrayMinSize(MAX_NUM_CHECKS)
  @ArrayMaxSize(MAX_NUM_CHECKS)
  fieldValidationProofs: Array<
    Array<SingleCredentialFieldValidationSnarkProofModel<P, ZP>>
  >;

  @ApiProperty()
  @Prop({ type: String })
  @IsString()
  encryptedData: string;

  @ApiProperty()
  @Prop({ type: DataSignatureMongooseSchema })
  signatureProof: DataSignatureModel<P>;

  constructor(data: {
    id: string;
    holder: string;
    publicCredentials: Array<PublicCredentialModel<P>>;
    schema: SchemaModel<P>;
    encryptedData: string;
    signatureProof: DataSignatureModel<P>;
    fieldValidationProofs: Array<
      Array<SingleCredentialFieldValidationSnarkProofModel<P, ZP>>
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
}

export const VCPresentationMongooseSchema =
  SchemaFactory.createForClass(VCPresentationModel);
