import { ServerEnvironment } from './env'

export const envToSecrets = (env: ServerEnvironment): ServerSecrets => {
  let repoSigningKey: ServerSecrets['repoSigningKey']

  const repoSigningKeys = [
    env.repoSigningKeyKeyVaultKeyId,
    env.repoSigningKeyKmsKeyId,
    env.repoSigningKeyK256PrivateKeyHex,
  ].filter(key => !!key)
  if (repoSigningKeys.length > 1) {
    throw new Error('Cannot set multiple keys for repo signing key')
  } else if (env.repoSigningKeyKeyVaultKeyId) {
    if (!env.repoSigningKeyKeyVaultUrl) {
      throw new Error('Missing vault URL for repo signing key')
    }
    repoSigningKey = {
      provider: 'keyvault',
      keyId: env.repoSigningKeyKeyVaultKeyId,
      vaultUrl: env.repoSigningKeyKeyVaultUrl,
    }
  } else if (env.repoSigningKeyKmsKeyId) {
    repoSigningKey = {
      provider: 'kms',
      keyId: env.repoSigningKeyKmsKeyId,
    }
  } else if (env.repoSigningKeyK256PrivateKeyHex) {
    repoSigningKey = {
      provider: 'memory',
      privateKeyHex: env.repoSigningKeyK256PrivateKeyHex,
    }
  } else {
    throw new Error('Must configure repo signing key')
  }

  let plcRotationKey: ServerSecrets['plcRotationKey']
  const plcRotationKeys = [
    env.plcRotationKeyKeyVaultKeyId,
    env.plcRotationKeyKmsKeyId,
    env.plcRotationKeyK256PrivateKeyHex,
  ].filter(key => !!key)
  if (plcRotationKeys.length > 1) {
    throw new Error('Cannot set multiple keys for plc rotation key')
  } else if (env.plcRotationKeyKeyVaultKeyId) {
    if (!env.plcRotationKeyKeyVaultUrl) {
      throw new Error('Missing vault URL for plc rotation key')
    }
    plcRotationKey = {
      provider: 'keyvault',
      keyId: env.plcRotationKeyKeyVaultKeyId,
      vaultUrl: env.plcRotationKeyKeyVaultUrl,
    }
  } else if (env.plcRotationKeyKmsKeyId) {
    plcRotationKey = {
      provider: 'kms',
      keyId: env.plcRotationKeyKmsKeyId,
    }
  } else if (env.plcRotationKeyK256PrivateKeyHex) {
    plcRotationKey = {
      provider: 'memory',
      privateKeyHex: env.plcRotationKeyK256PrivateKeyHex,
    }
  } else {
    throw new Error('Must configure plc rotation key')
  }

  if (!env.jwtSecret) {
    throw new Error('Must provide a JWT secret')
  }

  if (!env.adminPassword) {
    throw new Error('Must provide an admin password')
  }

  return {
    jwtSecret: env.jwtSecret,
    adminPassword: env.adminPassword,
    moderatorPassword: env.moderatorPassword ?? env.adminPassword,
    triagePassword:
      env.triagePassword ?? env.moderatorPassword ?? env.adminPassword,
    repoSigningKey,
    plcRotationKey,
  }
}

export type ServerSecrets = {
  jwtSecret: string
  adminPassword: string
  moderatorPassword: string
  triagePassword: string
  repoSigningKey: SigningKeyKeyVault | SigningKeyKms | SigningKeyMemory
  plcRotationKey: SigningKeyKeyVault | SigningKeyKms | SigningKeyMemory
}

export type SigningKeyKeyVault = {
  provider: 'keyvault'
  keyId: string
  vaultUrl: string
}

export type SigningKeyKms = {
  provider: 'kms'
  keyId: string
}

export type SigningKeyMemory = {
  provider: 'memory'
  privateKeyHex: string
}
