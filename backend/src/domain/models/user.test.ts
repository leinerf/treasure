import User from './user.js';
import { PhotoData } from './photoData.js';
import { Verification } from './Verification.js';
import { PhotoMetadataNotFoundError } from '../errors/PhotoMetadataNotFoundError.js';
import { describe, test, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import {EmailVerificationRepository} from '../../infra/db/repository/EmailVerificationRepository.js';
import {UserRepository} from '../../infra/db/repository/UserRepository.js';
import {PasswordResetRepository} from '../../infra/db/repository/PasswordResetRepository.js';
import {PhotoMetadataRepository} from '../../infra/db/repository/PhotoMetadataRepository.js';
import {RefreshTokenRepository} from '../../infra/db/repository/RefreshTokenRepository.js';
import { Session } from './session.js';
import { TokenService } from '../services/tokenService.js';
import { CleanupService } from '../services/cleanupService.js';
import { VerificationEmailLimitError } from '../errors/VerificationEmailLimitError.js';
import { db } from '../../infra/db/index.js';
import { EmailVerification as EmailVerificationTable } from '../../infra/db/schema/EmailVerification.js';
import { eq } from 'drizzle-orm';
import type { EmailVerification } from '../models/entity/EmailVerification.js';
import {  Role, type User as UserEntity } from './entity/User.js';
import { Trait } from './entity/PhotoMetadata.js';
import { InvalidEmailError } from '../errors/InvalidEmailError.js';
import { EmailVerificationNotFoundError } from '../errors/EmailVerificationNotFound.js';
import { InvalidEmailVerificationError } from '../errors/InvalidEmailVerification.js';
import { InvalidUsernameError } from '../errors/InvalidUsernameError.js';
import { UserExistsError } from '../errors/UserExistsError.js';
import { UserNotFoundError } from '../errors/UserNotFoundError.js';
import { InvalidRoleError } from '../errors/InvalidRoleError.js';
import { InvalidPasswordError } from '../errors/InvalidPasswordError.js';
import { InvalidCredentialsError } from '../errors/InvalidCredentialsError.js';
import { PasswordResetCodeNotFoundError } from '../errors/PasswordResetCodeNotFound.js';
import { InvalidPasswordResetCodeError } from '../errors/InvalidPasswordResetCode.js';
import { InvalidOffsetOrLimitError } from '../errors/InvalidOffsetOrLimitError.js';
import { InvalidQueryError } from '../errors/InvalidQueryError.js';

describe('User Model Tests', () => {
  const email = 'test@example.com';
  const username = 'testuser123';
  const password = 'Password!123';
  
  const cleanUpTestDB = async () => {
    await EmailVerificationRepository.deleteAll();
    await PasswordResetRepository.deleteAll();
    await PhotoMetadataRepository.deleteAll();
    await UserRepository.deleteAll();
  };
  const checkUser = (user: UserEntity, expectedUsername: string, expectedEmail: string) => {
    expect(user).toBeDefined();
    expect(user).toHaveProperty('username', expectedUsername);
    expect(user).toHaveProperty('email', expectedEmail);
    expect(user).toHaveProperty('id', expect.any(String));
    expect(user).toHaveProperty('role', Role.User)
  };

  const checkEmailCode = (emailCode: EmailVerification, expectedEmail: string) => {
    expect(emailCode).toBeDefined();
    expect(emailCode).toHaveProperty('email', expectedEmail);
    expect(emailCode).toHaveProperty('code', expect.any(String));
    expect(emailCode).toHaveProperty('expiresAt', expect.any(Date));
  };

  const createResetToken = async (forEmail: string) => {
    const result = await Verification.createPasswordResetToken(forEmail);
    if (!result) throw new Error('Expected a password reset token');
    expect(result.passwordReset).toMatchObject({ email: forEmail, tokenHash: Verification.hashPasswordResetToken(result.token) });
    return result;
  };

  beforeAll(async () => {
    await cleanUpTestDB();
  });

  afterAll(async () => {
    await cleanUpTestDB();
  });

  describe('User Email Verification Tests', () => {
    beforeEach(async () => {
      await cleanUpTestDB();
    });
    afterEach(async () => {
      await cleanUpTestDB();
    });
    test('create email verification code', async () => {
      const { emailCode } = await Verification.createEmailVerificationCode(email);
      checkEmailCode(emailCode, email);
    });
    test('Create new email verification code for existing email', async () => {
      const { emailCode: firstEmailCode } = await Verification.createEmailVerificationCode(email);
      checkEmailCode(firstEmailCode, email);

      const { emailCode: secondEmailCode } = await Verification.createEmailVerificationCode(email);
      checkEmailCode(secondEmailCode, email);

      expect(secondEmailCode.code).not.toBe(firstEmailCode.code);
    });
    test('Fail to create new email for invalid email', async () => {
      const invalidEmail = 'invalidemail';
      await expect(Verification.createEmailVerificationCode(invalidEmail)).rejects.toThrow(InvalidEmailError);
    });
  });

  describe('Email code guess limit', () => {
    beforeEach(async () => { await cleanUpTestDB(); });
    afterEach(async () => { await cleanUpTestDB(); });
    const wrongCode = (code: string) => (code === '000000' ? '111111' : '000000');

    test('After 5 wrong codes, even the right code is refused and a new code is needed', async () => {
      const { emailCode } = await Verification.createEmailVerificationCode(email);
      for (let i = 0; i < 4; i++) {
        await expect(User.createNewUser(username, email, wrongCode(emailCode.code), password)).rejects.toThrow(EmailVerificationNotFoundError);
      }
      await expect(User.createNewUser(username, email, wrongCode(emailCode.code), password))
        .rejects.toThrow('Too many incorrect codes. Request a new verification code.');
      await expect(User.createNewUser(username, email, emailCode.code, password))
        .rejects.toThrow('Too many incorrect codes. Request a new verification code.');

      const { emailCode: freshCode } = await Verification.createEmailVerificationCode(email);
      await expect(User.createNewUser(username, email, freshCode.code, password)).resolves.toMatchObject({ user: { email } });
    });

    test('The right code within 5 attempts still works', async () => {
      const { emailCode } = await Verification.createEmailVerificationCode(email);
      for (let i = 0; i < 4; i++) {
        await expect(User.createNewUser(username, email, wrongCode(emailCode.code), password)).rejects.toThrow(EmailVerificationNotFoundError);
      }
      await expect(User.createNewUser(username, email, emailCode.code, password)).resolves.toMatchObject({ user: { email } });
    });

    test('Many simultaneous wrong guesses use up the code, so the right one no longer works', async () => {
      const { emailCode } = await Verification.createEmailVerificationCode(email);
      const guesses = Array.from({ length: 21 }, (_, i) => String(100000 + i)).filter((code) => code !== emailCode.code).slice(0, 20);
      const results = await Promise.allSettled(guesses.map((code, i) => User.createNewUser(`racer${i}`, email, code, password)));

      expect(results.every((result) => result.status === 'rejected')).toBe(true);
      await expect(User.createNewUser(username, email, emailCode.code, password))
        .rejects.toThrow('Too many incorrect codes. Request a new verification code.');
    });
  });
  describe('Verification email limit', () => {
    beforeEach(async () => { await cleanUpTestDB(); });
    afterEach(async () => { await cleanUpTestDB(); });

    test('Sends at most 3 codes to one address per hour', async () => {
      for (let i = 0; i < 3; i++) {
        await Verification.createEmailVerificationCode(email);
      }
      await expect(Verification.createEmailVerificationCode(email)).rejects.toThrow(VerificationEmailLimitError);
      await expect(Verification.createEmailVerificationCode('someone.else@example.com')).resolves.toBeDefined();
    });

    test('Holds even when many requests arrive at once', async () => {
      const results = await Promise.allSettled(Array.from({ length: 10 }, () => Verification.createEmailVerificationCode(email)));
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(3);
    });

    test("Expiring or locking a code doesn't reset the count, and neither does the cleanup job", async () => {
      const { emailCode } = await Verification.createEmailVerificationCode(email);
      await Verification.createEmailVerificationCode(email);
      const { emailCode: third } = await Verification.createEmailVerificationCode(email);
      for (let i = 0; i < 5; i++) {
        await User.createNewUser(username, email, third.code === '000000' ? '111111' : '000000', password).catch(() => undefined);
      }
      await EmailVerificationRepository.updateById(emailCode.id, { ...third, expiresAt: new Date(Date.now() - 1000) });
      await CleanupService.removeExpiredRows();

      await expect(Verification.createEmailVerificationCode(email)).rejects.toThrow(VerificationEmailLimitError);
    });

    test('Allows codes again once the hour has passed', async () => {
      for (let i = 0; i < 3; i++) {
        await Verification.createEmailVerificationCode(email);
      }
      await db.update(EmailVerificationTable).set({ sendWindowStartedAt: new Date(Date.now() - 61 * 60 * 1000) })
        .where(eq(EmailVerificationTable.email, email));
      await expect(Verification.createEmailVerificationCode(email)).resolves.toBeDefined();
    });

    test('A new code resets the guess count', async () => {
      const { emailCode } = await Verification.createEmailVerificationCode(email);
      for (let i = 0; i < 5; i++) {
        await User.createNewUser(username, email, emailCode.code === '000000' ? '111111' : '000000', password).catch(() => undefined);
      }
      const { emailCode: fresh } = await Verification.createEmailVerificationCode(email);
      await expect(User.createNewUser(username, email, fresh.code, password)).resolves.toMatchObject({ user: { email } });
    });
  });
  describe('Create New User Tests', () => {
    let emailCode: EmailVerification | null = null;
    beforeEach(async () => {
      // Clean up any existing users and email verification codes before each test
      await cleanUpTestDB();
      const { emailCode: newEmailCode } = await Verification.createEmailVerificationCode(email);
      checkEmailCode(newEmailCode, email);
      if(!newEmailCode?.code) {
        throw new Error('Email verification code not created in beforeEach');
      }
      emailCode = newEmailCode;
    });
    afterEach(async () => {
      // Clean up any existing users and email verification codes after each test
      await cleanUpTestDB();
    });
    test('Create new user', async () => {
      if(!emailCode?.code) {
        throw new Error('Email verification code not available for creating new user');
      }
      const { user } = await User.createNewUser(username, email, emailCode.code, password);
      checkUser(user, username, email);
    });
    test('Fail to create new user with invalid email verification code', async () => {
      const invalidCode = 'invalid-code';
      await expect(User.createNewUser(username, email, invalidCode, password)).rejects.toThrow(EmailVerificationNotFoundError);
    });
    test('Fail to create new user with expired email verification code', async () => {
      if(!emailCode?.code) {
        throw new Error('Email verification code not available for creating new user');
      }

      // Manually expire the email verification code
      emailCode.expiresAt = new Date(Date.now() - 1000);
      const updatedEmailCode = await EmailVerificationRepository.updateById(emailCode.id, emailCode);
      await expect(User.createNewUser(username, email, updatedEmailCode.code, password)).rejects.toThrow(InvalidEmailVerificationError);
    });
    test('Fail to create new user with duplicate email', async () => {
      if(!emailCode?.code) {
        throw new Error('Email verification code not available for creating new user');
      }
      
      const { user } = await User.createNewUser(username, email, emailCode.code, password);
      checkUser(user, username, email);

      await expect(User.createNewUser(username, email, emailCode.code, password)).rejects.toThrow(UserExistsError);
    });
    test('Fail to create new user with short username', async () => {
      if(!emailCode?.code) {
        throw new Error('Email verification code not created');
      }

      await expect(User.createNewUser('a', email, emailCode?.code, password)).rejects.toThrow(InvalidUsernameError);
    });
    test('Fail to create new user with numbers only username', async () => {
      if(!emailCode?.code) {
        throw new Error('Email verification code not created');
      }

      await expect(User.createNewUser('123456', email, emailCode?.code, password)).rejects.toThrow(InvalidUsernameError);
    });
    test('Fail to create new user with long username', async () => {
      if(!emailCode?.code) {
        throw new Error('Email verification code not created');
      }

      await expect(User.createNewUser('a'.repeat(256), email, emailCode?.code, password)).rejects.toThrow(InvalidUsernameError);
    });
    test('Fail to create new user with empty username', async () => {
      if(!emailCode?.code) {
        throw new Error('Email verification code not created');
      }

      await expect(User.createNewUser('', email, emailCode?.code, password)).rejects.toThrow(InvalidUsernameError);
    });
    test('Fail to create new user with existing username', async () => {
      if(!emailCode?.code) {
        throw new Error('Email verification code not created');
      }
      
      const { user } = await User.createNewUser(username, email, emailCode?.code, password);
      checkUser(user, username, email);
      
      const { emailCode:newEmailCode } = await Verification.createEmailVerificationCode("secondEmail@example.com");
      // Emails are stored lowercase.
      checkEmailCode(newEmailCode, "secondemail@example.com");

      if(!newEmailCode?.code) {
        throw new Error('Email verification code not created');
      }

      await expect(User.createNewUser(username, newEmailCode.email, newEmailCode.code, password)).rejects.toThrow(UserExistsError);
    });
    test('Fail to create new user with invalid email', async () => {
      const { emailCode } = await Verification.createEmailVerificationCode(email);
      checkEmailCode(emailCode, email);

      if(!emailCode?.code) {
        throw new Error('Email verification code not created');
      }

      await expect(User.createNewUser(username, 'invalidEmail', emailCode?.code, password)).rejects.toThrow(InvalidEmailError);
    });
  });
  describe('Get User Authentication', () => {
    beforeEach(async () => {
      // Clean up any existing users and email verification codes before each test
      await cleanUpTestDB();
      const { emailCode: newEmailCode } = await Verification.createEmailVerificationCode(email);
      checkEmailCode(newEmailCode, email);
      const { user } = await User.createNewUser(username, email, newEmailCode.code, password);
      checkUser(user, username, email);
    });
    afterEach(async () => {
      // Clean up any existing users and email verification codes after each test
      await cleanUpTestDB();
    });
    test('Successfully get user with their user id', async () => {
      const { jwt, userId } = await User.createUserAuthentication(username, password);
      expect(userId).toBeDefined();
      // Login still returns an access token, and it identifies the same user.
      expect(TokenService.verifyAccessToken(jwt)).toBe(userId);

      const { user } = await User.getUser(userId);
      checkUser(user, username, email);
    });
    test('An unknown username and a wrong password fail with the same error and message', async () => {
      const unknownUser = await User.createUserAuthentication('invalidUsername', 'invalidPassword').catch((error: unknown) => error);
      const wrongPassword = await User.createUserAuthentication(username, 'Wrong!Password123').catch((error: unknown) => error);
      expect(unknownUser).toBeInstanceOf(InvalidCredentialsError);
      expect(wrongPassword).toBeInstanceOf(InvalidCredentialsError);
      expect((unknownUser as Error).message).toBe('Invalid username or password');
      expect((wrongPassword as Error).message).toBe((unknownUser as Error).message);
    });
    test('Fail to get a user with an unknown user id', async () => {
      await expect(User.getUser('00000000-0000-0000-0000-000000000000')).rejects.toThrow(UserNotFoundError);
    });
  });
  describe('Update Username', () => {
    beforeEach(async () => {
      // Clean up any existing test data before each test
      await cleanUpTestDB();
      const { emailCode } = await Verification.createEmailVerificationCode(email);
      checkEmailCode(emailCode, email);
      const { user } = await User.createNewUser(username, email, emailCode?.code, password);
      checkUser(user, username, email);
    });
    afterEach(async () => {
      // Clean up any test data after each test in this describe block
      await cleanUpTestDB();
    });
    test('Update username successfully', async () => {
      const { userId } = await User.createUserAuthentication(username, password);
      expect(userId).toBeDefined();

      const newUsername = 'updatedUsername';
      const { user } = await User.updateUsername(newUsername, userId);
      checkUser(user, newUsername, email);
    });
    test('Fail to update username for an unknown user id', async () => {
      const newUsername = 'updatedUsername';
      await expect(User.updateUsername(newUsername, '00000000-0000-0000-0000-000000000000')).rejects.toThrow(UserNotFoundError);
    });
    test('Fail to update username with empty new username', async () => {
      const { userId } = await User.createUserAuthentication(username, password);
      expect(userId).toBeDefined();
      const newUsername = '';
      await expect(User.updateUsername(newUsername, userId)).rejects.toThrow(InvalidUsernameError);
    });
    test('Fail to update username with missing new username', async () => {
      const { userId } = await User.createUserAuthentication(username, password);
      expect(userId).toBeDefined();
      const newUsername = undefined as any;
      await expect(User.updateUsername(newUsername, userId)).rejects.toThrow(InvalidUsernameError);
    });
    test('Fail to update username with invalid new username', async () => {
      const { userId } = await User.createUserAuthentication(username, password);
      expect(userId).toBeDefined();
      const newUsername = '123invalid@username';
      await expect(User.updateUsername(newUsername, userId)).rejects.toThrow(InvalidUsernameError);
    });
    test('Fail to update username with too short new username', async () => {
      const { userId } = await User.createUserAuthentication(username, password);
      expect(userId).toBeDefined();
      const newUsername = 'ab';
      await expect(User.updateUsername(newUsername, userId)).rejects.toThrow(InvalidUsernameError);
    });
    test('Fail to update username with too long new username', async () => {
      const { userId } = await User.createUserAuthentication(username, password);
      expect(userId).toBeDefined();
      const newUsername = 'a'.repeat(51); // Assuming max length is 50
      await expect(User.updateUsername(newUsername, userId)).rejects.toThrow(InvalidUsernameError);
    });
  });
  describe('Update Email', () => {
    // Add tests for updating email here
    beforeEach(async () => {
      // Clean up any existing test data before each test
      await cleanUpTestDB();
      const { emailCode } = await Verification.createEmailVerificationCode(email);
      checkEmailCode(emailCode, email);
      const { user } = await User.createNewUser(username, email, emailCode?.code, password);
      checkUser(user, username, email)
    });
    afterEach(async () => {
      // Clean up any test data after each test in this describe block
      await cleanUpTestDB();
    });
    test('Successfully update email with valid new email', async () => {
      const { userId } = await User.createUserAuthentication(username, password);
      expect(userId).toBeDefined();
      
      const newEmail = 'newemail@example.com';
      const { emailCode } = await Verification.createEmailVerificationCode(newEmail);
      checkEmailCode(emailCode, newEmail);
      const { user } = await User.updateEmail(newEmail, emailCode.code, password, userId);
      checkUser(user, username, newEmail);
      
    });
    test('Fail to update email with no email verification code', async () => {
      const { userId } = await User.createUserAuthentication(username, password);
      expect(userId).toBeDefined();

      const newEmail = 'newemail@example.com';
      await expect(User.updateEmail(newEmail, '', password, userId)).rejects.toThrow(EmailVerificationNotFoundError);
    });
    test('Fail to update email with invalid email verification code', async () => {
      const { userId } = await User.createUserAuthentication(username, password);
      expect(userId).toBeDefined();
      
      const newEmail = 'newemail@example.com';
      await expect(User.updateEmail(newEmail, 'invalidcode', password, userId)).rejects.toThrow(EmailVerificationNotFoundError);
    });
    test('Rejects an email used by another account without changing anything or using the code', async () => {
      const otherEmail = 'other@example.com';
      const { emailCode: otherCode } = await Verification.createEmailVerificationCode(otherEmail);
      await User.createNewUser('otheruser', otherEmail, otherCode.code, password);
      const { userId } = await User.createUserAuthentication(username, password);
      const { emailCode } = await Verification.createEmailVerificationCode(otherEmail);

      await expect(User.updateEmail(otherEmail, emailCode.code, password, userId)).rejects.toThrow(UserExistsError);

      expect((await User.getUser(userId)).user.email).toBe(email);
      expect(await EmailVerificationRepository.findOneByCodeAndEmail(emailCode.code, otherEmail)).not.toBeNull();
    });
    test('Allows re-entering your own current email', async () => {
      const { userId } = await User.createUserAuthentication(username, password);
      const { emailCode } = await Verification.createEmailVerificationCode(email);
      const { user } = await User.updateEmail(email, emailCode.code, password, userId);
      expect(user.email).toBe(email);
    });
    test('Rejects an expired code without changing the email', async () => {
      const { userId } = await User.createUserAuthentication(username, password);
      const newEmail = 'newemail@example.com';
      const { emailCode } = await Verification.createEmailVerificationCode(newEmail);
      await EmailVerificationRepository.updateById(emailCode.id, { ...emailCode, expiresAt: new Date(Date.now() - 1000) });

      await expect(User.updateEmail(newEmail, emailCode.code, password, userId)).rejects.toThrow(InvalidEmailVerificationError);

      const { user } = await User.getUser(userId);
      expect(user.email).toBe(email);
    });
    test.each([
      ['a wrong', 'Wrong!Password123'],
      ['an empty', ''],
    ])('Rejects %s current password without changing the email or using the code', async (_label, currentPassword) => {
      const { userId } = await User.createUserAuthentication(username, password);
      const newEmail = 'newemail@example.com';
      const { emailCode } = await Verification.createEmailVerificationCode(newEmail);

      await expect(User.updateEmail(newEmail, emailCode.code, currentPassword, userId)).rejects.toThrow(InvalidPasswordError);

      const { user } = await User.getUser(userId);
      expect(user.email).toBe(email);
      expect(await EmailVerificationRepository.findOneByCodeAndEmail(emailCode.code, newEmail)).not.toBeNull();
    });
  });
  describe('Update Password', () => {
    beforeEach(async () => {
      const { emailCode } = await Verification.createEmailVerificationCode(email);
      checkEmailCode(emailCode, email);
      const { user } = await User.createNewUser(username, email, emailCode?.code, password);
      checkUser(user, username, email);
    });
    afterEach(async () => {
      await EmailVerificationRepository.deleteAll();
      await UserRepository.deleteAll();
    });
    // TODO: Figure out why update password has high latency 300ms
    test('Successfully update password', async () => {
      const { userId } = await User.createUserAuthentication(username, password);
      expect(userId).toBeDefined();
      const newPassword = 'newPassword!123';
      const { user } = await User.updatePassword(password, newPassword, userId);
      checkUser(user, username, email);
      const { userId: newUserId } = await User.createUserAuthentication(username, newPassword);
      expect(newUserId).toBeDefined();
      const { user: newUser } = await User.getUser(newUserId);
      checkUser(newUser, username, email);
    });
    test('Fail to update password with incorrect current password', async () => {
      const { userId } = await User.createUserAuthentication(username, password);
      expect(userId).toBeDefined();

      const newPassword = 'newPassword!123';
      await expect(User.updatePassword('wrongPassword', newPassword, userId)).rejects.toThrow(InvalidPasswordError);
    });
    test('Fail to update password with missing current password', async () => {
      const { userId } = await User.createUserAuthentication(username, password);
      expect(userId).toBeDefined();

      const newPassword = 'newPassword!123';
      await expect(User.updatePassword('', newPassword, userId)).rejects.toThrow(InvalidPasswordError);
    });
    test('Fail to update password with missing new password', async () => {
      const { userId } = await User.createUserAuthentication(username, password);
      expect(userId).toBeDefined();

      await expect(User.updatePassword(password, '', userId)).rejects.toThrow(InvalidPasswordError);
    });
    test('Fail to update password for an unknown user id', async () => {
      const newPassword = 'newPassword!123';
      await expect(User.updatePassword(password, newPassword, '00000000-0000-0000-0000-000000000000')).rejects.toThrow(UserNotFoundError);
    });
    test('Fail to update password with same as current password', async () => {
      const { userId } = await User.createUserAuthentication(username, password);
      expect(userId).toBeDefined();

      await expect(User.updatePassword(password, password, userId)).rejects.toThrow(InvalidPasswordError);
    });
    test('Fail to update password with invalid new password', async () => {
      const { userId } = await User.createUserAuthentication(username, password);
      expect(userId).toBeDefined();

      const invalidNewPassword = 'weak-secret';
      const error = await User.updatePassword(password, invalidNewPassword, userId).catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(InvalidPasswordError);
      expect((error as Error).message).not.toContain(invalidNewPassword);
    });
  });
  describe("CleanupService (database)", () => {
    const HOUR = 60 * 60 * 1000;
    beforeEach(async () => { await RefreshTokenRepository.deleteAll(); await cleanUpTestDB(); });
    afterEach(async () => { await RefreshTokenRepository.deleteAll(); await cleanUpTestDB(); });

    test("removes expired rows and keeps live ones, including rotated but unexpired refresh tokens", async () => {
        const user = await UserRepository.save({ username: "cleanupuser", email: "cleanup@example.com", password: "hash", role: Role.User });
        if (!user) throw new Error("Expected a user");
        const past = new Date(Date.now() - HOUR);
        const future = new Date(Date.now() + HOUR);

        const expiredSession = await RefreshTokenRepository.save({ userId: user.id, expiresAt: past, rotatedAt: null });
        const rotatedSession = await RefreshTokenRepository.save({ userId: user.id, expiresAt: future, rotatedAt: past });
        const activeSession = await RefreshTokenRepository.save({ userId: user.id, expiresAt: future, rotatedAt: null });

        // Live link first: saving a link also clears that user's expired ones, so the expired
        // link must be saved last to still be there when the cleanup runs.
        const liveReset = await PasswordResetRepository.saveIfUnderLimit(
            { userId: user.id, email: user.email, tokenHash: "b".repeat(64), expiresAt: future }, 10, HOUR);
        const expiredReset = await PasswordResetRepository.saveIfUnderLimit(
            { userId: user.id, email: user.email, tokenHash: "a".repeat(64), expiresAt: past }, 10, HOUR);

        await EmailVerificationRepository.save({ email: "expired@example.com", code: "111111", expiresAt: past });
        await EmailVerificationRepository.save({ email: "live@example.com", code: "222222", expiresAt: future });

        const removed = await CleanupService.removeExpiredRows();

        expect(removed).toEqual({ refreshTokens: 1, passwordResets: 1, emailVerifications: 1 });
        expect(await RefreshTokenRepository.findOneById(expiredSession.id)).toBeNull();
        // Kept: reuse detection needs rotated refresh tokens until they expire.
        expect(await RefreshTokenRepository.findOneById(rotatedSession.id)).not.toBeNull();
        expect(await RefreshTokenRepository.findOneById(activeSession.id)).not.toBeNull();
        expect(await PasswordResetRepository.findOneByTokenHash(expiredReset!.tokenHash)).toBeNull();
        expect(await PasswordResetRepository.findOneByTokenHash(liveReset!.tokenHash)).not.toBeNull();
        expect(await EmailVerificationRepository.findOneByEmail("expired@example.com")).toBeNull();
        expect(await EmailVerificationRepository.findOneByEmail("live@example.com")).not.toBeNull();
    });

    test("does nothing when nothing has expired", async () => {
        await expect(CleanupService.removeExpiredRows()).resolves.toEqual({ refreshTokens: 0, passwordResets: 0, emailVerifications: 0 });
    });
});
  describe('Email normalization', () => {
    beforeEach(async () => { await cleanUpTestDB(); });
    afterEach(async () => { await cleanUpTestDB(); });

    test('stores emails lowercase and finds the account whatever case is typed later', async () => {
      const { emailCode } = await Verification.createEmailVerificationCode('  Mixed.Case@Example.COM ');
      expect(emailCode.email).toBe('mixed.case@example.com');
      const { user } = await User.createNewUser('mixeduser', 'Mixed.Case@example.com', emailCode.code, password);
      expect(user.email).toBe('mixed.case@example.com');

      const reset = await Verification.createPasswordResetToken('MIXED.CASE@EXAMPLE.COM');
      expect(reset?.passwordReset.userId).toBe(user.id);
    });

    test('rejects a second account whose email differs only by case', async () => {
      const { emailCode } = await Verification.createEmailVerificationCode(email);
      await User.createNewUser(username, email, emailCode.code, password);
      const { emailCode: upperCode } = await Verification.createEmailVerificationCode(email.toUpperCase());
      await expect(User.createNewUser('otheruser', email.toUpperCase(), upperCode.code, password)).rejects.toThrow(UserExistsError);
    });

    test('the database refuses an email that is not lowercase', async () => {
      await expect(UserRepository.save({ username: 'rawuser', email: 'Raw@Example.com', password: 'hash', role: Role.User }))
        .rejects.toThrow();
    });
  });
  describe('Create Password Reset Token', () => {
    beforeEach(async () => {
      await cleanUpTestDB()
      const { emailCode } = await Verification.createEmailVerificationCode(email);
      await checkEmailCode(emailCode, email);
      const { user } = await User.createNewUser(username, email, emailCode.code, password);
      await checkUser(user, username, email);
    });
    afterEach(async () => {
      await cleanUpTestDB();
    });
    test('Successfully create a password reset token and store only its hash', async () => {
      const { token, passwordReset } = await createResetToken(email);
      expect(await PasswordResetRepository.findOneByTokenHash(passwordReset.tokenHash)).toMatchObject({ id: passwordReset.id });
      expect(await PasswordResetRepository.findOneByTokenHash(token)).toBeNull();
    });
    test('Fail to create password reset token with invalid, empty or whitespace email', async () => {
      await expect(Verification.createPasswordResetToken('invalidEmail')).rejects.toThrow(InvalidEmailError);
      await expect(Verification.createPasswordResetToken('')).rejects.toThrow(InvalidEmailError);
      await expect(Verification.createPasswordResetToken('   ')).rejects.toThrow(InvalidEmailError);
    });
    test('Returns null for an email with no account', async () => {
      await expect(Verification.createPasswordResetToken('invalid@example.com')).resolves.toBeNull();
    });
    test('Creates at most three tokens per account per hour, even for concurrent requests', async () => {
      const results = await Promise.all(Array.from({ length: 10 }, () => Verification.createPasswordResetToken(email)));
      expect(results.filter(Boolean)).toHaveLength(3);
      await expect(Verification.createPasswordResetToken(email)).resolves.toBeNull();
    });
    test('Allows new tokens again once the hour has passed', async () => {
      for (let i = 0; i < 3; i++) {
        const { passwordReset } = await createResetToken(email);
        await PasswordResetRepository.updateById(passwordReset.id, { createdAt: new Date(Date.now() - 61 * 60_000) });
      }
      await createResetToken(email);
    });
  });
  describe('Reset Password', () => {
    let resetToken: string;
    beforeEach(async () => {
      await cleanUpTestDB();
      const { emailCode } = await Verification.createEmailVerificationCode(email);
      checkEmailCode(emailCode, email);
      const { user: newUser } = await User.createNewUser(username, email, emailCode.code, password);
      checkUser(newUser, username, email);
      ({ token: resetToken } = await createResetToken(email));
    });
    afterEach(async () => {
      await cleanUpTestDB();
    });
    test('Successfully reset password with a valid token', async () => {
      const { user } = await User.resetPassword('newPassword!123', resetToken);
      checkUser(user, username, email);
      const { userId } = await User.createUserAuthentication(username, 'newPassword!123');
      const { user: fetchedUser } = await User.getUser(userId);
      checkUser(fetchedUser, username, email);
    });
    test('A token works only once, even for concurrent submissions', async () => {
      const results = await Promise.allSettled([
        User.resetPassword('newPassword!123', resetToken),
        User.resetPassword('otherPassword!123', resetToken),
      ]);
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      await expect(User.resetPassword('thirdPassword!123', resetToken)).rejects.toThrow(PasswordResetCodeNotFoundError);
    });
    test('Using one token invalidates the account\'s other outstanding tokens', async () => {
      const { token: secondToken } = await createResetToken(email);
      await User.resetPassword('newPassword!123', resetToken);
      await expect(User.resetPassword('otherPassword!123', secondToken)).rejects.toThrow(PasswordResetCodeNotFoundError);
    });
    test('Requesting a new token does not cancel the earlier one', async () => {
      await createResetToken(email);
      await expect(User.resetPassword('newPassword!123', resetToken)).resolves.toMatchObject({ user: { email } });
    });
    test('Many wrong tokens do not lock the owner out', async () => {
      const attempts = await Promise.allSettled(Array.from({ length: 50 }, (_, i) =>
        User.resetPassword('newPassword!123', `wrong-token-${i}`)
      ));
      expect(attempts.every((attempt) => attempt.status === 'rejected'
        && attempt.reason instanceof PasswordResetCodeNotFoundError)).toBe(true);
      await expect(User.resetPassword('newPassword!123', resetToken)).resolves.toMatchObject({ user: { email } });
    });
    test('Rejects an email changed since the reset request without consuming the token', async () => {
      const user = await UserRepository.findOneByEmail(email);
      if (!user) throw new Error('Expected the reset user');
      await UserRepository.updateById(user.id, { email: 'changed@example.com' });

      await expect(User.resetPassword('newPassword!123', resetToken)).rejects.toThrow(PasswordResetCodeNotFoundError);
      expect(await PasswordResetRepository.findOneByTokenHash(Verification.hashPasswordResetToken(resetToken))).not.toBeNull();
      expect((await UserRepository.findOneById(user.id))?.password).toBe(user.password);
    });
    test('Fail to reset password with an unknown, empty or whitespace token', async () => {
      await expect(User.resetPassword('newPassword!123', 'invalidToken')).rejects.toThrow(PasswordResetCodeNotFoundError);
      await expect(User.resetPassword('newPassword!123', '')).rejects.toThrow(PasswordResetCodeNotFoundError);
      await expect(User.resetPassword('newPassword!123', '   ')).rejects.toThrow(PasswordResetCodeNotFoundError);
    });
    test('Fail to reset password with an expired token', async () => {
      const row = await PasswordResetRepository.findOneByTokenHash(Verification.hashPasswordResetToken(resetToken));
      await PasswordResetRepository.updateById(row!.id, { expiresAt: new Date(Date.now() - 1000) });
      await expect(User.resetPassword('newPassword!123', resetToken)).rejects.toThrow(InvalidPasswordResetCodeError);
    });
    test('Fail to reset password with invalid new password', async () => {
      await expect(User.resetPassword('password', resetToken)).rejects.toThrow(InvalidPasswordError);
    });
    test('Fail to reset password with same as old password', async () => {
      await expect(User.resetPassword(password, resetToken)).rejects.toThrow(InvalidPasswordError);
    });
  });
  describe('Delete User', () => {
    beforeEach(async () => {
      await cleanUpTestDB();
      
      const { emailCode } = await Verification.createEmailVerificationCode(email);
      checkEmailCode(emailCode, email);

      const { user } = await User.createNewUser(username, email, emailCode.code, password);
      checkUser(user, username, email);
    });
    afterEach(async () => {
      await cleanUpTestDB();
    });
    test('Delete user successfully', async () => {
      const { userId } = await User.createUserAuthentication(username, password);
      expect(userId).toBeDefined();
      await User.deleteUser(userId);
      await expect(User.getUser(userId)).rejects.toThrow(UserNotFoundError);
    });
    test("Deleting a user deletes their sessions through the foreign key", async () => {
      const { userId } = await User.createUserAuthentication(username, password);
      const { refreshToken } = await Session.create(userId);
      const { tokenId } = TokenService.verifyRefreshToken(refreshToken);
      expect(await RefreshTokenRepository.findOneById(tokenId)).not.toBeNull();

      await User.deleteUser(userId);

      expect(await RefreshTokenRepository.findOneById(tokenId)).toBeNull();
      await expect(Session.isActive(refreshToken)).resolves.toBe(false);
    });
    test('Rejects a session for a user that does not exist', async () => {
      await expect(Session.create('00000000-0000-0000-0000-000000000000')).rejects.toThrow();
    });
    test('Fail to delete an unknown user id, leaving existing users alone', async () => {
      await expect(User.deleteUser('00000000-0000-0000-0000-000000000000')).rejects.toThrow(UserNotFoundError);
      const { userId } = await User.createUserAuthentication(username, password);
      const { user } = await User.getUser(userId);
      checkUser(user, username, email);
    });
    test('Fail to delete user with their user id but already deleted user', async () => {
      const { userId } = await User.createUserAuthentication(username, password);
      expect(userId).toBeDefined();
      
      await User.deleteUser(userId);
      await expect(User.deleteUser(userId)).rejects.toThrow(UserNotFoundError);
    });
  });
  describe('Profile Photo Metadata', () => {
    beforeEach(async () => {
      await cleanUpTestDB();

      const { emailCode } = await Verification.createEmailVerificationCode(email);
      const { user } = await User.createNewUser(username, email, emailCode.code, password);
      checkUser(user, username, email);
    });
    afterEach(async () => {
      await cleanUpTestDB();
    });

    test('Save profile photo metadata', async () => {
      const { userId } = await User.createUserAuthentication(username, password);

      const { photoMetadata } = await PhotoData.saveProfilePhotoMetadata('profile.jpg', 1024, '/path/to/profile.jpg', userId);

      expect(photoMetadata).toMatchObject({
        filename: 'profile.jpg',
        size: 1024,
        trait: Trait.PROFILE
      });
      expect(photoMetadata.id).toEqual(expect.any(String));
      expect(photoMetadata.userId).toEqual((await User.getUser(userId)).user.id);
    });

    test('Get profile photo metadata', async () => {
      const { userId } = await User.createUserAuthentication(username, password);
      const savedPhoto = await PhotoData.saveProfilePhotoMetadata('profile.jpg', 1024, '/path/to/profile.jpg', userId);

      const { photoMetadata } = await PhotoData.getProfilePhotoMetadata(userId);

      expect(photoMetadata).toEqual(savedPhoto.photoMetadata);
    });

    test('Fail to save profile photo metadata for an unknown user id', async () => {
      await expect(
        PhotoData.saveProfilePhotoMetadata('profile.jpg', 1024, '/path/to/profile.jpg', '00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow(UserNotFoundError);
    });

    test('Fail to get profile photo metadata when none exists', async () => {
      const { userId } = await User.createUserAuthentication(username, password);

      await expect(PhotoData.getProfilePhotoMetadata(userId)).rejects.toThrow(PhotoMetadataNotFoundError);
    });

    test('Fail to get profile photo metadata for an unknown user id', async () => {
      await expect(PhotoData.getProfilePhotoMetadata('00000000-0000-0000-0000-000000000000')).rejects.toThrow(UserNotFoundError);
    });
  });

  describe('Admin User Tests', () => {
    const adminUsername = 'adminuser123';
    const adminEmail = 'admin@example.com';
    let adminUserId: string;
    let regularUserId: string;

    const createUser = async (name: string, mail: string) => {
      const { emailCode } = await Verification.createEmailVerificationCode(mail);
      const { user } = await User.createNewUser(name, mail, emailCode.code, password);
      return user;
    };

    beforeEach(async () => {
      await cleanUpTestDB();
      const admin = await createUser(adminUsername, adminEmail);
      await UserRepository.updateById(admin.id, { role: Role.Admin });
      const regular = await createUser(username, email);
      regularUserId = regular.id;
      adminUserId = admin.id;
    });
    afterEach(async () => {
      await cleanUpTestDB();
    });

    describe('adminFindUsers', () => {
      test('Admin can list all users', async () => {
        const { users, count } = await User.adminFindUsers(adminUserId, 0, 10);
        expect(users).toHaveLength(2);
        expect(users.map(u => u.username).sort()).toEqual([adminUsername, username].sort());
        expect(count).toBe(2);
      });
      test('Respects limit', async () => {
        const { users, count } = await User.adminFindUsers(adminUserId, 0, 1);
        expect(users).toHaveLength(1);
        expect(users[0]?.username).toBe(adminUsername);
        expect(count).toBe(2);
      });
      test('Respects offset', async () => {
        const all = await User.adminFindUsers(adminUserId, 0, 10);
        const rest = await User.adminFindUsers(adminUserId, 1, 10);
        expect(all.count).toBe(2);
        expect(rest.users).toHaveLength(1);
        expect(rest.count).toBe(2);
        expect(all.users.map(u => u.id)).toContain(rest.users[0]!.id);
      });
      test('Invalid offset or limit', async () => {
        await expect(User.adminFindUsers(adminUserId, -1, 10)).rejects.toThrow(InvalidOffsetOrLimitError);
        await expect(User.adminFindUsers(adminUserId, 0, 0)).rejects.toThrow(InvalidOffsetOrLimitError);
        await expect(User.adminFindUsers(adminUserId, 0, 101)).rejects.toThrow(InvalidOffsetOrLimitError);
        await expect(User.adminFindUsers(adminUserId, 1.5, 10)).rejects.toThrow(InvalidOffsetOrLimitError);
        await expect(User.adminFindUsers(adminUserId, 0, 1.5)).rejects.toThrow(InvalidOffsetOrLimitError);
        await expect(User.adminFindUsers(adminUserId, -1.5, 10)).rejects.toThrow(InvalidOffsetOrLimitError);
        await expect(User.adminFindUsers(adminUserId, 0, -1.5)).rejects.toThrow(InvalidOffsetOrLimitError);
      });
      test('Returns empty list when offset exceeds user count', async () => {
        const result = await User.adminFindUsers(adminUserId, 10, 10);
        expect(result.users).toEqual([]);
        expect(result.count).toBe(2);
      });
      test('Fail when the acting user no longer exists', async () => {
        await UserRepository.deleteById(regularUserId);
        await expect(User.adminFindUsers(regularUserId, 0, 10)).rejects.toThrow(UserNotFoundError);
      });
      test('Fail for non-admin user', async () => {
        await expect(User.adminFindUsers(regularUserId, 0, 10)).rejects.toThrow(InvalidRoleError);
      });
    });

    describe('adminSearchUsers', () => {
      test('Admin can search for a partial username', async () => {
        const { users } = await User.adminSearchUsers(adminUserId, 'stuser');
        expect(users.map(u => u.id)).toEqual([regularUserId]);
        expect(users[0]?.username).toBe(username);
      });
      test('Returns all users matching the query', async () => {
        const { users } = await User.adminSearchUsers(adminUserId, 'user123');
        expect(users.map(u => u.username).sort()).toEqual([adminUsername, username].sort());
      });
      test('Fail with query shorter than 3 characters', async () => {
        await expect(User.adminSearchUsers(adminUserId, 'us')).rejects.toThrow(InvalidQueryError);
      });
      test('Returns no users when no username matches', async () => {
        await expect(User.adminSearchUsers(adminUserId, 'missing')).resolves.toEqual({ users: [] });
      });
      test('Searches usernames rather than emails', async () => {
        await expect(User.adminSearchUsers(adminUserId, '@example.com')).resolves.toEqual({ users: [] });
      });
      test('Fail with empty query', async () => {
        await expect(User.adminSearchUsers(adminUserId, '')).rejects.toThrow(InvalidQueryError);
      });
      test('Fail when the acting user no longer exists', async () => {
        await UserRepository.deleteById(regularUserId);
        await expect(User.adminSearchUsers(regularUserId, 'user')).rejects.toThrow(UserNotFoundError);
      });
      test('Fail for non-admin user', async () => {
        await expect(User.adminSearchUsers(regularUserId, 'user')).rejects.toThrow(InvalidRoleError);
      });
    });

    describe('adminDeleteUser', () => {
      test('Admin can delete a user', async () => {
        await expect(User.adminDeleteUser(adminUserId, regularUserId)).resolves.toEqual({ user: expect.any(Object) });
        expect(await UserRepository.findOneById(regularUserId)).toBeNull();
        const { users, count } = await User.adminFindUsers(adminUserId, 0, 10);
        expect(users.map(u => u.username)).toEqual([adminUsername]);
        expect(count).toBe(1);
      });
      test('Deleting a non-existent user does not throw', async () => {
        await expect(
          User.adminDeleteUser(adminUserId, '00000000-0000-0000-0000-000000000000')
        ).resolves.toEqual({ user: null });
        const { users, count } = await User.adminFindUsers(adminUserId, 0, 10);
        expect(users).toHaveLength(2);
        expect(count).toBe(2);
      });
      test('Fail when the acting user no longer exists', async () => {
        await UserRepository.deleteById(regularUserId);
        await expect(User.adminDeleteUser(regularUserId, regularUserId)).rejects.toThrow(UserNotFoundError);
      });
      test('Fail for non-admin user', async () => {
        await expect(User.adminDeleteUser(regularUserId, regularUserId)).rejects.toThrow(InvalidRoleError);
        expect(await UserRepository.findOneById(regularUserId)).not.toBeNull();
      });
    });
  });
});
