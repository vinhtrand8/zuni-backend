import { ec as EC } from 'elliptic';

const aesjs = require('aes-js');
const sha256 = require('crypto-js/sha256');
const ec = new EC('secp256k1');

export function showMethods(x: any) {
  for (const key in x) {
    if (typeof x[key] === 'function') {
      console.log(key); // Output: method1, method2
    }
  }
}

export function getPublicKeyHex(keyPair: any) {
  return keyPair.getPublic('hex'); // compressed = true
}
export function getPrivateKeyHex(keyPair: any) {
  return keyPair.getPrivate().toString(16);
}
export function ecdhEncrypt(
  sender_priKey: any,
  receiver_pubkey: any,
  message: string,
): string {
  const sharedKey = ec
    .keyFromPublic(receiver_pubkey, 'hex')
    .getPublic()
    .mul(ec.keyFromPrivate(sender_priKey).getPrivate())
    .encode('hex', false);

  // CBC - Cipher-Block Chaining (recommended)

  // The initialization vector (must be 16 bytes)
  const iv = [];
  for (let i = 0; i < 16; ++i) iv.push(i);

  const sharedKeyBytes = Array.from(aesjs.utils.hex.toBytes(sharedKey));
  foldTo16Bytes(sharedKeyBytes);

  const messageBytes = Array.from(aesjs.utils.utf8.toBytes(message));
  while (messageBytes.length % 16 !== 0) messageBytes.push(0);

  const aesCbc = new aesjs.ModeOfOperation.cbc(sharedKeyBytes, iv);

  const cipherText = aesjs.utils.hex.fromBytes(aesCbc.encrypt(messageBytes));

  return cipherText;
}

export function foldTo16Bytes(bytes: Array<any>) {
  while (bytes.length > 16) {
    bytes[bytes.length - 17] =
      Number(bytes[bytes.length - 17]) ^ Number(bytes[bytes.length - 1]);
    bytes.pop();
  }
  return bytes;
}
export function ecdhDecrypt(
  receiver_priKey: any,
  sender_pubkey: any,
  cipherText: string,
): string {
  const sharedKey = ec
    .keyFromPublic(sender_pubkey, 'hex')
    .getPublic()
    .mul(ec.keyFromPrivate(receiver_priKey).getPrivate())
    .encode('hex', false);

  // CBC - Cipher-Block Chaining (recommended)

  // The initialization vector (must be 16 bytes)
  const iv = [];
  for (let i = 0; i < 16; ++i) iv.push(i);

  const sharedKeyBytes = Array.from(aesjs.utils.hex.toBytes(sharedKey));
  foldTo16Bytes(sharedKeyBytes);

  const cipherTextBytes = aesjs.utils.hex.toBytes(cipherText);

  const aesCbc = new aesjs.ModeOfOperation.cbc(sharedKeyBytes, iv);

  let plainText = aesjs.utils.utf8.fromBytes(aesCbc.decrypt(cipherTextBytes));

  while (plainText.length > 0 && plainText[plainText.length - 1] == '\x00')
    plainText = plainText.slice(0, -1);

  return plainText;
}

export function ecdsaSign(privateKey: string, message: string) {
  const msgBytes: number[] = Array.from(
    aesjs.utils.utf8.toBytes(sha256(message).toString()),
  );
  foldTo16Bytes(msgBytes);

  return aesjs.utils.hex.fromBytes(
    ec.keyFromPrivate(privateKey).sign(msgBytes).toDER(),
  );
}

export function ecdsaVerify(
  publicKey: string,
  message: string,
  signature: string,
): boolean {
  const msgBytes: number[] = Array.from(
    aesjs.utils.utf8.toBytes(sha256(message).toString()),
  );
  foldTo16Bytes(msgBytes);

  const signatureDER = aesjs.utils.hex.toBytes(signature);
  return ec.keyFromPublic(publicKey, 'hex').verify(msgBytes, signatureDER);
}

export function genKeyPair() {
  const key = ec.genKeyPair();
  return {
    private_key: getPrivateKeyHex(key),
    public_key: getPublicKeyHex(key),
  };
}
