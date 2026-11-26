import transporter from "../../infra/emailSMTP.js"
import { config } from "../../config.js";

class EmailService {
    public static async sendEmail(to: string, subject: string, body: string) {
        await transporter.sendMail({
            from: '"Your App" <no-reply@yourapp.com>',
            to,
            subject,
            text: body,
        });
    }
    
    public static async sendVerificationEmail(to: string, code: string) {
        const subject = "Email Verification Code";
        const body = `Your verification code is: ${code}`;
        await EmailService.sendEmail(to, subject, body);
    }

    public static async sendPasswordResetEmail(to: string, token: string) {
        const subject = "Reset your password";
        const link = EmailService.passwordResetLink(token);
        const body = [
            "Use this link to reset your password. It expires in 30 minutes and can be used once:",
            "",
            link,
            "",
            "If you didn't ask to reset your password, you can ignore this email."
        ].join("\n");
        await EmailService.sendEmail(to, subject, body);
    }

    /**
     * Built from the server's configured base URL, never from the request, so a
     * forged request cannot make the email link point somewhere else. The token is
     * in the URL fragment, which browsers do not send to servers or in Referer headers.
     */
    public static passwordResetLink(token: string): string {
        const base = config.app_base_url.replace(/\/+$/, "");
        return `${base}/password-reset#token=${encodeURIComponent(token)}`;
    }
}

export default EmailService;