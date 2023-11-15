import { BlobServiceClient, ContainerClient } from '@azure/storage-blob'
import { BlobStore, BlobNotFoundError } from '@atproto/repo'
import { randomStr } from '@atproto/crypto'
import { CID } from 'multiformats/cid'
import stream from 'stream'

export type StorageConfig = { connectionString: string, container: string }

export class AzureBlobStore implements BlobStore {
  private client: ContainerClient
  private container: string

  constructor(cfg: StorageConfig) {
    const { container, connectionString } = cfg
    this.container = container
    this.client = BlobServiceClient.fromConnectionString(connectionString).getContainerClient(container)
  }

  private genKey() {
    return randomStr(32, 'base32')
  }

  private getTmpPath(key: string): string {
    return `tmp/${key}`
  }

  private getStoredPath(cid: CID): string {
    return `blocks/${cid.toString()}`
  }

  private getQuarantinedPath(cid: CID): string {
    return `quarantine/${cid.toString()}`
  }

  async putTemp(bytes: Uint8Array | stream.Readable): Promise<string> {
    const key = this.genKey()
    const path = this.getTmpPath(key);
    if (bytes instanceof stream.Readable) {
      await this.client.getBlobClient(path).getBlockBlobClient().uploadStream(bytes)
    } else {
      await this.client.getBlobClient(path).getBlockBlobClient().uploadData(bytes)
    }
    return key
  }

  async makePermanent(key: string, cid: CID): Promise<void> {
    const alreadyHas = await this.hasStored(cid)
    if (!alreadyHas) {
      await this.move({
        from: this.getTmpPath(key),
        to: this.getStoredPath(cid),
      })
    } else {
      // already saved, so we no-op & just delete the temp
      await this.deleteKey(this.getTmpPath(key))
    }
  }

  async putPermanent(
    cid: CID,
    bytes: Uint8Array | stream.Readable,
  ): Promise<void> {
    if (bytes instanceof stream.Readable) {
      await this.client.getBlobClient(this.getStoredPath(cid)).getBlockBlobClient().uploadStream(bytes)
    } else {
      await this.client.getBlobClient(this.getStoredPath(cid)).getBlockBlobClient().uploadData(bytes)
    }
  }

  async quarantine(cid: CID): Promise<void> {
    await this.move({
      from: this.getStoredPath(cid),
      to: this.getQuarantinedPath(cid),
    })
  }

  async unquarantine(cid: CID): Promise<void> {
    await this.move({
      from: this.getQuarantinedPath(cid),
      to: this.getStoredPath(cid),
    })
  }

  private async getObject(cid: CID) {
    const res = await this.client.getBlobClient(this.getStoredPath(cid)).download()
    if (res.readableStreamBody) {
      return res.readableStreamBody
    } else {
      throw new BlobNotFoundError()
    }
  }

  async getBytes(cid: CID): Promise<Uint8Array> {
    const res = await this.getObject(cid)
    return new stream.Readable().wrap(res).read().buffer
  }

  async getStream(cid: CID): Promise<stream.Readable> {
    const res = await this.getObject(cid)
    return new stream.Readable().wrap(res)
  }

  async delete(cid: CID): Promise<void> {
    await this.deleteKey(this.getStoredPath(cid))
  }

  async hasStored(cid: CID): Promise<boolean> {
      return this.client.getBlobClient(this.getStoredPath(cid)).exists()
  }

  private async deleteKey(key: string) {
    await this.client.deleteBlob(key)
  }

  private async move(keys: { from: string; to: string }) {
    const copyPoller = await this.client
      .getBlobClient(keys.to)
      .beginCopyFromURL(`${this.client.url}/${keys.from}`)
    await copyPoller.pollUntilDone();
    await this.client.deleteBlob(keys.from)
  }
}

export default AzureBlobStore
