import { EmailClient, EmailAddress, EmailSendResponse } from '@azure/communication-email'
import type { TokenCredential } from '@azure/identity'

export type { EmailSendResponse } from '@azure/communication-email'

interface Options {
  endpoint?: string,
  credential?: TokenCredential,
  connectionString?: string,
}

export class AzureMailer {
  options: Options
  client: EmailClient

  constructor(options) {
    this.options = options

    if (options.endpoint && options.credential) {
      this.client = new EmailClient(options.endpoint, options.credential)
    } else if (options.connectionString) {
      this.client = new EmailClient(options.connectionString)
    } else {
      throw new Error("Missing endpoint and credential or connectionString")
    }
  }

  public async sendMail(mail) : Promise<EmailSendResponse> {
    const senderAddress = this._from(mail)
    const to = this._to(mail)
    const message = {
      senderAddress,
      recipients: {
        to,
      },
      content: {
        subject: mail.subject,
        html: mail.html,
        plainText: mail.text,
      }
    }
    const poller = await this.client.beginSend(message)
    return poller.pollUntilDone()
  }

  private _from(mail) : string {
    if (typeof mail.from === 'object') {
      return mail.from.address
    }
    return this._splitAddress(mail.from).address
  }

  private _to(mail) : Array<EmailAddress> {
    if (Array.isArray(mail.to) && mail.to.length > 0) {
      if (typeof mail.to[0] === 'object') {
        return mail.to.map((a) => ({address: a.address, displayName: a.name}))
      } else {
        return mail.to.map(this._splitAddress)
      }
    } else if (typeof mail.to === 'object') {
      return [{displayName: mail.to.name, address: mail.to.address}]
    } else if (typeof mail.to === 'string') {
      return [this._splitAddress(mail.to)]
    } else {
      throw new Error("Unrecognized address type")
    }
  }

  private _splitAddress(address: string) : EmailAddress {
    if (address.indexOf('<') > -1) {
      const parts = address.split('<')
      return {displayName: parts[0], address: parts[1].split('>')[0]}
    }
    return {displayName: "", address}
  }
}
