import { beforeEach, describe, expect, test, vi } from "vitest";
import EmailService from "./emailService.js";
import transporter from "../../infra/emailSMTP.js";
import LoggingService from "./loggingService.js";

vi.mock("../../config.js", () => ({ config: { app_base_url: "https://treasure.example/" } }));
vi.mock("../../infra/emailSMTP.js", () => ({ default: { sendMail: vi.fn() } }));
vi.mock("./loggingService.js", () => ({ default: { error: vi.fn() } }));

describe("EmailService password reset", () => {
    beforeEach(() => vi.clearAllMocks());

    test("links to the configured app with the token in the URL fragment", () => {
        expect(EmailService.passwordResetLink("abc_DEF-123"))
            .toBe("https://treasure.example/password-reset#token=abc_DEF-123");
    });

    test("emails the reset link", async () => {
        await EmailService.sendPasswordResetEmail("user@example.com", "abc_DEF-123");
        expect(transporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
            to: "user@example.com",
            text: expect.stringContaining("https://treasure.example/password-reset#token=abc_DEF-123")
        }));
    });
});

describe("EmailService notices", () => {
    beforeEach(() => vi.clearAllMocks());

    test("tells the owner their password changed and points to the reset page, without a token", async () => {
        await EmailService.sendPasswordChangedEmail("user@example.com");
        const mail = vi.mocked(transporter.sendMail).mock.calls[0]![0] as { to: string; subject: string; text: string };
        expect(mail.to).toBe("user@example.com");
        expect(mail.subject).toBe("Your password was changed");
        expect(mail.text).toContain("https://treasure.example/password-reset");
        expect(mail.text).not.toContain("#token=");
    });

    test("sendInBackground logs a failure with its description instead of throwing", async () => {
        EmailService.sendInBackground(Promise.reject(new Error("SMTP down")), "password changed notice for user u1");
        await new Promise((resolve) => setImmediate(resolve));
        expect(LoggingService.error).toHaveBeenCalledWith("Email not sent: password changed notice for user u1: SMTP down");
    });
});
