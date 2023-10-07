import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ProofPurpose } from '../lib/credential';
import { ActionType } from '@/did/dto/update-trusted-did.dto';

export class DataSignatureDto {
  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsISO8601()
  created: string;

  @ApiProperty()
  @IsEnum(ProofPurpose)
  proofPurpose: ProofPurpose;

  @ApiProperty()
  @IsString()
  value: string;

  @ApiProperty()
  @IsString()
  verificationMethod: string;
}

export class FieldIndexInterfaceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  fieldName: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  fieldIndex: number;
}

export class CredentialDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  types: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  issuer: string; // did

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  issuerPublicKey: string; // public key with prefix

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  holder: string; // did

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  holderPublicKey: string; // public key with prefix

  @ApiProperty()
  @IsISO8601()
  issuanceDate: string;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  fieldIndexes: FieldIndexInterfaceDto[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fieldMerkleRoot: string;

  @ApiProperty()
  @IsOptional()
  @IsISO8601()
  expirationDate?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  encryptedData: string;

  @ApiProperty()
  @IsNotEmpty()
  proof: DataSignatureDto;
}

export class CredentialInputDto {
  @ApiProperty({ enum: ActionType })
  @IsEnum(ActionType)
  action: ActionType;

  @ApiProperty({ enum: ActionType })
  @IsNotEmpty()
  credential: CredentialDto;
}
