type VerifiableDataRegistry = {
  version: '0.1.0';
  name: 'verifiable_data_registry';
  instructions: [
    {
      name: 'initializeDid';
      accounts: [
        {
          name: 'didDocument';
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: 'arg';
                type: {
                  array: ['u8', 20];
                };
                path: 'seed';
              },
            ];
          };
        },
        {
          name: 'controller';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'seed';
          type: {
            array: ['u8', 20];
          };
        },
        {
          name: 'did';
          type: 'string';
        },
      ];
    },
    {
      name: 'addVerificationMethod';
      accounts: [
        {
          name: 'verificationMethod';
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: 'arg';
                type: {
                  array: ['u8', 20];
                };
                path: 'verification_seed';
              },
            ];
          };
        },
        {
          name: 'didDocument';
          isMut: false;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: 'arg';
                type: {
                  array: ['u8', 20];
                };
                path: 'did_seed';
              },
            ];
          };
        },
        {
          name: 'controller';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'didSeed';
          type: {
            array: ['u8', 20];
          };
        },
        {
          name: 'verificationSeed';
          type: {
            array: ['u8', 20];
          };
        },
        {
          name: 'keyId';
          type: 'string';
        },
        {
          name: 'rType';
          type: 'string';
        },
        {
          name: 'publicKeyMultibase';
          type: 'string';
        },
        {
          name: 'controller';
          type: 'publicKey';
        },
      ];
    },
    {
      name: 'addAuthentication';
      accounts: [
        {
          name: 'authentication';
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: 'arg';
                type: {
                  array: ['u8', 20];
                };
                path: 'authentication_seed';
              },
            ];
          };
        },
        {
          name: 'didDocument';
          isMut: false;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: 'arg';
                type: {
                  array: ['u8', 20];
                };
                path: 'did_seed';
              },
            ];
          };
        },
        {
          name: 'verificationMethod';
          isMut: false;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: 'arg';
                type: {
                  array: ['u8', 20];
                };
                path: 'verification_seed';
              },
            ];
          };
        },
        {
          name: 'controller';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'didSeed';
          type: {
            array: ['u8', 20];
          };
        },
        {
          name: 'verificationSeed';
          type: {
            array: ['u8', 20];
          };
        },
        {
          name: 'authenticationSeed';
          type: {
            array: ['u8', 20];
          };
        },
      ];
    },
    {
      name: 'addAssertion';
      accounts: [
        {
          name: 'assertion';
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: 'arg';
                type: {
                  array: ['u8', 20];
                };
                path: 'assertion_seed';
              },
            ];
          };
        },
        {
          name: 'didDocument';
          isMut: false;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: 'arg';
                type: {
                  array: ['u8', 20];
                };
                path: 'did_seed';
              },
            ];
          };
        },
        {
          name: 'verificationMethod';
          isMut: false;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: 'arg';
                type: {
                  array: ['u8', 20];
                };
                path: 'verification_seed';
              },
            ];
          };
        },
        {
          name: 'controller';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'didSeed';
          type: {
            array: ['u8', 20];
          };
        },
        {
          name: 'verificationSeed';
          type: {
            array: ['u8', 20];
          };
        },
        {
          name: 'assertionSeed';
          type: {
            array: ['u8', 20];
          };
        },
      ];
    },
    {
      name: 'addKeyAgreement';
      accounts: [
        {
          name: 'keyAgreement';
          isMut: true;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: 'arg';
                type: {
                  array: ['u8', 20];
                };
                path: 'key_agreement_seed';
              },
            ];
          };
        },
        {
          name: 'didDocument';
          isMut: false;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: 'arg';
                type: {
                  array: ['u8', 20];
                };
                path: 'did_seed';
              },
            ];
          };
        },
        {
          name: 'verificationMethod';
          isMut: false;
          isSigner: false;
          pda: {
            seeds: [
              {
                kind: 'arg';
                type: {
                  array: ['u8', 20];
                };
                path: 'verification_seed';
              },
            ];
          };
        },
        {
          name: 'controller';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'didSeed';
          type: {
            array: ['u8', 20];
          };
        },
        {
          name: 'verificationSeed';
          type: {
            array: ['u8', 20];
          };
        },
        {
          name: 'keyAgreementSeed';
          type: {
            array: ['u8', 20];
          };
        },
      ];
    },
  ];
  accounts: [
    {
      name: 'didDocument';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'controller';
            type: 'publicKey';
          },
          {
            name: 'did';
            type: 'string';
          },
        ];
      };
    },
    {
      name: 'verificationMethod';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'controller';
            type: 'publicKey';
          },
          {
            name: 'did';
            type: 'string';
          },
          {
            name: 'keyId';
            type: 'string';
          },
          {
            name: 'rType';
            type: 'string';
          },
          {
            name: 'publicKeyMultibase';
            type: 'string';
          },
        ];
      };
    },
    {
      name: 'authentication';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'did';
            type: 'string';
          },
          {
            name: 'keyId';
            type: 'string';
          },
        ];
      };
    },
    {
      name: 'assertion';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'did';
            type: 'string';
          },
          {
            name: 'keyId';
            type: 'string';
          },
        ];
      };
    },
    {
      name: 'keyAgreement';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'did';
            type: 'string';
          },
          {
            name: 'keyId';
            type: 'string';
          },
        ];
      };
    },
  ];
  errors: [
    {
      code: 6000;
      name: 'Unauthorized';
      msg: 'Unauthorized';
    },
  ];
};
