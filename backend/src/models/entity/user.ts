import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export  class User {
    @PrimaryColumn({ type: "uuid" , unique: true , default: () => "uuid_generate_v4()" })
    id: string;

    @Column({type: "varchar", nullable: false, unique: true})
    username: string;

    @Column({type: "varchar", nullable: false, unique: true})
    email: string;

    @Column({type: "varchar", nullable: false})
    password: string;

    @Column({type: "json", nullable: true})
    address: Record<string, string>;
}