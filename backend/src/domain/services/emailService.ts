import transporter from "../../infra/emailSMTP.js"

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

    public static async sendPasswordResetEmail(to: string, code: string) {
        const subject = "Password Reset Code";
        const body = `You can reset your password using the following code: ${code}`;
        await EmailService.sendEmail(to, subject, body);
    }
}

export default EmailService;