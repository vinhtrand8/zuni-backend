import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CredentialDto, DataSignatureDto } from './issue-vc-info.dto';
import { SchemaDto } from './create-schema.dto';
import { SubmissionStatus } from '../schemas/vc.schema';
import { ActionType } from 'src/dids/dto/update-trusted-did.dto';

export class VCPresentationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  holder: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  credentials: CredentialDto[];

  @ApiProperty()
  @IsNotEmpty()
  schema: SchemaDto;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  encryptedData: string;

  @ApiProperty()
  @IsNotEmpty()
  snarkProof: any;

  @ApiProperty()
  @IsNotEmpty()
  proof: DataSignatureDto;

  // id: string
  // holder: string
  // credentials: CredentialInterface[]
  // schema: Schema
  // requestedRawValues?: any[]
  // encryptedData: string
  // snarkProof: any
  // proof: DataSignatureInterface
}

export class VCPresentationInputDto {
  @ApiProperty({ enum: ActionType })
  @IsEnum(ActionType)
  action: ActionType;

  @ApiProperty({ enum: ActionType })
  @IsNotEmpty()
  vcPresentation: VCPresentationDto;
}

export class ChangeVCPresentationStatusInputDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  schemaIds: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(SubmissionStatus)
  newStatus: SubmissionStatus;
}
