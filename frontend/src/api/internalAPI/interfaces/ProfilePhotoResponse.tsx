import { type SimpleResponse } from "./SimpleResponse";

interface PhotoMetadata {
    filename: string;
    size: number;
    path: string;
    blob: Blob;
}
export interface ProfilePhotoResponse extends SimpleResponse {
    photoMetadata?: PhotoMetadata;
}