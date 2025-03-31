import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { envs } from 'src/config';

@Injectable()
export class EmailService {

  private resend: Resend;

  constructor() {
    this.resend = new Resend(envs.resend_email_api_key);
  }

  /**
   * Metodo para enviar un corrreo
   * @param to 
   * @param subject 
   * @param html 
   * @returns 
   */
  public async sendEmail(payload: {
    to: string,
    subject: string,
    html: string
  }) {
    try {

      const {to, subject, html} = payload;
      
      const response = await this.resend.emails.send({
        from: envs.domain_resend_email,
        to: to,
        subject: subject,
        html: html
      });
      return response;
    } catch(error) {
      throw new Error(`No se pudo enviar el corre ${error.message}`);
    }
  }
}
