import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { DataSignatureDto } from './issue-vc-info.dto';
import { ActionType } from '@/did/dto/update-trusted-did.dto';

export class SchemaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  @IsNotEmpty()
  name: string; // name of schema

  @ApiProperty()
  @IsNotEmpty()
  verifier: string; // public key with prefix

  @ApiProperty()
  @IsNotEmpty()
  checks: any[];

  @ApiProperty()
  @IsNotEmpty()
  requests: string[];

  @ApiProperty()
  @IsNotEmpty()
  checkMerkleRoots: string[];

  @ApiProperty()
  @IsNotEmpty()
  proof: DataSignatureDto;

  @ApiProperty()
  @IsNotEmpty()
  issuanceDate: string;

  @ApiProperty()
  @IsNotEmpty()
  verifierPublicKey?: string;
}

export class SchemaInputDto {
  @ApiProperty({ enum: ActionType })
  @IsEnum(ActionType)
  action: ActionType;

  @ApiProperty({ enum: ActionType })
  @IsNotEmpty()
  schema: SchemaDto;
}

export class SchemaIdInputDto {
  @ApiProperty()
  @IsNotEmpty()
  schemaId: string;
}
