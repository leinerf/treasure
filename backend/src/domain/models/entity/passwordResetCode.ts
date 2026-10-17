import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity("password_reset_code")
export class PasswordResetCode {
    @PrimaryColumn({type: "varchar", length: 255, unique: true, nullable: false})
    code: string;

    @Column({type: "varchar", length: 255, unique: true, nullable: false})
    email: string;

    @Column({type: "timestamp", nullable: false, default: new Date(Date.now() + (24 * 60 * 60 * 1000))})
    expirationDate: Date;
}