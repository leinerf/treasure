import { config } from "../../../config.js";
import { s3Client } from "./index.js";
import { 
    GetObjectCommand,
    PutObjectCommand,
    S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

class S3Bucket {
    public static generateKey(value: string) {
        const timestamp = Date.now();
        return `${timestamp}-${Math.random().toString(36).substring(2, 8)}-${value}`;
    }
    public static async getObject(key: string) {
        try {
            const command = new GetObjectCommand({
                Bucket: config.aws_s3_bucket_name,
                Key: key,
            });
            const response = await s3Client.send(command);
            return response.Body;
        } catch (error) {
            if (error instanceof S3ServiceException) {
                console.error(`Error getting object: ${error}`);
            }
            throw error;
        }
    }

    public static async putObject(key: string, body: any, ContentType: string) {
        try {
            const command = new PutObjectCommand({
                Bucket: config.aws_s3_bucket_name,
                Key: key,
                Body: body,
                ContentType: ContentType,
            });
            return await s3Client.send(command);
        } catch (error) {
            if (error instanceof S3ServiceException) {
                console.error(`Error putting object: ${error}`);
            }
            throw error;
        }
    }

    public static async generatePresignedUrl(key: string, commandType: "get" | "put", expiresIn: number = 3600) {
        try {
            let command;
            if (commandType === "get") {
                command = new GetObjectCommand({
                    Bucket: config.aws_s3_bucket_name,
                    Key: key,
                });
            } else if (commandType === "put") {
                command = new PutObjectCommand({
                    Bucket: config.aws_s3_bucket_name,
                    Key: key,
                    ContentType: "image/jpeg",
                });
            } else {
                throw new Error("Invalid command type for presigned URL generation");
            }
            
            const url = await getSignedUrl(s3Client, command, { expiresIn });
            return url;
        } catch (error) {
            if (error instanceof S3ServiceException) {
                console.error(`Error generating presigned URL: ${error}`);
            }
            throw error;
        }
    }
}

export default S3Bucket;

// const main = async () => {
//     const key = S3Bucket.generateKey(`${Math.random().toString(36).substring(2, 8)}.jpeg`);
//     const url = await S3Bucket.generatePresignedUrl(key, "put");
//     console.log({ url, key });
// };

// main();