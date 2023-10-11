import { web3 } from '@coral-xyz/anchor';

export default () => {
  const network = process.env.NETWORK;
  let clusterApiUrl: string;

  if (
    network === 'devnet' ||
    network === 'testnet' ||
    network === 'mainnet-beta'
  ) {
    clusterApiUrl = web3.clusterApiUrl(network);
  } else {
    clusterApiUrl = process.env.CLUSTER_API_URL || 'http://localhost:8899';
  }

  const solana: SolanaConfig = {
    clusterApiUrl,
    verifiableDataRegistryProgramId:
      process.env.VERIFIABLE_DATA_REGISTRY_PROGRAM_ID,
  };

  const s3: S3Config = {
    region: process.env.AWS_S3_REGION,
    bucketName: process.env.AWS_S3_BUCKET_NAME,
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  };

  const config: Config = {
    privateKey: process.env.PRIVATE_KEY,
    walletAddress: process.env.WALLET_ADDRESS,
    solana,
    s3,
  };

  return config;
};
