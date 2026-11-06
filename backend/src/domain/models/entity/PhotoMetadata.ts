export type Trait = "basic" | "profile";

export interface PhotoMetadata {
    id: string;
    filename: string;
    path: string;
    size: number;
    trait: Trait;
    userId: string;
}

export const Trait = {
    BASIC: "basic" as Trait,
    PROFILE: "profile" as Trait
};