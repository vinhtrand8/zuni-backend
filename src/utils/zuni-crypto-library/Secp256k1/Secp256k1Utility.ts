import { ModeOfOperation, utils as AESUtils } from 'aes-js';
import { SHA256 } from 'crypto-js';
import {
  DEFAULT_SECP256K1_PRIVATE_KEY_STRING,
  DEFAULT_SECP256K1_PUBLIC_KEY_STRING,
} from '../constants/VotingConstants';
import {
  Secp256k1BasePoint,
  Secp256k1Curve,
  Secp256k1CurveInterface,
} from './Secp256k1BasePoint';
import { Secp256k1KeyStringPair } from './Secp256k1KeyStringPair';
import { Secp256k1PrivateKey } from './Secp256k1PrivateKey';
import { Secp256k1PublicKey } from './Secp256k1PublicKey';

export class Secp256k1Utility {
  // simple utility methods
  private static getPublicKeyHex(
    keyPair: Secp256k1CurveInterface.KeyPair,
  ): string {
    return keyPair.getPublic('hex'); // compressed = true
  }
  private static getPrivateKeyHex(
    keyPair: Secp256k1CurveInterface.KeyPair,
  ): string {
    return keyPair.getPrivate().toString(16);
  }
  private static foldTo16Bytes(bytes: Uint8Array): Uint8Array {
    while (bytes.length > 16) {
      bytes[bytes.length - 17] =
        Number(bytes[bytes.length - 17]) ^ Number(bytes[bytes.length - 1]);
      bytes = bytes.slice(0, bytes.length - 1);
    }
    return bytes;
  }

  static genKeyPair(): Secp256k1KeyStringPair {
    const key = Secp256k1Curve.genKeyPair();
    return new Secp256k1KeyStringPair({
      privateKey: new Secp256k1PrivateKey(
        Secp256k1Utility.getPrivateKeyHex(key),
      ),
      publicKey: new Secp256k1PublicKey(Secp256k1Utility.getPublicKeyHex(key)),
    });
  }

  static getDefaultPublicKey(): Secp256k1PublicKey {
    return new Secp256k1PublicKey(DEFAULT_SECP256K1_PUBLIC_KEY_STRING);
  }
  static getDefaultPrivateKey(): Secp256k1PrivateKey {
    return new Secp256k1PrivateKey(DEFAULT_SECP256K1_PRIVATE_KEY_STRING);
  }

  static getGenerator(): Secp256k1BasePoint {
    return new Secp256k1BasePoint(Secp256k1Curve.g);
  }

  // ECC algorithms
  static ecdhEncrypt(
    sender_priKey: Secp256k1PrivateKey,
    receiver_pubkey: Secp256k1PublicKey,
    message: string,
  ): string {
    // TODO: @galin-chung-nguyen should use a random value for safer encryption
    const sharedKey = Secp256k1Curve.keyFromPublic(
      receiver_pubkey.toHexString(),
      'hex',
    )
      .getPublic()
      .mul(
        Secp256k1Curve.keyFromPrivate(sender_priKey.toHexString()).getPrivate(),
      )
      .encode('hex', false);

    // CBC - Cipher-Block Chaining (recommended)

    // The initialization vector (must be 16 bytes)
    const iv: number[] = [];
    for (let i = 0; i < 16; ++i) iv.push(i);

    const sharedKeyBytes = Secp256k1Utility.foldTo16Bytes(
      AESUtils.hex.toBytes(sharedKey),
    );

    const messageBytes = Array.from(AESUtils.utf8.toBytes(message));
    while (messageBytes.length % 16 !== 0) messageBytes.push(0);

    const aesCbc = new ModeOfOperation.cbc(sharedKeyBytes, iv);

    const cipherText = AESUtils.hex.fromBytes(aesCbc.encrypt(messageBytes));

    return cipherText;
  }

  static ecdhDecrypt(
    receiver_priKey: Secp256k1PrivateKey,
    sender_pubkey: Secp256k1PublicKey,
    cipherText: string,
  ): string {
    const sharedKey = Secp256k1Curve.keyFromPublic(
      sender_pubkey.toHexString(),
      'hex',
    )
      .getPublic()
      .mul(
        Secp256k1Curve.keyFromPrivate(
          receiver_priKey.toHexString(),
        ).getPrivate(),
      )
      .encode('hex', false);

    // CBC - Cipher-Block Chaining (recommended)

    // The initialization vector (must be 16 bytes)
    const iv: number[] = [];
    for (let i = 0; i < 16; ++i) iv.push(i);

    const sharedKeyBytes = Secp256k1Utility.foldTo16Bytes(
      AESUtils.hex.toBytes(sharedKey),
    );

    const cipherTextBytes = AESUtils.hex.toBytes(cipherText);

    const aesCbc = new ModeOfOperation.cbc(sharedKeyBytes, iv);

    let plainText = AESUtils.utf8.fromBytes(aesCbc.decrypt(cipherTextBytes));

    while (plainText.length > 0 && plainText[plainText.length - 1] == '\x00')
      plainText = plainText.slice(0, -1);

    return plainText;
  }

  static ecdsaSign(privateKey: Secp256k1PrivateKey, message: string): string {
    const msgBytes = Secp256k1Utility.foldTo16Bytes(
      AESUtils.utf8.toBytes(SHA256(message).toString()),
    );

    return AESUtils.hex.fromBytes(
      Secp256k1Curve.keyFromPrivate(privateKey.toHexString())
        .sign(msgBytes)
        .toDER(),
    );
  }

  static ecdsaVerify(
    publicKey: Secp256k1PublicKey,
    message: string,
    signature: string,
  ): boolean {
    const msgBytes: Uint8Array = Secp256k1Utility.foldTo16Bytes(
      AESUtils.utf8.toBytes(SHA256(message).toString()),
    );

    const signatureDER = AESUtils.hex.toBytes(signature);
    return Secp256k1Curve.keyFromPublic(publicKey.toHexString(), 'hex').verify(
      msgBytes,
      signatureDER,
    );
  }
}
