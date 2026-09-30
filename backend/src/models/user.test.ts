import User from './user.js';
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { User as UserEntity } from "./entity/user.js";
import emailVerificationRepository from './repository/emailVerificationRepository.js';
import  dataSource from '../infra/dataSource.js';
import userRepository from './repository/userRepository.js';

describe('User Model Tests', () => {
  // Setup
  const email = 'test@example.com';
  const username = 'testuser123';
  const password = 'password!123';

  beforeAll(async () => {
    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  describe('User Email Verification Tests', () => {
    beforeAll(async () => {
      const existingEmailVerification = await emailVerificationRepository.findOne({where: { email }});
      if(existingEmailVerification) {
        await emailVerificationRepository.delete(email);
      }
    });
    afterAll(async () => {
      const existingEmailVerification = await emailVerificationRepository.findOne({where: { email }});
      if(existingEmailVerification) {
        await emailVerificationRepository.delete(email);
      }
    });
    test('create email verification code', async () => {
      const { emailCode, success } = await User.createEmailVerificationCode(email);
      expect(emailCode).toBeDefined();
      expect(emailCode).toHaveProperty('email', email);
      expect(emailCode).toHaveProperty('code', expect.any(String));
      expect(emailCode).toHaveProperty('verified', false);
      expect(success).toBe(true);
      await emailVerificationRepository.delete(email);
    });
    test('verify email verification code', async () => {
      const { emailCode, success } = await User.createEmailVerificationCode(email);
      if(emailCode === undefined || emailCode.code === undefined || success === undefined) {
        throw new Error('Email verification code not created');
      }
      
      expect(emailCode).toBeDefined();
      expect(emailCode).toHaveProperty('email', email);
      expect(emailCode).toHaveProperty('code', expect.any(String));
      expect(emailCode).toHaveProperty('verified', false);
      expect(success).toBe(true);
      
      // verify email code
      const { success: verificationSuccess } = await User.verifyEmail(email, emailCode.code)
      expect(verificationSuccess).toBe(true);

      const verifiedEmailCode = await emailVerificationRepository.findOne({where: { email }});
      expect(verifiedEmailCode).toBeDefined();
      expect(verifiedEmailCode).toHaveProperty('email', email);
      expect(verifiedEmailCode).toHaveProperty('code', expect.any(String));
      expect(verifiedEmailCode).toHaveProperty('verified', true);

      // cleanup
      await emailVerificationRepository.delete(email);
    })
  });

  describe('User Creation Tests', () => {
    beforeAll(async () => {
      const existingEmailVerification = await emailVerificationRepository.findOne({where: { email }});
      if(existingEmailVerification) {
        await emailVerificationRepository.delete(email);
      }
      const { emailCode, success } = await User.createEmailVerificationCode(email);
      if(emailCode === undefined || emailCode.code === undefined || success === undefined) {
        throw new Error('Email verification code not created');
      }
      const { success: verificationSuccess } = await User.verifyEmail(email, emailCode.code);
      if(!verificationSuccess) {
        throw new Error('Email verification failed');
      }
      const existingUser = await userRepository.findOne({where: { email }});
      if(existingUser) {
        await userRepository.delete(existingUser.id);
      }
    })
    afterAll(async () =>{
      await emailVerificationRepository.delete(email);
      await userRepository.delete({ email });
    })
    test('create user after email verification', async () => {
      const { newUser, success } = await User.createNewUser(username, email, password);
      if(newUser === undefined || success === false || success === undefined) {
        throw new Error("Failed to create new user");
      }
      expect(newUser).toBeDefined();
      expect(newUser).toHaveProperty('username', username);
      expect(newUser).toHaveProperty('email', email);
      expect(newUser).toHaveProperty('password', expect.any(String));
      expect(success).toBe(true);

      // cleanup
      await userRepository.delete(newUser.id);
    })
    test('fail to create user with existing email', async () => {
      const { newUser: firstNewUser, success: firstSuccess } = await User.createNewUser(username, email, password);
      if(firstNewUser === undefined || firstSuccess === false || firstSuccess === undefined) {
        throw new Error("Failed to create new user");
      }
      const { newUser, success } = await User.createNewUser(username, email, password);
      expect(firstNewUser).toBeDefined();
      expect(firstSuccess).toBe(true);
      expect(newUser).toBeUndefined();
      expect(success).toBe(false);

      const { newUser: secondNewUser, success: failed } = await User.createNewUser(username, email, password);
      expect(secondNewUser).toBeUndefined();
      expect(failed).toBe(false);

      // cleanup
      await userRepository.delete(firstNewUser.id);
    })
    test('fail to create user with invalid email', async () => {
      const invalidEmail = 'invalidemail';
      const { newUser, success } = await User.createNewUser(username, invalidEmail, password);
      expect(newUser).toBeUndefined();
      expect(success).toBe(false);
    })
    test('fail to create user with invalid password', async () => {
      const invalidPassword = '123';
      const { newUser, success } = await User.createNewUser(username, email, invalidPassword);
      expect(newUser).toBeUndefined();
      expect(success).toBe(false);
    })
    test('fail to create user with empty username', async () => {
      const emptyUsername = '';
      const { newUser, success } = await User.createNewUser(emptyUsername, email, password);
      expect(newUser).toBeUndefined();
      expect(success).toBe(false);
    })
    test('fail to create user with empty email', async () => {
      const emptyEmail = '';
      const { newUser, success } = await User.createNewUser(username, emptyEmail, password);
      expect(newUser).toBeUndefined();
      expect(success).toBe(false);
    })
    test('fail to create user with empty password', async () => {
      const emptyPassword = '';
      const { newUser, success } = await User.createNewUser(username, email, emptyPassword);
      expect(newUser).toBeUndefined();
      expect(success).toBe(false);
    })
    test(' fail to create user without verification', async () => {
      const unverifiedEmail = 'unverified@example.com';
      await User.createEmailVerificationCode(unverifiedEmail);
      // Do not verify the email to simulate unverified email scenario
      const { newUser, success } = await User.createNewUser(username, unverifiedEmail, password);
      expect(newUser).toBeUndefined();
      expect(success).toBe(false);
      // cleanup
      await emailVerificationRepository.delete(unverifiedEmail);
    })
  })
  describe('User Authentication Tests', () => {
    beforeAll(async () => {
      // Ensure email is verified before creating the user
      const existingEmailVerification = await emailVerificationRepository.findOne({where: { email }});
      if(!existingEmailVerification) {
        const { emailCode, success } = await User.createEmailVerificationCode(email);
        if(emailCode === undefined || emailCode.code === undefined || success === undefined) {
          throw new Error('Email verification code not created');
        }
        const { success: verificationSuccess } = await User.verifyEmail(email, emailCode.code);
        if(!verificationSuccess) {
          throw new Error('Email verification failed');
        }
      }
      // Ensure the user exists after email verification
      const existingUser = await userRepository.findOne({where: { email }});
      if(!existingUser) {
        const { newUser, success } = await User.createNewUser(username, email, password);
        if(newUser === undefined || success === false || success === undefined) {
          throw new Error("Failed to create new user for authentication tests");
        }
      }
    })
    afterAll(async () => {
      await emailVerificationRepository.delete(email);
      await userRepository.delete({ email });
    })
    test('authenticate user with correct credentials', async () => {
      const { jwt, success } = await User.createUserAuthentication(username, password);
      if(jwt === undefined || success === false || success === undefined) {
        throw new Error("Failed to authenticate user with correct credentials");
      }
      expect(jwt).toBeDefined();
      expect(success).toBe(true);


    })
    test('authenticate user with incorrect credentials', async () => {
      const { jwt: emptyString, success: notSuccessful } = await User.createUserAuthentication(username, 'wrongpassword');
      expect(emptyString).toBe("");
      expect(notSuccessful).toBe(false);
    })
  })
  describe('User update fields', () => {
    // Add tests for updating user fields here
    let jwt: string;
    beforeAll(async () => {
      // Ensure email is verified before updating fields
      const existingEmailVerification = await emailVerificationRepository.findOne({where: { email }});
      if(!existingEmailVerification) {
        const { emailCode, success } = await User.createEmailVerificationCode(email);
        if(emailCode === undefined || emailCode.code === undefined || success === undefined) {
          throw new Error('Email verification code not created');
        }
        const { success: verificationSuccess } = await User.verifyEmail(email, emailCode.code);
        if(!verificationSuccess) {
          throw new Error('Email verification failed');
        }
      }
      // Ensure the user exists before updating fields
      const existingUser = await userRepository.findOne({where: { email }});
      if(!existingUser) {
        const { newUser, success } = await User.createNewUser(username, email, password);
        if(newUser === undefined || success === false || success === undefined) {
          throw new Error("Failed to create new user for update tests");
        }
      }
      const { jwt: authJwt, success: authSuccess } = await User.createUserAuthentication(username, password);
      if(authJwt === undefined || authSuccess === false || authSuccess === undefined) {
        throw new Error("Failed to authenticate user for update tests");
      }
      jwt = authJwt;
    })
    afterAll(async () => {
      await emailVerificationRepository.delete(email);
      await userRepository.delete({ email });
    })
    test('update user username', async () => {
      const newUsername = 'updatedUsername';
      await User.updateUsername(newUsername, jwt);
      const updatedUser = await userRepository.findOne({where: { username: newUsername }})
      if(!updatedUser || !updatedUser.username) {
        throw new Error("Failed to find updated user");
      }
      expect(updatedUser.username).toBe(newUsername);
      await User.updateUsername(username, jwt);
    });
    test('update user invalid username', async () => {
      // Test updating username with only numbers and empty string
      const onlyNumbersUsername = '1234';
      const { success } = await User.updateUsername(onlyNumbersUsername, jwt);
      expect(success).toBe(false);

      // Test updating username with an empty string
      const emptyStringUsername = '';
      const { success: emptyStringSuccess } = await User.updateUsername(emptyStringUsername, jwt);
      expect(emptyStringSuccess).toBe(false);

      // Test updating username with a username that is too short
      const shortUsername = 'ab';
      const { success: shortUsernameSuccess } = await User.updateUsername(shortUsername, jwt);
      expect(shortUsernameSuccess).toBe(false);

      // Test updating username with the same username as the current one
      const sameUsername = 'testuser123';
      const { success: sameUsernameSuccess } = await User.updateUsername(sameUsername, jwt);
      expect(sameUsernameSuccess).toBe(false);
    });
    test('update user password', async () => {
      const newPassword = 'newPassword123!';
      const { success } = await User.updatePassword(newPassword, jwt);
      expect(success).toBe(true);

      // Revert to the original password
      const { success: revertSuccess } = await User.updatePassword(password, jwt);
      expect(revertSuccess).toBe(true);
    });
    test('update user invalid password', async () => {
      // Test updating password with a password that is too short
      const shortPassword = '123';
      const { success: shortPasswordSuccess } = await User.updatePassword(shortPassword, jwt);
      expect(shortPasswordSuccess).toBe(false);

      // Test updating password with a password that is too weak
      const weakPassword = 'password';
      const { success: weakPasswordSuccess } = await User.updatePassword(weakPassword, jwt);
      expect(weakPasswordSuccess).toBe(false);

      // Test updating password with the same password as the current one
      const samePassword = password;
      const { success: samePasswordSuccess } = await User.updatePassword(samePassword, jwt);
      expect(samePasswordSuccess).toBe(false);
    });
    test('update user email', async () => {
      const newEmail = 'newemail@example.com';
      // create a new email verification code for the new email
      const { emailCode, success: emailSuccess } = await User.createEmailVerificationCode(newEmail);
      if(!emailCode || !emailSuccess || !emailCode.code){
        throw new Error("Failed to create email verification code");
      }
      expect(emailCode).toBeDefined();
      expect(emailCode.code).toBeDefined();
      expect(emailSuccess).toBe(true);
      const { success: verifySuccess } = await User.verifyEmail(newEmail, emailCode.code);
      expect(verifySuccess).toBe(true);

      const { success: updateSuccess } = await User.updateEmail(newEmail, jwt);
      expect(updateSuccess).toBe(true);

      // Revert to the original email
      const { success: revertSuccess } = await User.updateEmail(email, jwt);
      expect(revertSuccess).toBe(true);

      // clean up the email verification code
      await emailVerificationRepository.delete({email: newEmail});
    });
    test('update user email with unverified email', async () => {
      const unverifiedEmail = 'unverified@example.com';

      const { success: updateSuccess } = await User.updateEmail(unverifiedEmail, jwt);
      expect(updateSuccess).toBe(false);

      // create a new email verification code for the unverified email
      const { emailCode, success: emailSuccess } = await User.createEmailVerificationCode(unverifiedEmail);
      if(!emailCode || !emailSuccess || !emailCode.code){
        throw new Error("Failed to create email verification code");
      }
      expect(emailCode).toBeDefined();
      expect(emailCode.code).toBeDefined();
      expect(emailSuccess).toBe(true);

      // Do not verify the email code to simulate an unverified email
      const { success: updateWithVerifiedFalse } = await User.updateEmail(unverifiedEmail, jwt);
      expect(updateWithVerifiedFalse).toBe(false);

      // clean up the email verification code
      await emailVerificationRepository.delete({email: unverifiedEmail});
    });
  })

});