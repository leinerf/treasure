import User from '../models/user.js';
import "reflect-metadata";
import { describe, test, expect, beforeAll } from 'vitest';
import { User as UserEntity } from "../entity/user.js";
import {DataSource, Repository } from "typeorm";
import { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE } from '../config.js';
import  dataSource from '../dataSource.js';
import userRepository from '../repository/userRepository.js';
import { randomUUID } from 'crypto';

describe('User Model', () => {
  beforeAll(async () => {
    try {
      await dataSource.initialize();
    } catch (error) {
      console.error("Error initializing data source:", error);
      throw error;
    }
  });
  test('create new user', async () => {
    try {
      const {newUser, success} = await User.createNewUser('testuser', 'test@example.com', 'password!123');
      console.log(newUser)
      expect(newUser).toBeDefined();
      expect(newUser).toEqual(expect.any(Object));
      expect(newUser).toHaveProperty('id');
      expect(newUser).toHaveProperty('username', 'testuser');
      expect(newUser).toHaveProperty('email', 'test@example.com');
      expect(newUser).toHaveProperty('emailVerified', false);
      expect(newUser).toHaveProperty('password', expect.not.stringContaining('password!123'));
      expect(newUser).toHaveProperty('password', expect.any(String));
      expect(success).toBe(true);
      if(newUser && newUser.id){
        console.log("Deleting user with ID:", newUser.id);
        await userRepository.delete(newUser.id);
      }
    } catch (error) {
        console.error("Error creating new user:", error);
        throw error;
    } 
  });
  test('create user auth', async () => {
    try {
      await User.createNewUser('testuser', 'test@example.com', 'password!123');
      const auth = await User.createUserAuthentication('testuser', 'password!123')
      expect(auth).toBeDefined();
      expect(auth).toHaveProperty('jwt');
      expect(auth).toHaveProperty('success', true);
      await userRepository.delete({username: 'testuser', email: 'test@example.com'});
    } catch (error) {
        console.error("Error creating user auth:", error);
        throw error;
    } 
  });
  test('delete user with auth', async () => {
    try {
      const {newUser, success} = await User.createNewUser('testuser', 'test@example.com', 'password!123');
      expect(newUser).toBeDefined();
      expect(success).toBe(true);
      if(!newUser || !newUser.id){
        throw new Error("User creation failed, cannot delete");
      }
      const auth = await User.createUserAuthentication('testuser', 'password!123');
      console.log(auth)
      expect(auth).toBeDefined();
      expect(auth).toHaveProperty('jwt');
      expect(auth).toHaveProperty('success', true);

      // delete user with authentication logic here
      await User.deleteUser(auth.jwt);
    } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    } 
  });
});