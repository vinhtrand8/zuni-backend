type S3Config = {
  region: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
};

type SolanaConfig = {
  clusterApiUrl: string;
  verifiableDataRegistryProgramId: string;
};

type Config = {
  privateKey: string;
  walletAddress: string;
  jwtSecret: JwtSecretConfig;
  solana: SolanaConfig;
  s3: S3Config;
};
