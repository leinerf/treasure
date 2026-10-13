import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity("password_reset_code")
export class PasswordResetCode {
    @PrimaryColumn({type: "varchar", length: 255, unique: true, nullable: false})
    code: string;

    @Column({type: "varchar", length: 255, unique: true, nullable: false})
    email: string;
}