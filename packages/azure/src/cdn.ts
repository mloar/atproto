import * as azure from '@azure/arm-cdn'
import { DefaultAzureCredential } from '@azure/identity'

export type CdnConfig = {
  pathPrefix?: string
  subscriptionId: string,
  resourceGroup: string,
  profile: string,
  endpoint: string
}

export class CdnInvalidator implements ImageInvalidator {
  client: azure.CdnManagementClient
  pathPrefix: string
  resourceGroup: string
  profile: string
  endpoint: string
  constructor(cfg: CdnConfig) {
    const { subscriptionId } = cfg
    this.client = new azure.CdnManagementClient(new DefaultAzureCredential(), subscriptionId)
    this.pathPrefix = cfg.pathPrefix ?? ''
    this.resourceGroup = cfg.resourceGroup
    this.profile = cfg.profile
    this.endpoint = cfg.endpoint
  }

  async invalidate(subject: string, paths: string[]) {
    await this.client.endpoints.beginPurgeContentAndWait(
      this.resourceGroup,
      this.profile,
      this.endpoint,
      {
        contentPaths: paths.map((path) => this.pathPrefix + path),
      })
  }
}

export default CdnInvalidator

// @NOTE keep in sync with same interface in pds/src/image/invalidator.ts
// this is separate to avoid the dependency on @atproto/pds.
interface ImageInvalidator {
  invalidate(subject: string, paths: string[]): Promise<void>
}
