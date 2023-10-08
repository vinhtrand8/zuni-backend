import { InjectModel } from '@nestjs/mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { Auth } from './schemas/auth.schema';
import { TokenAuthDto } from './dto/token-auth.dto';
import { VerifyDIDAuthDto } from './dto/verify-did-auth.dto';
import { VerifyWalletAuthDto } from './dto/verify-wallet-auth.dto';
import { randomBytes, randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { IResolverService } from 'src/resolver/interface.resolver.service';
import { decodeMultibase } from 'src/utils/multibase';
import { keyFromPublicKey } from 'src/utils/ec';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(
    @InjectModel(Auth.name) private readonly authModel: Model<Auth>,
    @Inject(IResolverService)
    private readonly resolverService: IResolverService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.getOrThrow('jwtSecret');
  }

  async verifyToken(token: string): Promise<DidJwtPayload | WalletJwtPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.jwtSecret,
    });
  }

  async requestAuth(): Promise<Auth> {
    const uuid = randomUUID();
    const existedUuid = await this.authModel.findOne({ uuid });
    if (existedUuid) {
      throw new Error('uuid existed');
    }

    const challenge = randomBytes(64).toString('hex');
    const newRequestAuth = new this.authModel({
      uuid,
      challenge,
    });
    return newRequestAuth.save();
  }

  async verifyWalletAuth(
    verifyWalletAuthDto: VerifyWalletAuthDto,
  ): Promise<TokenAuthDto> {
    const { uuid, wallet } = verifyWalletAuthDto;
    const auth = await this.authModel.findOne({ uuid });
    if (!auth) {
      throw new Error('uuid not found');
    }
    const payload: WalletJwtPayload = {
      wallet,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.jwtSecret,
    });
    const tokenAuth: TokenAuthDto = {
      accessToken,
      wallet,
    };

    return tokenAuth;
  }

  async verifyDIDAuth(
    verifyDIDAuthDto: VerifyDIDAuthDto,
  ): Promise<TokenAuthDto> {
    const { uuid, did, authenticationId, signature } = verifyDIDAuthDto;
    const auth = await this.authModel.findOne({ uuid });
    if (!auth) {
      throw new Error('uuid not found');
    }
    const { challenge } = auth;

    const didDocument: DIDDocumentView =
      await this.resolverService.fetchDIDDocument(did);
    const { publicKeyMultibase, type: keyType } =
      didDocument.verificationMethod.find(
        (verification) => (verification.id = authenticationId),
      );
    const publicKey = decodeMultibase(publicKeyMultibase);
    if (!publicKey) {
      throw new Error('Can not find verification method');
    }
    const key = keyFromPublicKey(publicKey, keyType);
    const verified = key.verify(challenge, signature);
    if (!verified) {
      throw new Error('Invalid Signature');
    }

    const payload: DidJwtPayload = {
      did,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.jwtSecret,
    });

    const tokenAuth: TokenAuthDto = {
      accessToken,
      did,
    };
    return tokenAuth;
  }

  removeRequestAuthByUuid(uuid: string) {
    return this.authModel.findOneAndRemove({ uuid });
  }
}
