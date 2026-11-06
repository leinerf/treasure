import { type PhotoMetadata as PhotoMetadataEntity } from "../../../domain/models/entity/PhotoMetadata.js";
import { type Trait as TraitType, Trait } from "../../../domain/models/entity/PhotoMetadata.js";
import { PhotoMetadataRepository as AbstractPhotoMetadataRepository } from "../../../domain/models/repository/PhotoMetadataRepository.js";
import { PhotoMetadata } from "../schema/PhotoMetadata.js";
import { and, eq, not, lt, lte, gt, gte } from "drizzle-orm";
import { db } from "../index.js";
import  { type Comparison as ComparisonType, Comparison } from "./Comparison.js";

export class PhotoMetadataRepository extends AbstractPhotoMetadataRepository {
    public static async findMany(args: { [key in keyof PhotoMetadataEntity]?: [string, ComparisonType] }): Promise<PhotoMetadataEntity[]> {
        const keys = Object.keys(args) as (keyof PhotoMetadataEntity)[];
        const conditions = keys.map(key => {
            const [value, comparison] = args[key]!;
            return PhotoMetadataRepository.buildCondition(key as keyof PhotoMetadataEntity, value, comparison);
        });
        return await db.select(PhotoMetadataRepository.buildReturning()).from(PhotoMetadata).where(
            and(...conditions.filter(condition => condition !== null))
        );
        
    }
    public static override async findById(id: string): Promise<PhotoMetadataEntity | null> {
        const result = await PhotoMetadataRepository.findMany({ id: [id, Comparison.equal] });
        return result[0] ?? null;
    }

    public static async findOne(args: { [key in keyof PhotoMetadataEntity]?: [string, ComparisonType] }): Promise<PhotoMetadataEntity | null> {
        const result = await PhotoMetadataRepository.findMany(args);
        return result[0] ?? null;
    }

    public static override async findByUserId(userId: string): Promise<PhotoMetadataEntity[]> {
        return await PhotoMetadataRepository.findMany({ userId: [userId, Comparison.equal] });
    }

    public static override async findByTrait(userId: string, trait: TraitType): Promise<PhotoMetadataEntity[]> {
        return await PhotoMetadataRepository.findMany({ userId: [userId, Comparison.equal], trait: [trait, Comparison.equal] });
    }

    public static async findProfilePhoto(userId: string): Promise<PhotoMetadataEntity | null> {
        return await PhotoMetadataRepository.findOne({ userId: [userId, Comparison.equal], trait: [Trait.PROFILE, Comparison.equal] });
    }

    public static override async save(photoMetadata: Omit<PhotoMetadataEntity, "id">): Promise<PhotoMetadataEntity | null> {
        const result = await db.insert(PhotoMetadata).values({
            filename: photoMetadata.filename,
            size: photoMetadata.size,
            path: photoMetadata.path,
            trait: photoMetadata.trait,
            userId: photoMetadata.userId
        }).returning(PhotoMetadataRepository.buildReturning());
        return result[0] || null;
    }

    public static override async updateById(id: string, photoMetadata: Partial<Omit<PhotoMetadataEntity, "id">>): Promise<PhotoMetadataEntity | null> {
        const result = await db.update(PhotoMetadata).set(photoMetadata).where(eq(PhotoMetadata.id, id)).returning(PhotoMetadataRepository.buildReturning());
        return result[0] || null;
    }

    public static override async updateProfilePhoto(photoMetadata: Omit<PhotoMetadataEntity, "id">): Promise<PhotoMetadataEntity | null> {
        const result = await db.transaction(async (tx) => {
            const existingProfilePhoto = await PhotoMetadataRepository.findProfilePhoto(photoMetadata.userId);
            if(existingProfilePhoto){
                await PhotoMetadataRepository.deleteById(existingProfilePhoto.id);
            }
            return await PhotoMetadataRepository.save(photoMetadata);
        });
        return result;
    }

    public static override async deleteById(id: string): Promise<void> {
        await db.delete(PhotoMetadata).where(eq(PhotoMetadata.id, id));
    }

    public static override async deleteAll(): Promise<void> {
        await db.delete(PhotoMetadata);
    }

    private static buildReturning() {
        return {
            id: PhotoMetadata.id,
            filename: PhotoMetadata.filename,
            size: PhotoMetadata.size,
            path: PhotoMetadata.path,
            trait: PhotoMetadata.trait,
            userId: PhotoMetadata.userId
        };
    }

    private static buildCondition(key: keyof PhotoMetadataEntity, value: string, comparison: ComparisonType) {
        switch (comparison) {
            case Comparison.equal:
                return eq(PhotoMetadata[key], value);
            case Comparison.notEqual:
                return not(eq(PhotoMetadata[key], value));
            case Comparison.lessThan:
                return lt(PhotoMetadata[key], value);
            case Comparison.lessThanOrEqual:
                return lte(PhotoMetadata[key], value);
            case Comparison.greaterThan:
                return gt(PhotoMetadata[key], value);
            case Comparison.greaterThanOrEqual:
                return gte(PhotoMetadata[key], value);
            default:
                throw new Error(`Unsupported comparison: ${comparison}`);
        }
    }
}
