import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { envs } from 'src/config';

@Injectable()
export class EmailService {

  private resend: Resend;
  private readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      throw new Error(`No se pudo enviar el correo ${error.message}`);
    }
  }

  /**
   * Metodo para validar si un correo es un Email valido
   * @param email 
   * @returns 
   */
  private isEmailValidate(email: string): boolean {
    return this.EMAIL_REGEX.test(email);
  }

  /**
   * Metodo para enviar un correo a varios correos
   * @param subject 
   * @param html 
   * @param to 
   */
  public async sendAllEmail(subject: string, html: string, to: string[]) {
    
    try {

      const emailValidate = [];
    
      for(const email of to) {
        if (this.isEmailValidate(email)) {
          emailValidate.push(email);
        }
      }

      if (emailValidate.length === 0) {
        throw new Error("No se puede enviar los emails, porque todos los correos no son validos");
      }

      for(const element of emailValidate) {
        await this.sendEmail({
          subject,
          html,
          to: element
        });
      }

    } catch(error) {
      throw new Error(`No se pudo enviar el correo ${error.message}`);
    }
  }
}
