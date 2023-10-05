type WalletJwtPayload = {
  wallet: string;
  walletPublicKey: string;
};

type DidJwtPayload = {
  wallet: string;
  did: string;
  didPublicKey: string;
  didClientPublicKey: string;
  encryptedPrivKey: string;
};
