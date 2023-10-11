import { web3 } from '@coral-xyz/anchor';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { createPublicKey, randomBytes, randomUUID } from 'crypto';
import { eddsa as EdDSA } from 'elliptic';
import fs from 'fs';
import { Model } from 'mongoose';
import path from 'path';
import { IResolverService } from 'src/resolver/interface.resolver.service';
import { keyFromPublicKey } from 'src/utils/ec';
import { decodeMultibase } from 'src/utils/multibase';
import { TokenAuthDto } from './dto/token-auth.dto';
import { VerifyDIDAuthDto } from './dto/verify-did-auth.dto';
import { VerifyWalletAuthDto } from './dto/verify-wallet-auth.dto';
import { Auth } from './schemas/auth.schema';

@Injectable()
export class AuthService {
  private readonly jwtPrivateKey: Buffer;
  private readonly jwtAlgo = 'ES256';

  constructor(
    @InjectModel(Auth.name) private readonly authModel: Model<Auth>,
    @Inject(IResolverService)
    private readonly resolverService: IResolverService,
    private readonly jwtService: JwtService,
  ) {
    const jwtPrivateKeyName = 'jwt-private-key.key';
    this.jwtPrivateKey = fs.readFileSync(
      path.join(process.cwd(), jwtPrivateKeyName),
    );
  }

  jwk(): JsonWebKey {
    const publicKey = createPublicKey(this.jwtPrivateKey);
    return publicKey.export({ format: 'jwk' });
  }

  async verifyToken(token: string): Promise<DidJwtPayload | WalletJwtPayload> {
    const publicKey = createPublicKey(this.jwtPrivateKey).export({
      format: 'pem',
      type: 'spki',
    });

    return this.jwtService.verifyAsync(token, {
      algorithms: [this.jwtAlgo],
      publicKey,
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
    const { uuid, wallet, signature, extra } = verifyWalletAuthDto;
    const auth = await this.authModel.findOne({ uuid });
    if (!auth) {
      throw new Error('uuid not found');
    }
    const { challenge } = auth;

    const publicKey = new web3.PublicKey(wallet);
    if (!publicKey) {
      throw new Error('Can not find verification method');
    }

    const ec = new EdDSA('ed25519');
    const key = ec.keyFromPublic(publicKey.toBuffer().toString('hex'));
    const verified = key.verify(challenge, signature);
    if (!verified) {
      throw new Error('Invalid Signature');
    }

    const payload: WalletJwtPayload = {
      wallet,
      extra,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      algorithm: this.jwtAlgo,
      privateKey: this.jwtPrivateKey,
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
    const { uuid, did, authenticationId, signature, extra } = verifyDIDAuthDto;
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
      extra,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      algorithm: this.jwtAlgo,
      privateKey: this.jwtPrivateKey,
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
