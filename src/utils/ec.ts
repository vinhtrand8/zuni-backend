import { ec as EC } from 'elliptic';

export const VERIFICATION_METHOD_TYPE = {
  secp256k1: 'EcdsaSecp256k1VerificationKey2019',
  ed25519: 'Ed25519VerificationKey2018',
};

export const keyFromPublicKey = (
  publicKey: Buffer,
  keyType: string,
): EC.KeyPair => {
  switch (keyType) {
    case VERIFICATION_METHOD_TYPE.secp256k1: {
      const ec = new EC('secp256k1');
      return ec.keyFromPublic(publicKey);
    }
    case VERIFICATION_METHOD_TYPE.ed25519: {
      const ec = new EC('ed25519');
      return ec.keyFromPublic(publicKey);
    }
    default: {
      throw new Error('Unsupported key type');
    }
  }
};
