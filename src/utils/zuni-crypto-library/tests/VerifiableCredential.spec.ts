import { assert } from 'chai';
import * as fs from 'fs';
import JSONstringify from 'json-stable-stringify';
import { BabyJubCurvePoint } from 'library/BabyJub/BabyJubBasePoint';
import { FFMathUtility } from 'library/BabyJub/FFMathUtility';
import { ECCKeyStringPair } from 'library/interfaces/ECCKeyStringPair';
import { ECCUtility } from 'library/utility/ECCUtility';
import {
  PrivateCredential,
  PublicCredential,
  Schema,
  VCPresentation,
  VCSynthesisError,
} from 'library/verifiable_credential/VCInterfaces';
import {
  createVerificationSchema,
  decryptPublicCredential,
  generateVCPresentation,
  getRequestedFieldsFromVCPresentation,
  issueVC,
  verifyValidPublicCredential,
  verifyValidSchema,
  verifyVCPresentation,
  verifyVCPresentationFormat,
} from 'library/verifiable_credential/VCUtility';
import * as snarkjs from 'snarkjs';
import { Groth16Proof } from 'snarkjs';

describe('Verifiable Credential protocol', function () {
  this.timeout(100000);
  const issuer = 'did:solana:b3d5824fa5c8dcb7dab1ab5951d9fee5';
  const holder = 'did:solana:b3d5824fa5c8dcb7dab1ab5951d9fee5';
  const verifier = 'did:solana:b3d5824fa5c8dcb7dab1ab5951d9fee5';
  let issuerKeys: ECCKeyStringPair<BabyJubCurvePoint>;
  let holderKeys: ECCKeyStringPair<BabyJubCurvePoint>;
  let verifierKeys: ECCKeyStringPair<BabyJubCurvePoint>;
  let schema: Schema<BabyJubCurvePoint>;
  let publicCredential: PublicCredential<BabyJubCurvePoint>;
  let fullCredential: PrivateCredential<BabyJubCurvePoint>;
  let vcpresentation: VCPresentation<BabyJubCurvePoint, Groth16Proof>;

  before(async () => {
    await FFMathUtility.initialize();
    // ECCUtility.init('secp256k1');
    ECCUtility.init('babyjub');

    issuerKeys = ECCUtility.genKeyPair();
    holderKeys = ECCUtility.genKeyPair();
    verifierKeys = ECCUtility.genKeyPair();
  });

  // it('Test ff', async function(){
  //   const newSMT = await FFMathUtility.createSMT();
  //   await newSMT.insert(newSMT.F.e(3), newSMT.F.e(20));

  //   const ff = await newSMT.find(newSMT.F.e(3));
  //   assert(
  //     FFMathUtility.F.toString(FFMathUtility.F.e(20), 10) ==
  //       FFMathUtility.F.toString(ff.foundValue, 10),
  //   );
  //   const tmp = await getSiblings(newSMT, 3);
  // })

  it('Issuer issues credential', async function () {
    // issuer,
    // holder,
    // types,
    // issuerKeyPair,
    // holderPublicKey,
    // expirationDate,
    // credentialSubject,
    const issuedVCInPrivateForm = await issueVC({
      issuer: issuer,
      holder: holder,
      issuerKeyPair: issuerKeys,
      holderPublicKey: holderKeys.getPublicKey(),
      types: ['UniversityDegreeCredential'],
      expirationDate: new Date('2024-05-20').toISOString(),
      credentialSubject: JSON.parse(
        JSON.stringify({
          degree: {
            type: 'BachelorDegree',
            name: 'Bachelor of Science and Arts',
          },
          class: 2025,
          year: 2024,
          school_name: 'HCMUS',
          total_credits: 135,
          num_of_failed_classes: 20,
        }),
      ),
    });

    assert.equal(
      verifyValidPublicCredential(issuedVCInPrivateForm.toPublicCredential()),
      true,
    );

    const invalidPublicCred = issuedVCInPrivateForm
      .toPublicCredential()
      .clone();
    invalidPublicCred.id += ' ';
    assert.equal(verifyValidPublicCredential(invalidPublicCred), false);

    publicCredential = issuedVCInPrivateForm.toPublicCredential();

    const parsedPublicCredential = new PublicCredential(
      JSON.parse(JSON.stringify(publicCredential)),
    );
    assert.equal(
      JSONstringify(parsedPublicCredential),
      JSONstringify(publicCredential),
    );
  });

  it('Holder decrypt VC', async function () {
    fullCredential = decryptPublicCredential(
      publicCredential,
      holderKeys.getPrivateKey(),
    );

    const parsedPrivateCredential = new PrivateCredential(
      JSON.parse(JSON.stringify(fullCredential)),
    );
    assert.equal(
      JSONstringify(parsedPrivateCredential),
      JSONstringify(fullCredential),
    );

    console.log(fullCredential);
    assert(fullCredential.credentialSubject !== undefined);
  });

  it('Verifier creates schema', async function () {
    schema = await createVerificationSchema({
      name: 'Computer Science University Degree Check',
      verifier: verifier,
      verifierKeyPair: verifierKeys,
      checks: [
        JSON.parse(
          JSON.stringify({
            degree: {
              type: ['$EQ', 'BachelorDegree'],
              name: ['$EQ', 'Bachelor of Science and Arts'],
            },
            class: ['$GTE', 2023],
            year: ['$LT', 19999],
          }),
        ),
        JSON.parse(
          JSON.stringify({
            degree: {
              type: ['$EQ', 'BachelorDegree'],
              // name: ['$EQ', 'Bachelor of Science and Arts'],
            },
            class: ['$GT', 2022],
            year: ['$LT', 20000],
          }),
        ),
        JSON.parse(
          JSON.stringify({
            degree: {
              type: ['$EQ', 'BachelorDegree'],
              // name: ['$EQ', 'Bachelor of Science and Arts'],
            },
            // class: ['$GTE', 2023],
            year: ['$LT', 2025],
          }),
        ),
        JSON.parse(
          JSON.stringify({
            degree: {
              type: ['$EQ', 'BachelorDegree'],
              // name: ['$EQ', 'Bachelor of Science and Arts'],
            },
            // class: ['$GTE', 2023],
            year: ['$LT', 19999],
            total_credits: ['$GT', 134],
            num_of_failed_classes: ['$NE', 19],
          }),
        ),
      ],
      requestedFields: ['0:school_name', '0:school_name', '1:degree.name'],
    });

    assert.equal(verifyValidSchema(schema), true);

    const parsedSchema = new Schema(JSON.parse(JSON.stringify(schema)));
    assert.equal(JSONstringify(parsedSchema), JSONstringify(schema));

    const invalidSchema = schema.clone();
    invalidSchema.verifier += ' ';
    assert.equal(verifyValidSchema(invalidSchema), false);
  });

  it('Prover create VC presentation for a specific schema', async function () {
    // schema: Schema<P>,
    // privateCredentials: Array<PrivateCredential<P>>,
    // zkEngine: ZKEngine<ZP>,
    // holder: string,
    // holderPrivateKey: ECCPrivateKeyInterface<P>,
    // vcSingleFieldProofWasmPath: string,
    // vcSingleFieldProofZkeyPath: string,

    vcpresentation = await generateVCPresentation(
      schema,
      [fullCredential, fullCredential, fullCredential, fullCredential],
      snarkjs.groth16,
      holder,
      holderKeys.getPrivateKey(),
      'circuits/vc/vc_single_field/vc_schema_field_check_verifier_js/vc_schema_field_check_verifier.wasm',
      // 'circuits/vc/vc_single_field/vc_schema_field_check_verifier.wasm',
      // 'circuits/vc/vc_single_field/vc_schema_field_check_verifier_circuit_final.zkey',
      'circuits/vc/vc_single_field/vc_schema_field_check_verifier_circuit_final.zkey',
    );
  });

  it('Verifier verifies VC presentation', async function () {
    assert.equal(await verifyVCPresentationFormat(vcpresentation), true);
    const invalidFormatVCP = vcpresentation.clone();
    invalidFormatVCP.publicCredentials.pop();

    assert.throws(() => {
      verifyVCPresentationFormat(invalidFormatVCP);
    }, VCSynthesisError.InvalidVCPresentation);

    const parsedVCP = new VCPresentation(
      JSON.parse(JSON.stringify(vcpresentation)),
    );

    assert.equal(JSONstringify(parsedVCP), JSONstringify(vcpresentation));

    const vKey = JSON.parse(
      fs.readFileSync(
        // 'circuits/vc/vc_single_field/vc_schema_field_check_verifier_verification_key.json',
        'circuits/vc/vc_single_field/vc_schema_field_check_verifier_verification_key.json',
        'utf8',
      ),
    );

    const res = await verifyVCPresentation(
      vcpresentation,
      schema,
      snarkjs.groth16,
      vKey,
    );
    assert.equal(res, true);

    console.log(
      'Requested fields = ',
      getRequestedFieldsFromVCPresentation(
        vcpresentation,
        verifierKeys.getPrivateKey(),
      ),
    );

    process.exit(0);
  });
});
