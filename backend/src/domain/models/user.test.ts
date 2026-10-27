import User from './user.js';
import { describe, test, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import emailVerificationRepository from './repository/emailVerificationRepository.js';
import  dataSource from '../../infra/dataSource.js'
import userRepository from './repository/userRepository.js';
import passwordResetCodeRepository from './repository/passwordResetCodeRepository.js';
import type { PasswordResetCode } from '../models/entity/passwordResetCode.js';
import type { EmailVerificationCode } from '../models/entity/emailVerificationCode.js';
import type {  User as UserEntity } from '../models/entity/user.js';
import { InvalidEmailError } from '../errors/InvalidEmailError.js';
import { EmailVerificationNotFoundError } from '../errors/EmailVerificationNotFound.js';
import { InvalidEmailVerificationError } from '../errors/InvalidEmailVerification.js';
import { InvalidUsernameError } from '../errors/InvalidUsernameError.js';
import { UserExistsError } from '../errors/UserExistsError.js';
import { UserNotFoundError } from '../errors/UserNotFoundError.js';
import { InvalidJWTError } from '../errors/InvalidJWTError.js';
import { InvalidPasswordError } from '../errors/InvalidPasswordError.js';
import { PasswordResetCodeNotFoundError } from '../errors/PasswordResetCodeNotFound.js';
import { InvalidPasswordResetCodeError } from '../errors/InvalidPasswordResetCode.js';

describe('User Model Tests', () => {
  const email = 'test@example.com';
  const username = 'testuser123';
  const password = 'Password!123';
  
  const cleanUpTestDB = async () => {
    await emailVerificationRepository.deleteAll();
    await passwordResetCodeRepository.deleteAll();
    await userRepository.deleteAll();
  };
  const checkUser = (user: UserEntity, expectedUsername: string, expectedEmail: string) => {
    expect(user).toBeDefined();
    expect(user).toHaveProperty('username', expectedUsername);
    expect(user).toHaveProperty('email', expectedEmail);
    expect(user).toHaveProperty('id', expect.any(String));
  };

  const checkEmailCode = (emailCode: EmailVerificationCode, expectedEmail: string) => {
    expect(emailCode).toBeDefined();
    expect(emailCode).toHaveProperty('email', expectedEmail);
    expect(emailCode).toHaveProperty('code', expect.any(String));
    expect(emailCode).toHaveProperty('expireAt', expect.any(Date));
  };

  const checkPasswordResetCode = (passwordResetCode: PasswordResetCode, expectedEmail: string) => {
    expect(passwordResetCode).toBeDefined();
    expect(passwordResetCode).toHaveProperty('email', expectedEmail);
    expect(passwordResetCode).toHaveProperty('code', expect.any(String));
    expect(passwordResetCode).toHaveProperty('expireAt', expect.any(Date));
  };

  beforeAll(async () => {
    await dataSource.initialize();
    await cleanUpTestDB();
  });

  afterAll(async () => {
    await cleanUpTestDB();
    await dataSource.destroy();
  });

  describe('User Email Verification Tests', () => {
    beforeEach(async () => {
      await cleanUpTestDB();
    });
    afterEach(async () => {
      await cleanUpTestDB();
    });
    test('create email verification code', async () => {
      const { emailCode } = await User.createEmailVerificationCode(email);
      checkEmailCode(emailCode, email);
    });
    test('Create new email verification code for existing email', async () => {
      const { emailCode: firstEmailCode } = await User.createEmailVerificationCode(email);
      checkEmailCode(firstEmailCode, email);

      const { emailCode: secondEmailCode } = await User.createEmailVerificationCode(email);
      checkEmailCode(secondEmailCode, email);

      expect(secondEmailCode.code).not.toBe(firstEmailCode.code);
    });
    test('Fail to create new email for invalid email', async () => {
      const invalidEmail = 'invalidemail';
      await expect(User.createEmailVerificationCode(invalidEmail)).rejects.toThrow(InvalidEmailError);
    });
  });

  describe('Create New User Tests', () => {
    let emailCode: EmailVerificationCode | null = null;
    beforeEach(async () => {
      // Clean up any existing users and email verification codes before each test
      await cleanUpTestDB();
      const { emailCode: newEmailCode } = await User.createEmailVerificationCode(email);
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
      emailCode.expireAt = new Date(Date.now() - 1000);
      await emailVerificationRepository.save(emailCode);
      await expect(User.createNewUser(username, email, emailCode.code, password)).rejects.toThrow(InvalidEmailVerificationError);
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
      
      const { emailCode:newEmailCode } = await User.createEmailVerificationCode("secondEmail@example.com");
      checkEmailCode(newEmailCode, "secondEmail@example.com");

      if(!newEmailCode?.code) {
        throw new Error('Email verification code not created');
      }

      await expect(User.createNewUser(username, newEmailCode.email, newEmailCode.code, password)).rejects.toThrow(UserExistsError);
    });
    test('Fail to create new user with invalid email', async () => {
      const { emailCode } = await User.createEmailVerificationCode(email);
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
      const { emailCode: newEmailCode } = await User.createEmailVerificationCode(email);
      checkEmailCode(newEmailCode, email);
      const { user } = await User.createNewUser(username, email, newEmailCode.code, password);
      checkUser(user, username, email);
    });
    afterEach(async () => {
      // Clean up any existing users and email verification codes after each test
      await cleanUpTestDB();
    });
    test('Successfully get user with valid JWT', async () => {
      const { jwt } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      if(!jwt) {
        throw new Error('JWT not created');
      }

      const { user } = await User.getUser(jwt);
      checkUser(user, username, email);
    });
    test('Fail to get jwt with invalid username and password', async () => {
      await expect(User.createUserAuthentication('invalidUsername', 'invalidPassword')).rejects.toThrow(UserNotFoundError);
    });
    test('Fail to get user with invalid JWT', async () => {
      await expect(User.getUser('invalidJWT')).rejects.toThrow(InvalidJWTError);
      
    });
  });
  describe('Update Username', () => {
    beforeEach(async () => {
      // Clean up any existing test data before each test
      await cleanUpTestDB();
      const { emailCode } = await User.createEmailVerificationCode(email);
      checkEmailCode(emailCode, email);
      const { user } = await User.createNewUser(username, email, emailCode?.code, password);
      checkUser(user, username, email);
    });
    afterEach(async () => {
      // Clean up any test data after each test in this describe block
      await cleanUpTestDB();
    });
    test('Update username successfully', async () => {
      const { jwt } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();

      const newUsername = 'updatedUsername';
      const { user } = await User.updateUsername(newUsername, jwt);
      checkUser(user, newUsername, email);
    });
    test('Fail to update username with invalid JWT', async () => {
      const newUsername = 'updatedUsername';
      await expect(User.updateUsername(newUsername, 'invalidJWT')).rejects.toThrow(InvalidJWTError);
    });
    test('Fail to update username with empty JWT', async () => {
      const newUsername = 'updatedUsername';
      await expect(User.updateUsername(newUsername, '')).rejects.toThrow(InvalidJWTError);
    });
    test('Fail to update username with missing JWT', async () => {
      const newUsername = 'updatedUsername';
      await expect(User.updateUsername(newUsername, undefined as any)).rejects.toThrow(InvalidJWTError);
    });
    test('Fail to update username with empty new username', async () => {
      const { jwt } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      const newUsername = '';
      await expect(User.updateUsername(newUsername, jwt)).rejects.toThrow(InvalidUsernameError);
    });
    test('Fail to update username with missing new username', async () => {
      const { jwt } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      const newUsername = undefined as any;
      await expect(User.updateUsername(newUsername, jwt)).rejects.toThrow(InvalidUsernameError);
    });
    test('Fail to update username with invalid new username', async () => {
      const { jwt } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      const newUsername = '123invalid@username';
      await expect(User.updateUsername(newUsername, jwt)).rejects.toThrow(InvalidUsernameError);
    });
    test('Fail to update username with too short new username', async () => {
      const { jwt } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      const newUsername = 'ab';
      await expect(User.updateUsername(newUsername, jwt)).rejects.toThrow(InvalidUsernameError);
    });
    test('Fail to update username with too long new username', async () => {
      const { jwt } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      const newUsername = 'a'.repeat(51); // Assuming max length is 50
      await expect(User.updateUsername(newUsername, jwt)).rejects.toThrow(InvalidUsernameError);
    });
  });
  describe('Update Email', () => {
    // Add tests for updating email here
    beforeEach(async () => {
      // Clean up any existing test data before each test
      await cleanUpTestDB();
      const { emailCode } = await User.createEmailVerificationCode(email);
      checkEmailCode(emailCode, email);
      const { user } = await User.createNewUser(username, email, emailCode?.code, password);
      checkUser(user, username, email)
    });
    afterEach(async () => {
      // Clean up any test data after each test in this describe block
      await cleanUpTestDB();
    });
    test('Successfully update email with valid new email', async () => {
      const { jwt } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      
      const newEmail = 'newemail@example.com';
      const { emailCode } = await User.createEmailVerificationCode(newEmail);
      checkEmailCode(emailCode, newEmail);
      const { user } = await User.updateEmail(newEmail, emailCode.code, jwt);
      checkUser(user, username, newEmail);
      
    });
    test('Fail to update email with no email verification code', async () => {
      const { jwt } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();

      const newEmail = 'newemail@example.com';
      await expect(User.updateEmail(newEmail, '', jwt)).rejects.toThrow(EmailVerificationNotFoundError);
    });
    test('Fail to update email with invalid email verification code', async () => {
      const { jwt } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      
      const newEmail = 'newemail@example.com';
      await expect(User.updateEmail(newEmail, 'invalidcode', jwt)).rejects.toThrow(EmailVerificationNotFoundError);
    });
  });
  describe('Update Password', () => {
    beforeEach(async () => {
      const { emailCode } = await User.createEmailVerificationCode(email);
      checkEmailCode(emailCode, email);
      const { user } = await User.createNewUser(username, email, emailCode?.code, password);
      checkUser(user, username, email);
    });
    afterEach(async () => {
      await emailVerificationRepository.deleteAll();
      await userRepository.deleteAll();
    });
    // TODO: Figure out why update password has high latency 300ms
    test('Successfully update password', async () => {
      const { jwt } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      const newPassword = 'newPassword!123';
      const { user } = await User.updatePassword(password, newPassword, jwt);
      checkUser(user, username, email);
      const { jwt: newJwt } = await User.createUserAuthentication(username, newPassword);
      expect(newJwt).toBeDefined();
      const { user: newUser } = await User.getUser(newJwt);
      checkUser(newUser, username, email);
    });
    test('Fail to update password with incorrect current password', async () => {
      const { jwt } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();

      const newPassword = 'newPassword!123';
      await expect(User.updatePassword('wrongPassword', newPassword, jwt)).rejects.toThrow(InvalidPasswordError);
    });
    test('Fail to update password with missing JWT', async () => {
      const newPassword = 'newPassword!123';
      await expect(User.updatePassword(password, newPassword, '')).rejects.toThrow(InvalidJWTError);
    });
    test('Fail to update password with missing current password', async () => {
      const { jwt } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();

      const newPassword = 'newPassword!123';
      await expect(User.updatePassword('', newPassword, jwt)).rejects.toThrow(InvalidPasswordError);
    });
    test('Fail to update password with missing new password', async () => {
      const { jwt } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();

      await expect(User.updatePassword(password, '', jwt)).rejects.toThrow(InvalidPasswordError);
    });
    test('Fail to update password with incorrect JWT', async () => {
      const { jwt } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();

      const newPassword = 'newPassword!123';
      await expect(User.updatePassword(password, newPassword, 'invalidJWT')).rejects.toThrow(InvalidJWTError);
    });
    test('Fail to update password with same as current password', async () => {
      const { jwt } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();

      await expect(User.updatePassword(password, password, jwt)).rejects.toThrow(InvalidPasswordError);
    });
    test('Fail to update password with invalid new password', async () => {
      const { jwt } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();

      const invalidNewPassword = 'password';
      await expect(User.updatePassword(password, invalidNewPassword, jwt)).rejects.toThrow(InvalidPasswordError);
    });
  });
  describe('Create Password Reset Code', () => {
    beforeEach(async () => {
      // Any setup needed before each test in this describe block
      await cleanUpTestDB()
      const { emailCode } = await User.createEmailVerificationCode(email);
      await checkEmailCode(emailCode, email);
      const { user } = await User.createNewUser(username, email, emailCode.code, password);
      await checkUser(user, username, email);
    });
    afterEach(async () => {
      // Any cleanup needed after each test in this describe block
      await cleanUpTestDB();
    });
    test('Successfully create password reset code', async () => {
      const { passwordResetCode } = await User.createPasswordResetCode(email);
      checkPasswordResetCode(passwordResetCode, email);
    });
    test('Fail to create password reset code with invalid email', async () => {
      await expect(User.createPasswordResetCode('invalidEmail')).rejects.toThrow(InvalidEmailError);
    });
    test('Fail to create password reset code for non-existent user email', async () => {
      await expect(User.createPasswordResetCode('invalid@example.com')).rejects.toThrow(UserNotFoundError);
    });
    test('Fail to create password reset code with empty email', async () => {
      await expect(User.createPasswordResetCode('')).rejects.toThrow(InvalidEmailError);
    });
    test('Fail to create password reset code with whitespace email', async () => {
      await expect(User.createPasswordResetCode('   ')).rejects.toThrow(InvalidEmailError);
    });
  });
  describe('Reset Password', () => {
    let passwordResetCode: PasswordResetCode;
    beforeEach(async () => {
      await cleanUpTestDB();
      const { emailCode } = await User.createEmailVerificationCode(email);
      checkEmailCode(emailCode, email);
      const { user: newUser } = await User.createNewUser(username, email, emailCode.code, password);
      checkUser(newUser, username, email);
      const { passwordResetCode: prc } = await User.createPasswordResetCode(email);
      checkPasswordResetCode(prc, email);
      passwordResetCode = prc;
    });
    afterEach(async () => {
      await cleanUpTestDB();
    });
    test('Successfully reset password with valid code', async () => {
      const { user } = await User.resetPassword('newPassword!123', passwordResetCode.code);
      checkUser(user, username, email);
      const { jwt } = await User.createUserAuthentication(username, 'newPassword!123');
      expect(jwt).toBeDefined();

      const { user: fetchedUser } = await User.getUser(jwt);
      checkUser(fetchedUser, username, email);
    });
    test('Fail to reset password with invalid code', async () => {
      await expect(User.resetPassword('newPassword!123', 'invalidCode')).rejects.toThrow(PasswordResetCodeNotFoundError);
    });
    test('Fail to reset password with empty code', async () => {
      await expect(User.resetPassword('newPassword!123', '')).rejects.toThrow(PasswordResetCodeNotFoundError);
    });
    test('Fail to reset password with whitespace code', async () => {
      await expect(User.resetPassword('newPassword!123', '   ')).rejects.toThrow(PasswordResetCodeNotFoundError);
    });
    test('Fail to reset password with expired code', async () => {
      // Simulate code expiration
      passwordResetCode.expireAt = new Date(Date.now() - 1000); // Set expiration to 1 second in the past
      await passwordResetCodeRepository.save(passwordResetCode);
      await expect(User.resetPassword('newPassword!123', passwordResetCode.code)).rejects.toThrow(InvalidPasswordResetCodeError);
    });
    test('Fail to reset password with invalid email', async () => {
      await expect(User.createPasswordResetCode('invalidEmail')).rejects.toThrow(InvalidEmailError);
    });
    test('Fail to reset password with non-existent email', async () => {
      await expect(User.createPasswordResetCode('nonexistent@example.com')).rejects.toThrow(UserNotFoundError);
    });
    test('Fail to reset password with invalid new password', async () => {
      await expect(User.resetPassword('password', passwordResetCode.code)).rejects.toThrow(InvalidPasswordError);
    });
    test('Fail to reset password with same as old password', async () => {
      await expect(User.resetPassword(password, passwordResetCode.code)).rejects.toThrow(InvalidPasswordError);
    });
  });
  describe('Delete User', () => {
    beforeEach(async () => {
      await cleanUpTestDB();
      
      const { emailCode } = await User.createEmailVerificationCode(email);
      checkEmailCode(emailCode, email);

      const { user } = await User.createNewUser(username, email, emailCode.code, password);
      checkUser(user, username, email);
    });
    afterEach(async () => {
      await cleanUpTestDB();
    });
    test('Delete user successfully', async () => {
      const { jwt } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      await User.deleteUser(jwt);
      await expect(User.getUser(jwt)).rejects.toThrow(UserNotFoundError);
    });
    test('Fail to delete user with invalid JWT', async () => {
      await expect(User.deleteUser('invalidJWT')).rejects.toThrow(InvalidJWTError);
      const { jwt } = await User.createUserAuthentication(username, password);  
      expect(jwt).toBeDefined();

      const { user } = await User.getUser(jwt);
      checkUser(user, username, email);
    });
    test('Fail to delete user with valid JWT but already deleted user', async () => {
      const { jwt } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      
      await User.deleteUser(jwt);
      await expect(User.deleteUser(jwt)).rejects.toThrow(UserNotFoundError);
    });
    test('Fail to delete user with empty JWT', async () => {
      await expect(User.deleteUser('')).rejects.toThrow(InvalidJWTError);
    });
  });
});