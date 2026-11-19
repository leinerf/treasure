import multer from "multer";
import path from "path";
import {config } from "../../../config.js";
import User from "../../../domain/models/user.js";
import fs from "fs";

const appDir = path.dirname(path.dirname(import.meta.dirname))
const uploadDir = path.join(appDir, config.api_static_dir, config.api_img_dir);

const uploadToServerDest = (userId: string) => {
    const userUploadDir = path.join(uploadDir, userId);
        if(!fs.existsSync(userUploadDir)){
            fs.mkdirSync(userUploadDir, { recursive: true });
        }
    return userUploadDir;
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const jwt = req.cookies.jwt; // Access the JWT from cookies if needed for authentication or logging
        const userId = User.jwtDecrypt(jwt); // Example method to get user ID from JWT, replace with actual implementation if needed
        if(!userId){
            return cb(new Error("Invalid JWT"), "");
        }
        
        
        cb(null, uploadToServerDest(userId));
    },
    filename: (req, file, cb) => {
        const jwt = req.cookies.jwt; // Access the JWT from cookies if needed for authentication or logging
        const userId = User.jwtDecrypt(jwt); // Example method to get user ID from JWT, replace with actual implementation if needed
        if(!userId){
            return cb(new Error("Invalid JWT"), "");
        }
        
        cb(null, `${new Date().getTime()}-${file.originalname}`);
    }
});

const memoryStorage = multer.memoryStorage();

const upload = multer({ storage });
const bufferUpload = multer({ storage: memoryStorage });
export default upload;
export {  bufferUpload };