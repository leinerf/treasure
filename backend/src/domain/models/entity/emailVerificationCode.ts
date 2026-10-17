import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity({ name: "email_verification_code" })
export class EmailVerificationCode {
    @PrimaryColumn({type: "varchar", length: 255, unique: true })
    email: string;

    // <TODO: figure out why not taking default value>
    @Column({type: "varchar", length: 255, unique: true, nullable: false })
    code: string;

    @Column({ type: "timestamp", default: () => new Date(Date.now() + (24 * 60 * 60 * 1000)) })
    expireAt: Date;
}