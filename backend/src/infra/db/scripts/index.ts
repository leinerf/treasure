import { faker } from '@faker-js/faker';
import { like } from 'drizzle-orm'
import { config } from '../../../config.js'
import bcrypt from 'bcrypt';
import { UserRepository } from '../repository/UserRepository.js'
import { Role } from '../../../domain/models/entity/User.js'
import { db, endDbConnection } from '../index.js'
import { User } from '../schema/Users.js';

const hash = (token: string) => {
    try {
        if(!config.salt_rounds){
            return null;
            }
            const salt = bcrypt.genSaltSync(Number(config.salt_rounds));
            return bcrypt.hashSync(token, salt);
    } catch (error) {
        console.error(error);
        return null;
    }
}

const generateFakeData = (num: number) => {
  return {
    username: faker.internet.username() + '-test-' + num,
    email: faker.internet.email(),
    role: faker.helpers.arrayElement([Role.User])
  };
};

const generateFakeUser = async (num: number) => {
    const { username, email, role } = generateFakeData(num);
    const hashedPassword = hash(faker.internet.password());
    if(!hashedPassword){
        return null;
    }

    const user = await UserRepository.save({
        username,
        email,
        role,
        password: hashedPassword
    });
    return user;
};

const createFakeUser = async (num: number) => {
    const user = await generateFakeUser(num);
    if(user){
        console.log('Fake user created:', user);
    } else {
        console.log('Failed to create fake user');
    }
};

const createMultipleFakeUsers = async (count: number) => {
    for(let i = 0; i < count; i++){
        await createFakeUser(i);
    }
};

const deleteAllFakeUsers = async () => {
    await db.delete(User).where(like(User.username, '%-test-%'));
};

const main = async () => {
    await deleteAllFakeUsers();
    await createMultipleFakeUsers(100);
    endDbConnection();
};

main();