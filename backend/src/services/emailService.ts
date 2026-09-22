import transporter from "../infra/emailSMTP.js"

class EmailService {
    public static async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
        try {
            // Implement email sending logic here
            await transporter.sendMail({
                from: '"Your App" <no-reply@yourapp.com>',
                to,
                subject,
                text: body,
            });
            console.log(`Sending email to: ${to}, subject: ${subject}, body: ${body}`);
            return true;
        } catch (error) {
            console.error("Error sending email:", error);
            return false;
        }
    }
    
    public static async sendVerificationEmail(to: string, code: string): Promise<boolean> {
        const subject = "Email Verification Code";
        const body = `Your verification code is: ${code}`;
        return await EmailService.sendEmail(to, subject, body);
    }
}

export default EmailService;