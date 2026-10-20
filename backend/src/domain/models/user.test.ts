import User from './user.js';
import { describe, test, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import emailVerificationRepository from './repository/emailVerificationRepository.js';
import  dataSource from '../../infra/dataSource.js'
import userRepository from './repository/userRepository.js';
import passwordResetCodeRepository from './repository/passwordResetCodeRepository.js';
import type { EmailVerificationCode } from '../models/entity/emailVerificationCode.js';

describe('User Model Tests', () => {
  const email = 'test@example.com';
  const username = 'testuser123';
  const password = 'Password!123';
  
  beforeAll(async () => {
    await dataSource.initialize();
    await emailVerificationRepository.deleteAll();
    await passwordResetCodeRepository.deleteAll();
    await userRepository.deleteAll();
  });

  afterAll(async () => {
    await emailVerificationRepository.deleteAll();
    await passwordResetCodeRepository.deleteAll();
    await userRepository.deleteAll();
    await dataSource.destroy();
  });

  describe('User Email Verification Tests', () => {
    beforeAll(async () => {
      const existingEmailVerification = await emailVerificationRepository.findOne({where: { email }});
      if(existingEmailVerification) {
        await emailVerificationRepository.remove(existingEmailVerification);
      }
    });
    afterAll(async () => {
      const existingEmailVerification = await emailVerificationRepository.findOne({where: { email }});
      if(existingEmailVerification) {
        await emailVerificationRepository.remove(existingEmailVerification);
      }
    });
    test('create email verification code', async () => {
      const { emailCode, success } = await User.createEmailVerificationCode(email);
      expect(emailCode).toBeDefined();
      expect(emailCode).toHaveProperty('email', email);
      expect(emailCode).toHaveProperty('code', expect.any(String));
      expect(emailCode).toHaveProperty('expireAt', expect.any(Date));
      expect(success).toBe(true);
      if(emailCode) {
        await emailVerificationRepository.remove(emailCode);
      }
    });
    test('Create new email verification code for existing email', async () => {
      const { emailCode: firstEmailCode, success: firstSuccess } = await User.createEmailVerificationCode(email);
      expect(firstEmailCode).toBeDefined();
      expect(firstSuccess).toBe(true);

      const { emailCode: secondEmailCode, success: secondSuccess } = await User.createEmailVerificationCode(email);
      expect(secondEmailCode).toBeDefined();
      expect(secondSuccess).toBe(true);

      expect(secondEmailCode?.code).not.toBe(firstEmailCode?.code);

      if(firstEmailCode) {
        await emailVerificationRepository.remove(firstEmailCode);
      }
      if(secondEmailCode) {
        await emailVerificationRepository.remove(secondEmailCode);
      }
    });
    test('Fail to create new email for invalid email', async () => {
      const invalidEmail = 'invalidemail';
      const { emailCode, success } = await User.createEmailVerificationCode(invalidEmail);
      expect(emailCode).toBeUndefined();
      expect(success).toBe(false);
    });

  })

  describe('Create New User Tests', () => {
    let emailCode: EmailVerificationCode | null = null;
    beforeEach(async () => {
      // Clean up any existing users and email verification codes before each test
      await userRepository.deleteAll();
      await emailVerificationRepository.deleteAll();
      const { emailCode: newEmailCode, success: newEmailCodeSuccess } = await User.createEmailVerificationCode(email);
      expect(newEmailCodeSuccess).toBe(true);
      expect(newEmailCode).toBeDefined();
      expect(newEmailCode).toHaveProperty('email', email);
      expect(newEmailCode).toHaveProperty('code', expect.any(String));
      expect(newEmailCode).toHaveProperty('expireAt', expect.any(Date));
      if(!newEmailCode?.code) {
        throw new Error('Email verification code not created in beforeEach');
      }
      emailCode = newEmailCode;
    });
    afterEach(async () => {
      // Clean up any existing users and email verification codes after each test
      await userRepository.deleteAll();
      await emailVerificationRepository.deleteAll();
    });
    test('Create new user', async () => {
      if(!emailCode?.code) {
        throw new Error('Email verification code not available for creating new user');
      }
      const { newUser, success: newUserSuccess } = await User.createNewUser(username, email, emailCode.code, password);
      expect(newUser).toBeDefined();
      expect(newUser).toHaveProperty('username', username);
      expect(newUser).toHaveProperty('email', email);
      expect(newUser).toHaveProperty('password', expect.any(String));
      expect(newUserSuccess).toBe(true);
    });
    test('Fail to create new user with invalid email verification code', async () => {
      const invalidCode = 'invalid-code';
      const { newUser, success: newUserSuccess } = await User.createNewUser(username, email, invalidCode, password);
      expect(newUser).toBeUndefined();
      expect(newUserSuccess).toBe(false);
    });
    test('Fail to create new user with expired email verification code', async () => {
      if(!emailCode?.code) {
        throw new Error('Email verification code not available for creating new user');
      }

      // Manually expire the email verification code
      emailCode.expireAt = new Date(Date.now() - 1000);
      await emailVerificationRepository.save(emailCode);
      
      const { newUser, success: newUserSuccess } = await User.createNewUser(username, email, emailCode.code, password);
      expect(newUser).toBeUndefined();
      expect(newUserSuccess).toBe(false);
    });
    test('Fail to create new user with duplicate email', async () => {
      if(!emailCode?.code) {
        throw new Error('Email verification code not available for creating new user');
      }
      
      const { newUser, success: newUserSuccess } = await User.createNewUser(username, email, emailCode.code, password);
      expect(newUser).toBeDefined();
      expect(newUserSuccess).toBe(true);

      const { newUser: duplicateUser, success: duplicateUserSuccess } = await User.createNewUser(username, email, emailCode.code, password);
      expect(duplicateUser).toBeUndefined();
      expect(duplicateUserSuccess).toBe(false);
    });
    test('Fail to create new user with short username', async () => {
      if(!emailCode?.code) {
        throw new Error('Email verification code not created');
      }

      const { newUser, success: newUserSuccess } = await User.createNewUser('a', email, emailCode?.code, password);
      expect(newUser).toBeUndefined();
      expect(newUserSuccess).toBe(false);

      if(emailCode) {
        await emailVerificationRepository.remove(emailCode);
      }
    });
    test('Fail to create new user with numbers only username', async () => {
      if(!emailCode?.code) {
        throw new Error('Email verification code not created');
      }

      const { newUser, success: newUserSuccess } = await User.createNewUser('123456', email, emailCode?.code, password);
      expect(newUser).toBeUndefined();
      expect(newUserSuccess).toBe(false);

      if(emailCode) {
        await emailVerificationRepository.remove(emailCode);
      }
    });
    test('Fail to create new user with long username', async () => {
      if(!emailCode?.code) {
        throw new Error('Email verification code not created');
      }

      const { newUser, success: newUserSuccess } = await User.createNewUser('a'.repeat(256), email, emailCode?.code, password);
      expect(newUser).toBeUndefined();
      expect(newUserSuccess).toBe(false);

      if(emailCode) {
        await emailVerificationRepository.remove(emailCode);
      }
    });
    test('Fail to create new user with empty username', async () => {
      if(!emailCode?.code) {
        throw new Error('Email verification code not created');
      }

      const { newUser, success: newUserSuccess } = await User.createNewUser('', email, emailCode?.code, password);
      expect(newUser).toBeUndefined();
      expect(newUserSuccess).toBe(false);

      if(emailCode) {
        await emailVerificationRepository.remove(emailCode);
      }
    });
    test('Fail to create new user with existing username', async () => {
      if(!emailCode?.code) {
        throw new Error('Email verification code not created');
      }
      
      const { newUser, success: newUserSuccess } = await User.createNewUser(username, email, emailCode?.code, password);
      expect(newUser).toBeUndefined();
      expect(newUserSuccess).toBe(false);

      const { emailCode:newEmailCode, success: newEmailCodeSuccess } = await User.createEmailVerificationCode("secondEmail@example.com");
      expect(newEmailCode).toBeDefined();
      expect(newEmailCodeSuccess).toBe(true);

      if(!newEmailCode?.code) {
        throw new Error('Email verification code not created');
      }

      const { newUser:duplicateUser, success: duplicateUserSuccess } = await User.createNewUser(username, newEmailCode.email, newEmailCode.code, password);
      expect(duplicateUser).toBeUndefined();
      expect(duplicateUserSuccess).toBe(false);

      if(newEmailCode) {
        await emailVerificationRepository.remove(newEmailCode);
      }
    });
    test('Fail to create new user with invalid email', async () => {
      const { emailCode, success } = await User.createEmailVerificationCode(email);
      expect(emailCode).toBeDefined();
      expect(success).toBe(true);

      if(!emailCode?.code) {
        throw new Error('Email verification code not created');
      }

      const { newUser, success: newUserSuccess } = await User.createNewUser(username, 'invalidEmail', emailCode?.code, password);
      expect(newUser).toBeUndefined();
      expect(newUserSuccess).toBe(false);

      if(emailCode) {
        await emailVerificationRepository.remove(emailCode);
      }
    });
  });

  describe('Get User Authentication', () => {
    test('Successfully get user with valid JWT', async () => {
      const { emailCode, success } = await User.createEmailVerificationCode(email);
      expect(emailCode).toBeDefined();
      expect(success).toBe(true);

      if(!emailCode?.code) {
        throw new Error('Email verification code not created');
      }

      const { newUser, success: newUserSuccess } = await User.createNewUser(username, email, emailCode?.code, password);
      expect(newUser).toBeDefined();
      expect(newUserSuccess).toBe(true);

      if(!newUser) {
        throw new Error('New user not created');
      }

      const { jwt, success: authSuccess } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      expect(authSuccess).toBe(true);
      if(!jwt) {
        throw new Error('JWT not created');
      }

      const { user, success: getUserSuccess } = await User.getUser(jwt);
      expect(user).toBeDefined();
      expect(getUserSuccess).toBe(true);
      expect(user?.id).toBe(newUser.id);

      if(emailCode) {
        await emailVerificationRepository.remove(emailCode);
      }
      if(newUser) {
        await userRepository.remove(newUser);
      }
    });
    test('Fail to get jwt with invalid username and password', async () => {
      const { jwt, success: authSuccess } = await User.createUserAuthentication('invalidUsername', 'invalidPassword');
      expect(jwt).toBeUndefined();
      expect(authSuccess).toBe(false);
    });
    test('Fail to get user with invalid JWT', async () => {
      const { user, success: getUserSuccess } = await User.getUser('invalidJWT');
      expect(user).toBeUndefined();
      expect(getUserSuccess).toBe(false);
    });
  });
  describe('Update Username', () => {
    beforeEach(async () => {
      // Clean up any existing test data before each test
      await userRepository.deleteAll();
      await emailVerificationRepository.deleteAll();
      const { emailCode, success } = await User.createEmailVerificationCode(email);
      expect(emailCode).toBeDefined();
      expect(success).toBe(true);
      if(!emailCode?.code) {
        throw new Error('Email verification code not created');
      }
      const { newUser, success: newUserSuccess } = await User.createNewUser(username, email, emailCode?.code, password);
      expect(newUser).toBeDefined();
      expect(newUserSuccess).toBe(true);
      if(!newUser) {
        throw new Error('New user not created');
      }
    });
    afterEach(async () => {
      // Clean up any test data after each test in this describe block
      await userRepository.deleteAll();
      await emailVerificationRepository.deleteAll();
    });
    test('Update username successfully', async () => {
      const { jwt, success: authSuccess } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      expect(authSuccess).toBe(true);
      if(!jwt) {
        throw new Error('JWT not created');
      }

      const newUsername = 'updatedUsername';
      const { newUser, success: updateSuccess } = await User.updateUsername(newUsername, jwt);
      expect(newUser).toBeDefined();
      expect(updateSuccess).toBe(true);
      if(!newUser) {
        throw new Error('Username not updated');
      }
      expect(newUser.username).toBe(newUsername);
    });
    test('Fail to update username with invalid JWT', async () => {
      const newUsername = 'updatedUsername';
      const { newUser, success: updateSuccess } = await User.updateUsername(newUsername, 'invalidJWT');
      expect(newUser).toBeUndefined();
      expect(updateSuccess).toBe(false);
    });
    test('Fail to update username with empty JWT', async () => {
      const newUsername = 'updatedUsername';
      const { newUser, success: updateSuccess } = await User.updateUsername(newUsername, '');
      expect(newUser).toBeUndefined();
      expect(updateSuccess).toBe(false);
    });
    test('Fail to update username with missing JWT', async () => {
      const newUsername = 'updatedUsername';
      const { newUser, success: updateSuccess } = await User.updateUsername(newUsername, undefined as any);
      expect(newUser).toBeUndefined();
      expect(updateSuccess).toBe(false);
    });
    test('Fail to update username with empty new username', async () => {
      const { jwt, success: authSuccess } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      expect(authSuccess).toBe(true);
      if(!jwt) {
        throw new Error('JWT not created');
      }
      const newUsername = '';
      const { newUser, success: updateSuccess } = await User.updateUsername(newUsername, jwt);
      expect(newUser).toBeUndefined();
      expect(updateSuccess).toBe(false);
    });
    test('Fail to update username with missing new username', async () => {
      const { jwt, success: authSuccess } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      expect(authSuccess).toBe(true);
      if(!jwt) {
        throw new Error('JWT not created');
      }
      const newUsername = undefined as any;
      const { newUser, success: updateSuccess } = await User.updateUsername(newUsername, jwt);
      expect(newUser).toBeUndefined();
      expect(updateSuccess).toBe(false);
    });
    test('Fail to update username with invalid new username', async () => {
      const { jwt, success: authSuccess } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      expect(authSuccess).toBe(true);
      if(!jwt) {
        throw new Error('JWT not created');
      }
      const newUsername = '123invalid@username';
      const { newUser, success: updateSuccess } = await User.updateUsername(newUsername, jwt);
      expect(newUser).toBeUndefined();
      expect(updateSuccess).toBe(false);
    });
    test('Fail to update username with too short new username', async () => {
      const { jwt, success: authSuccess } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      expect(authSuccess).toBe(true);
      if(!jwt) {
        throw new Error('JWT not created');
      }
      const newUsername = 'ab';
      const { newUser, success: updateSuccess } = await User.updateUsername(newUsername, jwt);
      expect(newUser).toBeUndefined();
      expect(updateSuccess).toBe(false);
    });
    test('Fail to update username with too long new username', async () => {
      const { jwt, success: authSuccess } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      expect(authSuccess).toBe(true);
      if(!jwt) {
        throw new Error('JWT not created');
      }
      const newUsername = 'a'.repeat(51); // Assuming max length is 50
      const { newUser, success: updateSuccess } = await User.updateUsername(newUsername, jwt);
      expect(newUser).toBeUndefined();
      expect(updateSuccess).toBe(false);
    });
  });
  describe('Update Email', () => {
    // Add tests for updating email here
    beforeEach(async () => {
      // Clean up any existing test data before each test
      await userRepository.deleteAll();
      await emailVerificationRepository.deleteAll();
      const { emailCode, success } = await User.createEmailVerificationCode(email);
      expect(emailCode).toBeDefined();
      expect(success).toBe(true);
      if(!emailCode?.code) {
        throw new Error('Email verification code not created');
      }
      const { newUser, success: newUserSuccess } = await User.createNewUser(username, email, emailCode?.code, password);
      expect(newUser).toBeDefined();
      expect(newUserSuccess).toBe(true);
      if(!newUser) {
        throw new Error('New user not created');
      }
    });
    afterEach(async () => {
      // Clean up any test data after each test in this describe block
      await userRepository.deleteAll();
      await emailVerificationRepository.deleteAll();
    });
    test('Successfully update email with valid new email', async () => {
      const { jwt, success: authSuccess } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      expect(authSuccess).toBe(true);
      if(!jwt) {
        throw new Error('JWT not created');
      }
      
      const newEmail = 'newemail@example.com';
      const {emailCode, success: emailCodeSuccess } = await User.createEmailVerificationCode(newEmail);
      expect(emailCode).toBeDefined();
      expect(emailCodeSuccess).toBe(true);
      if(!emailCode?.code) {
        throw new Error('Email verification code not created');
      } 
      const { newUser, success: updateSuccess } = await User.updateEmail(newEmail, emailCode.code, jwt);
      expect(newUser).toBeDefined();
      expect(updateSuccess).toBe(true);
    });
    test('Fail to update email with no email verification code', async () => {
      const { jwt, success: authSuccess } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      expect(authSuccess).toBe(true);
      if(!jwt) {
        throw new Error('JWT not created');
      }
      
      const newEmail = 'newemail@example.com';
      const { newUser, success: updateSuccess } = await User.updateEmail(newEmail, '', jwt);
      expect(newUser).toBeUndefined();
      expect(updateSuccess).toBe(false);
    });
    test('Fail to update email with invalid email verification code', async () => {
      const { jwt, success: authSuccess } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      expect(authSuccess).toBe(true);
      if(!jwt) {
        throw new Error('JWT not created');
      }
      
      const newEmail = 'newemail@example.com';
      const { newUser, success: updateSuccess } = await User.updateEmail(newEmail, 'invalidcode', jwt);
      expect(newUser).toBeUndefined();
      expect(updateSuccess).toBe(false);
    });
  });
  describe('Update Password', () => {
    beforeEach(async () => {
      const { emailCode, success: emailCodeSuccess } = await User.createEmailVerificationCode(email);
      expect(emailCode).toBeDefined();
      expect(emailCodeSuccess).toBe(true);
      if(!emailCode?.code) {
        throw new Error('Email verification code not created');
      }
      const { newUser, success: newUserSuccess } = await User.createNewUser(username, email, emailCode?.code, password);
      expect(newUser).toBeDefined();
      expect(newUserSuccess).toBe(true);
      if(!newUser) {
        throw new Error('New user not created');
      }
    });
    afterEach(async () => {
      await emailVerificationRepository.deleteAll();
      await userRepository.deleteAll();
    });
    test('Successfully update password', async () => {
      const { jwt, success: authSuccess } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      expect(authSuccess).toBe(true);
      if(!jwt) {
        throw new Error('JWT not created');
      }

      const newPassword = 'newPassword!123';
      const { success: updateSuccess } = await User.updatePassword(password, newPassword, jwt);
      expect(updateSuccess).toBe(true);
    });
    test('Fail to update password with incorrect current password', async () => {
      const { jwt, success: authSuccess } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      expect(authSuccess).toBe(true);
      if(!jwt) {
        throw new Error('JWT not created');
      }

      const newPassword = 'newPassword!123';
      const { success: updateSuccess } = await User.updatePassword('wrongPassword', newPassword, jwt);
      expect(updateSuccess).toBe(false);
    });
    test('Fail to update password with missing JWT', async () => {
      const newPassword = 'newPassword!123';
      const { success: updateSuccess } = await User.updatePassword(password, newPassword, '');
      expect(updateSuccess).toBe(false);
    });
    test('Fail to update password with missing current password', async () => {
      const { jwt, success: authSuccess } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      expect(authSuccess).toBe(true);
      if(!jwt) {
        throw new Error('JWT not created');
      }

      const newPassword = 'newPassword!123';
      const { success: updateSuccess } = await User.updatePassword('', newPassword, jwt);
      expect(updateSuccess).toBe(false);
    });
    test('Fail to update password with missing new password', async () => {
      const { jwt, success: authSuccess } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      expect(authSuccess).toBe(true);
      if(!jwt) {
        throw new Error('JWT not created');
      }

      const { success: updateSuccess } = await User.updatePassword(password, '', jwt);
      expect(updateSuccess).toBe(false);
    });
    test('Fail to update password with incorrect JWT', async () => {
      const { jwt, success: authSuccess } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      expect(authSuccess).toBe(true);
      if(!jwt) {
        throw new Error('JWT not created');
      }

      const newPassword = 'newPassword!123';
      const { success: updateSuccess } = await User.updatePassword(password, newPassword, 'invalidJWT');
      expect(updateSuccess).toBe(false);
    });
    test('Fail to update password with expired JWT', async () => {
      const { jwt, success: authSuccess } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      expect(authSuccess).toBe(true);
      if(!jwt) {
        throw new Error('JWT not created');
      }

      const newPassword = 'newPassword!123';
      const expiredJWT = 'expiredJWT'; // Replace with actual expired JWT if available
      const { success: updateSuccess } = await User.updatePassword(password, newPassword, expiredJWT);
      expect(updateSuccess).toBe(false);
    });
    test('Fail to update password with same as current password', async () => {
      const { jwt, success: authSuccess } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      expect(authSuccess).toBe(true);
      if(!jwt) {
        throw new Error('JWT not created');
      }

      const { success: updateSuccess } = await User.updatePassword(password, password, jwt);
      expect(updateSuccess).toBe(false);
    });
    test('Fail to update password with invalid new password', async () => {
      const { jwt, success: authSuccess } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      expect(authSuccess).toBe(true);
      if(!jwt) {
        throw new Error('JWT not created');
      }

      const invalidNewPassword = '123password';
      const { success: updateSuccess } = await User.updatePassword(password, invalidNewPassword, jwt);
      expect(updateSuccess).toBe(false);
    });
  });
  describe('Create Password Reset Code', () => {
    beforeEach(async () => {
      // Any setup needed before each test in this describe block
      await passwordResetCodeRepository.deleteAll();
      await userRepository.deleteAll();
      const { emailCode, success } = await User.createEmailVerificationCode(email);
      expect(success).toBe(true);
      expect(emailCode).toBeDefined();
      if(!emailCode?.code){
        throw new Error('Email code not created');
      }
      const { newUser, success: userSuccess } = await User.createNewUser(username, email, emailCode.code, password);
      expect(userSuccess).toBe(true);
      expect(newUser).toBeDefined();
      if(!newUser?.id){
        throw new Error('User not created');
      }
    });
    afterEach(async () => {
      // Any cleanup needed after each test in this describe block
      await passwordResetCodeRepository.deleteAll();
      await userRepository.deleteAll();
      await emailVerificationRepository.deleteAll();
    });
    test('Successfully create password reset code', async () => {
      const { passwordResetCode, success, error } = await User.createPasswordResetCode(email);
      expect(success).toBe(true);
      expect(passwordResetCode).toBeDefined();
      expect(error).toBeUndefined();
      if(!passwordResetCode?.code){
        throw new Error('Password reset code not created');
      }
      const foundCode = await passwordResetCodeRepository.findOne({where: { code: passwordResetCode.code }});
      expect(foundCode).toBeDefined();
      expect(foundCode?.code).toBe(passwordResetCode.code);
      expect(foundCode?.email).toBe(email);
    });
    test('Fail to create password reset code with invalid email', async () => {
      const { success } = await User.createPasswordResetCode('invalidEmail');
      expect(success).toBe(false);
    });
    test('Fail to create password reset code for non-existent user email', async () => {
      const { success } = await User.createPasswordResetCode('invalid@example.com');
      expect(success).toBe(false);
    });
    test('Fail to create password reset code with empty email', async () => {
      const { success } = await User.createPasswordResetCode('');
      expect(success).toBe(false);
    });
    test('Fail to create password reset code with whitespace email', async () => {
      const { success } = await User.createPasswordResetCode('   ');
      expect(success).toBe(false);
    });
  });
  describe('Reset Password', () => {
    beforeEach(async () => {
      await passwordResetCodeRepository.deleteAll();
      await userRepository.deleteAll();
      await emailVerificationRepository.deleteAll();
      const { emailCode, success } = await User.createEmailVerificationCode(email);
      expect(success).toBe(true);
      expect(emailCode).toBeDefined();
      if(!emailCode?.code){
        throw new Error('Email code not created');
      }
      const { newUser, success: userSuccess } = await User.createNewUser(username, email, emailCode.code, password);
      expect(userSuccess).toBe(true);
      expect(newUser).toBeDefined();
      if(!newUser?.id){
        throw new Error('User not created');
      }
    });
    afterEach(async () => {
      await passwordResetCodeRepository.deleteAll();
      await userRepository.deleteAll();
      await emailVerificationRepository.deleteAll();
    });
    test('Successfully reset password with valid code', async () => {
      const { passwordResetCode } = await User.createPasswordResetCode(email);
      if(!passwordResetCode?.code){
        throw new Error('Password reset code not created');
      }
      const { success } = await User.resetPassword('newPassword!123', passwordResetCode.code);
      expect(success).toBe(true);
      const { jwt, success: authSuccess } = await User.createUserAuthentication(username, 'newPassword!123');
      expect(authSuccess).toBe(true);
      expect(jwt).toBeDefined();
      if(!jwt){
        throw new Error('JWT not created');
      }
      const { user } = await User.getUser(jwt);
      expect(user).toBeDefined();
      expect(user?.email).toBe(email);
      expect(user?.username).toBe(username);
    });
    test('Fail to reset password with invalid code', async () => {
      const { success } = await User.resetPassword('newPassword!123', 'invalidCode');
      expect(success).toBe(false);
    });
    test('Fail to reset password with empty code', async () => {
      const { success } = await User.resetPassword('newPassword!123', '');
      expect(success).toBe(false);
    });
    test('Fail to reset password with whitespace code', async () => {
      const { success } = await User.resetPassword('newPassword!123', '   ');
      expect(success).toBe(false);
    });
    test('Fail to reset password with expired code', async () => {
      const { passwordResetCode } = await User.createPasswordResetCode(email);
      if(!passwordResetCode?.code){
        throw new Error('Password reset code not created');
      }
      // Simulate code expiration
      passwordResetCode.expireAt = new Date(Date.now() - 1000); // Set expiration to 1 second in the past
      await passwordResetCodeRepository.save(passwordResetCode);

      const { success } = await User.resetPassword('newPassword!123', passwordResetCode.code);
      expect(success).toBe(false);
    });
    test('Fail to reset password with invalid email', async () => {
      const { success } = await User.createPasswordResetCode('invalidEmail');
      expect(success).toBe(false);
    });
    test('Fail to reset password with invalid new password', async () => {
      const { passwordResetCode } = await User.createPasswordResetCode(email);
      if(!passwordResetCode?.code){
        throw new Error('Password reset code not created');
      }
      const { success } = await User.resetPassword('password', passwordResetCode.code);
      expect(success).toBe(false);
    });
  });
  describe('Delete User', () => {
    beforeEach(async () => {
      await userRepository.deleteAll();
      await emailVerificationRepository.deleteAll();
      
      const { emailCode } = await User.createEmailVerificationCode(email);
      expect(emailCode).toBeDefined();
      expect(emailCode?.code).toBeDefined();
      expect(emailCode?.email).toBe(email);
      expect(emailCode?.expireAt).toBeDefined();

      if(!emailCode?.code){
        throw new Error('Email verification code not created');
      }
      const { newUser, success: createSuccess } = await User.createNewUser(username, email, emailCode.code, password);
      expect(newUser).toBeDefined();
      expect(newUser?.id).toBeDefined();
      expect(newUser?.username).toBe(username);
      expect(newUser?.email).toBe(email);
      expect(newUser?.password).toBeDefined();
      expect(createSuccess).toBe(true);
    });
    afterEach(async () => {
      await userRepository.deleteAll();
      await emailVerificationRepository.deleteAll();
    });
    test('Delete user successfully', async () => {
      const { jwt, success: authSuccess } = await User.createUserAuthentication(username, password);
      expect(jwt).toBeDefined();
      expect(authSuccess).toBe(true);
      if(!jwt){
        throw new Error('JWT not created');
      }
      const { success } = await User.deleteUser(jwt);
      expect(success).toBe(true);
      const { user } = await User.getUser(jwt);
      expect(user).toBeUndefined();
    });
    test('Fail to delete user with invalid JWT', async () => {
      const { success } = await User.deleteUser('invalidJWT');
      expect(success).toBe(false);
      const { jwt, success: authSuccess } = await User.createUserAuthentication(username, password);  
      expect(authSuccess).toBe(true);
      expect(jwt).toBeDefined();
      if(!jwt){
        throw new Error('JWT not created');
      }
      const { user } = await User.getUser(jwt);
      expect(user).toBeDefined();
    });
  });
});