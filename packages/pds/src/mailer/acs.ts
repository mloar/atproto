import Mail from 'nodemailer/lib/mailer'
import { AzureMailer, EmailSendResponse } from '@atproto/azure'
import { EmailConfig } from '../config'

export class AcsTransport {
  private config: EmailConfig
  private mailer: AzureMailer
  private labels: { compile?: Function }

  constructor(
    config: EmailConfig,
  ) {
    this.config = config
    this.mailer = new AzureMailer({
      connectionString: config.connectionString
    })
    this.labels = {}
  }

  use(label, func) {
    this.labels[label] = func
  }

  async sendMail(mailOpts: Mail.Options) : Promise<EmailSendResponse> {
    if (this.labels['compile']) {
      const compile = this.labels['compile']
      await new Promise<void>((resolve, reject) => compile(mailOpts, e => e ? reject(e) : resolve()))
    }

    return this.mailer.sendMail({
      ...mailOpts,
    })
  }
}
