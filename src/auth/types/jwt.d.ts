type WalletJwtPayload = {
  wallet: string;
  extra?: Record<string, unknown>;
};

type DidJwtPayload = {
  did: string;
  extra?: Record<string, unknown>;
};
