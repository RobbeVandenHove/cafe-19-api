import nodemailer from 'nodemailer';
import logger from '../../../utils/logger';

export default class MailerService {
    private transporter: nodemailer.Transporter;

    public constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    public async sendEmail(to: string, subject: string, template: string): Promise<void> {
        const mailOptions = {
            from: `"Café 38" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: template,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
        } catch (error) {
            logger.error('Failed to send email', error);
            throw new Error('Failed to send email');
        }
    }
}