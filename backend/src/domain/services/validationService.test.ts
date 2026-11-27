import { afterEach, describe, expect, test, vi } from "vitest";
import bcrypt from "bcrypt";
import { ValidationService } from "./validationService.js";

describe("ValidationService", () => {
    test.each([
        ["abc", true],
        ["a".repeat(21), true],
        ["a".repeat(22), false],
        ["ab", false],
        ["123user", false],
        ["user_name", true],
        ["", false]
    ])("validates username %s", (value, valid) => {
        expect(ValidationService.isValidUsername(value)).toBe(valid);
    });

    test.each([
        ["test@example.com", true],
        ["invalid", false],
        ["test @example.com", false],
        ["", false]
    ])("validates email %s", (value, valid) => {
        expect(ValidationService.isValidEmail(value)).toBe(valid);
    });

    test.each([
        ["Password!123", true],
        ["Abcdef1!", true],
        ["abcdef1!", false],
        ["ABCDEFG1!", false],
        ["Password!", false],
        ["Password1", false],
        ["Abc1!", false],
        ["", false]
    ])("validates password %s", (value, valid) => {
        expect(ValidationService.isValidPassword(value)).toBe(valid);
    });

    test("compares passwords against their bcrypt hashes", async () => {
        const hash = bcrypt.hashSync("Password!123", 4);
        await expect(ValidationService.matchesPassword("Password!123", hash)).resolves.toBe(true);
        await expect(ValidationService.matchesPassword("Wrong!123", hash)).resolves.toBe(false);
    });

    test.each([
        [0, 1, true],
        [10, 100, true],
        [-1, 10, false],
        [0, 0, false],
        [0, 101, false],
        [1.5, 10, false],
        [0, 1.5, false],
        [Number.NaN, 10, false]
    ])("validates offset %s and limit %s", (offset, limit, valid) => {
        expect(ValidationService.isValidOffsetAndLimit(offset, limit)).toBe(valid);
    });

    test.each([
        ["abc", true],
        ["  abc  ", true],
        ["  ab  ", false],
        ["   ", false],
        ["", false]
    ])("validates search query %s", (value, valid) => {
        expect(ValidationService.isValidSearchQuery(value)).toBe(valid);
    });

    describe("expiration", () => {
        afterEach(() => vi.useRealTimers());

        test("only treats timestamps before the current time as expired", () => {
            const now = new Date("2030-01-15T12:00:00Z");
            vi.useFakeTimers();
            vi.setSystemTime(now);
            expect(ValidationService.isExpired(new Date(now.getTime() - 1))).toBe(true);
            expect(ValidationService.isExpired(now)).toBe(false);
            expect(ValidationService.isExpired(new Date(now.getTime() + 1))).toBe(false);
        });
    });

    test("normalizes emails by trimming and lowercasing, and turns non-strings into an empty string", () => {
        expect(ValidationService.normalizeEmail("  Alice@Example.COM ")).toBe("alice@example.com");
        expect(ValidationService.normalizeEmail("bob@example.com")).toBe("bob@example.com");
        expect(ValidationService.normalizeEmail(undefined)).toBe("");
        expect(ValidationService.normalizeEmail({ $ne: "" })).toBe("");
    });
});
