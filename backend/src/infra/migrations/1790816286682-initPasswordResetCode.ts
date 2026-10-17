import { type MigrationInterface, type QueryRunner } from "typeorm";

export class InitPasswordResetCode1790816286682 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "password_reset_code" (
            "code" VARCHAR(255) NOT NULL PRIMARY KEY,
            "email" VARCHAR(255) NOT NULL,
            "expirationDate" TIMESTAMP NOT NULL
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "password_reset_code"
        `);
    }

}
