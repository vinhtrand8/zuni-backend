import { ModeOfOperation, utils as AESUtils } from 'aes-js';
import { BN } from 'bn.js';
import { SHA256 } from 'crypto-js';
import { generateRandomBN } from 'library/common/Math';
import { DEFAULT_BABYJUB_PRIVATE_KEY_STRING } from '../constants/VotingConstants';
import { BabyJubBasePoint } from './BabyJubBasePoint';
import { BabyJubKeyStringPair } from './BabyJubKeyStringPair';
import { BabyJubPrivateKey } from './BabyJubPrivateKey';
import { BabyJubPublicKey } from './BabyJubPublicKey';
import { FFMathUtility } from './FFMathUtility';

export class BabyJubUtility {
  private static randomPrivateKeyString() {
    const privateKey = generateRandomBN().toString(10);
    const buf = FFMathUtility.F.e(privateKey);
    return Array.from(buf)
      .map((x) => x.toString(16))
      .join('');
  }

  private static foldTo16Bytes(bytes: Uint8Array): Uint8Array {
    while (bytes.length > 16) {
      bytes[bytes.length - 17] =
        Number(bytes[bytes.length - 17]) ^ Number(bytes[bytes.length - 1]);
      bytes = bytes.slice(0, bytes.length - 1);
    }
    return bytes;
  }

  static genKeyPair(): BabyJubKeyStringPair {
    const sk = new BabyJubPrivateKey(BabyJubUtility.randomPrivateKeyString());
    const pk = sk.toPublicKey();
    return new BabyJubKeyStringPair({
      privateKey: sk,
      publicKey: pk,
    });
  }

  static getDefaultPublicKey(): BabyJubPublicKey {
    return BabyJubUtility.getDefaultPrivateKey().toPublicKey();
  }
  static getDefaultPrivateKey(): BabyJubPrivateKey {
    return new BabyJubPrivateKey(DEFAULT_BABYJUB_PRIVATE_KEY_STRING);
  }

  static getGenerator(): BabyJubBasePoint {
    return new BabyJubBasePoint(FFMathUtility.getBabyJubGenerator());
  }

  // ECC algorithms
  static ecdhEncrypt(
    sender_priKey: BabyJubPrivateKey,
    receiver_pubkey: BabyJubPublicKey,
    message: string,
  ): string {
    // TODO: @galin-chung-nguyen should use a random value for safer encryption
    const sharedKey = FFMathUtility.PointToHex(
      receiver_pubkey.toBasePoint().mul(sender_priKey.toBN()).getRawPoint(),
    );

    // CBC - Cipher-Block Chaining (recommended)

    // The initialization vector (must be 16 bytes)
    const iv: number[] = [];
    for (let i = 0; i < 16; ++i) iv.push(i);

    const sharedKeyBytes = BabyJubUtility.foldTo16Bytes(
      AESUtils.hex.toBytes(sharedKey),
    );

    const messageBytes = Array.from(AESUtils.utf8.toBytes(message));
    while (messageBytes.length % 16 !== 0) messageBytes.push(0);

    const aesCbc = new ModeOfOperation.cbc(sharedKeyBytes, iv);

    const cipherText = AESUtils.hex.fromBytes(aesCbc.encrypt(messageBytes));

    return cipherText;
  }

  static ecdhDecrypt(
    receiver_priKey: BabyJubPrivateKey,
    sender_pubkey: BabyJubPublicKey,
    cipherText: string,
  ): string {
    const sharedKey = FFMathUtility.PointToHex(
      sender_pubkey.toBasePoint().mul(receiver_priKey.toBN()).getRawPoint(),
    );

    // CBC - Cipher-Block Chaining (recommended)

    // The initialization vector (must be 16 bytes)
    const iv: number[] = [];
    for (let i = 0; i < 16; ++i) iv.push(i);

    const sharedKeyBytes = BabyJubUtility.foldTo16Bytes(
      AESUtils.hex.toBytes(sharedKey),
    );

    const cipherTextBytes = AESUtils.hex.toBytes(cipherText);

    const aesCbc = new ModeOfOperation.cbc(sharedKeyBytes, iv);

    let plainText = AESUtils.utf8.fromBytes(aesCbc.decrypt(cipherTextBytes));

    while (plainText.length > 0 && plainText[plainText.length - 1] == '\x00')
      plainText = plainText.slice(0, -1);

    return plainText;
  }

  static ecdsaSign(privateKey: BabyJubPrivateKey, message: string): string {
    const msgBytes = BabyJubUtility.foldTo16Bytes(
      AESUtils.utf8.toBytes(SHA256(message).toString()),
    );

    return FFMathUtility.PointToHex(
      FFMathUtility.mulPointEscalar(
        privateKey.toPublicKey().toCurvePoint(),
        new BN(msgBytes).toString(10),
      ),
    );
  }

  static ecdsaVerify(
    publicKey: BabyJubPublicKey,
    message: string,
    signature: string,
  ): boolean {
    const msgBytes = BabyJubUtility.foldTo16Bytes(
      AESUtils.utf8.toBytes(SHA256(message).toString()),
    );

    const generatedSignature = FFMathUtility.PointToHex(
      FFMathUtility.mulPointEscalar(
        publicKey.toCurvePoint(),
        new BN(msgBytes).toString(10),
      ),
    );

    return signature === generatedSignature;
  }
}
