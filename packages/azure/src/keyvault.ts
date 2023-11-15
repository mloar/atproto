import * as azure from '@azure/keyvault-keys'
import { DefaultAzureCredential } from '@azure/identity'
import * as secp from '@noble/secp256k1'
import * as crypto from '@atproto/crypto'
import KeyEncoder from 'key-encoder'

const keyEncoder = new KeyEncoder('secp256k1')

export type KeyVaultConfig = { keyId: string, vaultUrl: string, }

export class KeyVaultKeypair implements crypto.Keypair {
  jwtAlg = crypto.SECP256K1_JWT_ALG

  constructor(
    private client: azure.KeyClient,
    private cryptoClient: azure.CryptographyClient,
    private keyId: string,
    private publicKey: Uint8Array,
  ) {}

  static async load(cfg: KeyVaultConfig) {
    const { keyId, vaultUrl, } = cfg
    const credential = new DefaultAzureCredential()
    const client = new azure.KeyClient(vaultUrl, credential);

    const res = await client.getKey(keyId)
    if (!(res.key && res.key.x && res.key.y)) {
      throw new Error('Could not find public key')
    }
    const cryptoClient = new azure.CryptographyClient(res, credential);
    return new KeyVaultKeypair(client, cryptoClient, keyId, Uint8Array.from([4, ...res.key.x, ...res.key.y]))
  }

  did(): string {
    return crypto.formatDidKey(this.jwtAlg, this.publicKey)
  }

  async sign(msg: Uint8Array): Promise<Uint8Array> {
    const res = await this.cryptoClient.signData("ES256K", msg);
    if (!res.result) {
      throw new Error('Could not get signature')
    }
    return res.result
  }
}

export default KeyVaultKeypair
