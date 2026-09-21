import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity({ name: "email_verification_code" })
export class EmailVerificationCode {
    @PrimaryColumn({type: "varchar", length: 255, unique: true })
    email: string;

    // <TODO: figure out why not taking default value>
    @Column({type: "varchar", length: 255, unique: true, default: () => String(Math.floor(100000 + Math.random() * 900000))})
    code: string;

    @Column({type: "boolean", default: false})
    verified: boolean;

    @Column({ type: "timestamp", default: () => new Date() })
    createdAt: Date;

    // The expiration column has been commented out for now. update verification code
    // @Column({ type: "timestamp", default: () => new Date(Date.now() + (24 * 60 * 60 * 1000)) })
    // expireAt: Date;
}