import Imap from "imap";
import nodemailer from "nodemailer";
import { Config } from "../config";

interface EmailOptions {
	to: string;
	subject: string;
	text?: string;
	html?: string;
}

export class MailService {
	private transporter!: nodemailer.Transporter;

	setUpTransporter(): void {
		this.transporter = nodemailer.createTransport({
			host: Config.emailSmtpServer,
			port: Config.emailSmtpPort,
			secure: false,
			auth: {
				user: Config.emailUsername,
				pass: Config.emailPassword,
			},
		});
		$logger.info("Mail transporter set up");
	}

	async sendEmail(emailOptions: EmailOptions) {
		// await this.transporter.sendMail(emailOptions);
		// this.addMailToSentFolder(emailOptions);
		$logger.info(`Email sent to ${emailOptions.to}`);
	}

	private addMailToSentFolder(emailOptions: EmailOptions) {
		const imap = new Imap({
			host: Config.emailImapServer,
			port: Config.emailImapPort,
			user: Config.emailUsername,
			password: Config.emailPassword,
		});

		imap.connect();
		imap.once("ready", () => {
			imap.openBox("sent", true, (err) => {
				if (err) {
					$logger.error("Error opening 'Sent' folder", err);
				}
			});
		});

		const emailMessage = `From: ${Config.emailFrom}\r\nTo: ${emailOptions.to}\r\nSubject: ${emailOptions.subject}\r\n\r\n${emailOptions.text}`;

		imap.append(emailMessage, { mailbox: "Sent" }, (err) => {
			if (err) {
				$logger.error('Error appending email to "Sent" folder:', err);
			} else {
				$logger.info('Email appended to "Sent" folder.');
			}
		});
		imap.end();
	}
}
