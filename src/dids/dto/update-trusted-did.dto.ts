import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export enum ActionType {
  add = 'add',
  remove = 'remove',
}

export class UpdateTrustedDIDDto {
  @ApiProperty({ enum: ActionType })
  @IsEnum(ActionType)
  action: ActionType;

  @ApiProperty()
  @IsString()
  trustedDID: string;
}
