import { utils } from '@coral-xyz/anchor';

export const MULTIBASE_PREFIX = {
  base58btc: 'z',
  base64: 'm',
  base64url: 'u',
  hex: 'f',
};

export const decodeMultibase = (data: string): Buffer => {
  const identifier = data[0];
  const encodedData = data.slice(1);

  switch (identifier) {
    case MULTIBASE_PREFIX.base64: {
      return Buffer.from(encodedData, 'base64');
    }
    case MULTIBASE_PREFIX.base64url: {
      return Buffer.from(encodedData, 'base64url');
    }
    case MULTIBASE_PREFIX.base58btc: {
      return utils.bytes.bs58.decode(encodedData);
    }
    case MULTIBASE_PREFIX.hex: {
      return Buffer.from(encodedData, 'hex');
    }
    default: {
      throw new Error('Unsupported multibase prefix');
    }
  }
};

// export function convertToDidUrlFormat(did: string) {
//   return ZUNI_DID_PREFIX.solana.devnet + did;
// }
