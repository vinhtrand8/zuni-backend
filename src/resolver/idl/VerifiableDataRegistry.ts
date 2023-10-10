export const IDL: VerifiableDataRegistry = {
  version: '0.1.0',
  name: 'verifiable_data_registry',
  instructions: [
    {
      name: 'initializeDid',
      accounts: [
        {
          name: 'didDocument',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'controller',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'did',
          type: 'string',
        },
      ],
    },
    {
      name: 'addVerificationMethod',
      accounts: [
        {
          name: 'verificationMethod',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'didDocument',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'controller',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'did',
          type: 'string',
        },
        {
          name: 'keyId',
          type: 'string',
        },
        {
          name: 'rType',
          type: 'string',
        },
        {
          name: 'publicKeyMultibase',
          type: 'string',
        },
        {
          name: 'controller',
          type: 'publicKey',
        },
      ],
    },
    {
      name: 'addVerificationRelationship',
      accounts: [
        {
          name: 'verificationRelationship',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'didDocument',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'verificationMethod',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'controller',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'did',
          type: 'string',
        },
        {
          name: 'relationship',
          type: {
            defined: 'Relationship',
          },
        },
        {
          name: 'keyId',
          type: 'string',
        },
      ],
    },
    {
      name: 'addCredential',
      accounts: [
        {
          name: 'credentialState',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'didDocument',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'verificationMethod',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'authentication',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'did',
          type: 'string',
        },
        {
          name: 'authenticationId',
          type: 'string',
        },
        {
          name: 'credentialId',
          type: 'string',
        },
        {
          name: 'expireAt',
          type: {
            option: 'u64',
          },
        },
        {
          name: 'recoveryId',
          type: 'u8',
        },
        {
          name: 'signature',
          type: {
            array: ['u8', 64],
          },
        },
      ],
    },
    {
      name: 'revokeCredential',
      accounts: [
        {
          name: 'credentialState',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'didDocument',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'verificationMethod',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'authentication',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'did',
          type: 'string',
        },
        {
          name: 'authenticationId',
          type: 'string',
        },
        {
          name: 'credentialId',
          type: 'string',
        },
        {
          name: 'recoveryId',
          type: 'u8',
        },
        {
          name: 'signature',
          type: {
            array: ['u8', 64],
          },
        },
      ],
    },
  ],
  accounts: [
    {
      name: 'didDocument',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'controller',
            type: 'publicKey',
          },
          {
            name: 'did',
            type: 'string',
          },
        ],
      },
    },
    {
      name: 'verificationMethod',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'controller',
            type: 'publicKey',
          },
          {
            name: 'did',
            type: 'string',
          },
          {
            name: 'keyId',
            type: 'string',
          },
          {
            name: 'rType',
            type: 'string',
          },
          {
            name: 'publicKeyMultibase',
            type: 'string',
          },
        ],
      },
    },
    {
      name: 'verificationRelationship',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'did',
            type: 'string',
          },
          {
            name: 'relationship',
            type: {
              defined: 'Relationship',
            },
          },
          {
            name: 'keyId',
            type: 'string',
          },
        ],
      },
    },
    {
      name: 'credentialState',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'issuerDid',
            type: 'string',
          },
          {
            name: 'credentialId',
            type: 'string',
          },
          {
            name: 'status',
            type: {
              defined: 'CredentialStatus',
            },
          },
          {
            name: 'expireAt',
            type: {
              option: 'u64',
            },
          },
        ],
      },
    },
  ],
  types: [
    {
      name: 'Secp256k1Signature',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'recoveryId',
            type: 'u8',
          },
          {
            name: 'signature',
            type: {
              array: ['u8', 64],
            },
          },
        ],
      },
    },
    {
      name: 'Relationship',
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'Authentication',
          },
          {
            name: 'Assertion',
          },
          {
            name: 'KeyAgreement',
          },
        ],
      },
    },
    {
      name: 'CredentialStatus',
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'Active',
          },
          {
            name: 'Revoked',
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: 'Unauthorized',
      msg: 'Unauthorized',
    },
    {
      code: 6001,
      name: 'NotSupportKeyType',
      msg: 'Not support key type',
    },
  ],
};
