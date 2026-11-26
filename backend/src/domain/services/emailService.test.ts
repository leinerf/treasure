import { beforeEach, describe, expect, test, vi } from "vitest";
import EmailService from "./emailService.js";
import transporter from "../../infra/emailSMTP.js";

vi.mock("../../config.js", () => ({ config: { app_base_url: "https://treasure.example/" } }));
vi.mock("../../infra/emailSMTP.js", () => ({ default: { sendMail: vi.fn() } }));

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
