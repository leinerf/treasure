import transporter from "../../infra/emailSMTP.js"
import { config } from "../../config.js";
import LoggingService from "./loggingService.js";

class EmailService {
    public static async sendEmail(to: string, subject: string, body: string) {
        await transporter.sendMail({
            from: '"Your App" <no-reply@yourapp.com>',
            to,
            subject,
            text: body,
        });
    }
    
    /**
     * Sends an email without making the caller wait, so a slow or failing mail server never
     * delays or fails the request. A failure is logged with what was being sent and for whom
     * (a user id, never an email address).
     */
    public static sendInBackground(send: Promise<void>, description: string): void {
        send.catch((error: unknown) => {
            const reason = error instanceof Error ? error.message : String(error);
            LoggingService.error(`Email not sent: ${description}: ${reason}`);
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
     * Tells the account owner their password changed, so a reset or change they didn't make
     * doesn't go unnoticed. It points to the reset page rather than carrying a token.
     */
    public static async sendPasswordChangedEmail(to: string) {
        const subject = "Your password was changed";
        const resetPage = `${config.app_base_url.replace(/\/+$/, "")}/password-reset`;
        const body = [
            "The password for your account was just changed, and you were signed out on your other devices.",
            "",
            "If this was you, there's nothing else to do.",
            "",
            "If it wasn't you, reset your password now and check that your email account is secure:",
            resetPage
        ].join("\n");
        await EmailService.sendEmail(to, subject, body);
    }

    /**
     * Tells the previous address that the account's email changed. It goes to the old address
     * because that's the owner's inbox if someone else made the change. The new address is
     * partly hidden, so the notice doesn't spell it out in full.
     */
    public static async sendEmailChangedEmail(previousEmail: string, newEmail: string) {
        const subject = "Your account email was changed";
        const body = [
            `The email address for your account was changed to ${EmailService.maskEmail(newEmail)}, and you were signed out on your other devices.`,
            "",
            "If this was you, there's nothing else to do.",
            "",
            "If it wasn't you, sign in now, change your password, and change the email back."
        ].join("\n");
        await EmailService.sendEmail(previousEmail, subject, body);
    }

    /** "alice@example.com" becomes "a•••@example.com". */
    public static maskEmail(email: string): string {
        const at = email.lastIndexOf("@");
        if (at < 1) {
            return "•••";
        }
        return `${email[0]}•••${email.slice(at)}`;
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