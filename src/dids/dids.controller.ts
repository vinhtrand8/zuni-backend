import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Patch,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { DIDsService } from './dids.service';
import { CreateDIDInfoDto } from './dto/create-did-info.dto';
import { Account } from 'src/auth/decorators/account.decorators';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { DID } from './schemas/did.schema';
import { ActionType, UpdateTrustedDIDDto } from './dto/update-trusted-did.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from 'src/s3/s3.service';
import { TrustedDIDInfo } from './dto/trusted-did-info-dto';
import { UpdateWriteOpResult } from 'mongoose';

@ApiTags('dids')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('dids')
export class DIDsController {
  constructor(
    private readonly didsService: DIDsService,
    private readonly s3Service: S3Service,
  ) {}

  @ApiOkResponse({
    type: DID,
  })
  @Post()
  @UseInterceptors(FileInterceptor('logo'))
  async storeDID(
    @Account() account: DidJwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1_000_000 }),
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      }),
    )
    logo: Express.Multer.File,
    @Body() createDidDto: CreateDIDInfoDto,
  ) {
    try {
      const { wallet, did } = account;
      const existedDID = await this.didsService.getDID(did);
      if (existedDID) {
        throw new Error('DID Profile already existed');
      }

      const imageType = logo.mimetype.split('/').pop();
      const logoName = `${did}.${imageType}`;
      const logoUrl = await this.s3Service.upload(logoName, logo.buffer);
      return await this.didsService.storeDID(
        wallet,
        did,
        createDidDto,
        logoUrl,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({
    type: DID,
  })
  @Get()
  async getDIDInfo(@Account('did') did: string): Promise<DID> {
    return this.didsService.getDID(did);
  }

  @ApiOkResponse({
    type: DID,
  })
  @Get('trusted-dids')
  async getTrustedDIDInfo(
    @Account('did') did: string,
  ): Promise<TrustedDIDInfo[]> {
    try {
      const updatedTrustedDID = await this.didsService.getTrustedDIDInfos(did);
      return updatedTrustedDID;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({
    type: DID,
  })
  @Get(':did')
  async searchTrustedDIDInfo(
    @Param('did') did: string,
  ): Promise<TrustedDIDInfo> {
    try {
      const didInfo = await this.didsService.searchTrustedDIDInfo(did);
      return didInfo;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Patch('trusted-dids')
  async updateTrustedDID(
    @Account('did') did: string,
    @Body() updatedTrustedDto: UpdateTrustedDIDDto,
  ): Promise<UpdateWriteOpResult> {
    try {
      const { action, trustedDID } = updatedTrustedDto;

      switch (action) {
        case ActionType.add:
          return await this.didsService.addTrustedDID(did, trustedDID);
        case ActionType.remove:
          return await this.didsService.removeTrustedDID(did, trustedDID);
        default:
          throw new BadRequestException(
            `Action is not supported. Only support ${Object.values(
              ActionType,
            ).join(', ')}`,
          );
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
