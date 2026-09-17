import { type MigrationInterface, type QueryRunner } from "typeorm";

export class EmailVerificationCodeInit1789686419013 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
         await queryRunner.query(`
            CREATE TABLE "email_verification_code" (
                "email" character varying(255) NOT NULL,
                "code" character varying(255) NOT NULL,
                "verified" boolean DEFAULT false,
                "createdAt" TIMESTAMP DEFAULT now(),
                CONSTRAINT "PK_email_verification_code_email" PRIMARY KEY ("email")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "email_verification_code"`);
    }

}
