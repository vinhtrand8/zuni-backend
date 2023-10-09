import BN from 'bn.js';
import { MAX_NUM_BITS_OF_RANDOMNESS } from 'library/constants/VotingConstants';

export function generateRandomBN(): BN {
  const BN253 = new BN(1).shln(MAX_NUM_BITS_OF_RANDOMNESS);
  while (true) {
    const randomBytes: Array<number> = new Array(32).fill(0);
    for (let i = 0; i < randomBytes.length; ++i) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
    // make sure the random value does not exceed 253 bits

    if (new BN(randomBytes).lt(BN253)) {
      return new BN(randomBytes);
    }
  }
}
