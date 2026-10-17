import { type MigrationInterface, type QueryRunner } from "typeorm";

export class UserInitial1789164174179 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
            await queryRunner.query(`
                CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
                CREATE TABLE "user" (
                    "id" UUID primary key DEFAULT uuid_generate_v4(),
                    "username" VARCHAR(255) NOT NULL,
                    "email" VARCHAR(255) NOT NULL,
                    "password" VARCHAR(255) NOT NULL
                )
            `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
            await queryRunner.query(`
                DROP TABLE "user";
                DROP EXTENSION IF EXISTS "uuid-ossp";
            `);
    }
}
