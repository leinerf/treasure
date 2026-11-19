import Bucket from "../../infra/aws/s3/bucket.js";
import crypto from "node:crypto";
export class FileService {
    public static async uploadToAWS(filename: string, body: any): Promise<string> {
        const key = Bucket.generateKey(filename);
        const md5 = crypto.createHash("md5").update(body).digest("hex");
        const response = await Bucket.putObject(key, body, "image/jpeg");
        // remove surrounding quotes from ETag
        const etagStr = String(response.ETag).replace(/^"+|"+$/g, "");
        const md5Str = String(md5);
        // Compare the MD5 hash of the uploaded file with the ETag returned by AWS S3
        if (etagStr !== md5Str) {
            // Throw an error if the MD5 checksum does not match the ETag from AWS S3
            // This ensures data integrity by verifying that the uploaded file's MD5 hash matches the ETag returned by S3.
            // If the checksums do not match, it indicates that the file may have been corrupted during upload.
            throw new Error("MD5 checksum mismatch");
        }

        return key;
    }

    public static async getPhotoUrlFromAWS(key: string): Promise<string> {
        return await Bucket.generatePresignedUrl(key, "get");
    }
}