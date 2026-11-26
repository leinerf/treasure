import UserController from "./controller.js";
import { auth } from "../../middleware/auth.js";
import { Router } from "express";
import { createRoutes } from "../util/index.js";
import { bufferUploadSingle, uploadSingleImage } from "../../middleware/fileUpload.js";


const router = Router();

const resource = {
    resourcePath: "/user",
    routes: [
        {
            path: "/",
            method: "get",
            controller: UserController.getUser,
            middlewares: [auth]
        },
        {
            path: "/all",
            method: "get",
            controller: UserController.getUsers,
            middlewares: [auth]
        },
        {
            path: "/username",
            method: "put",
            controller: UserController.updateUsername,
            middlewares: [auth]
        },
        {
            path: "/password",
            method: "put",
            controller: UserController.updatePassword,
            middlewares: [auth]
        },
        {
            path: "/email",
            method: "put",
            controller: UserController.updateEmail,
            middlewares: [auth]
        },
        {
            path: "/profile-picture",
            method: "post",
            controller: UserController.uploadProfilePicture,
            middlewares: [auth, uploadSingleImage("profile")]
        },
        {
            path: "/profile-picture",
            method: "get",
            controller: UserController.getProfilePicture,
            middlewares: [auth]
        },
        {
            path: "/:userId",
            method: "delete",
            controller: UserController.deleteUser,
            middlewares: [auth]
        },
        {
            path: "/search",
            method: "get",
            controller: UserController.searchUsers,
            middlewares: [auth]
        },
        {
            path: "/profile-picture/aws",
            method: "post",
            controller: UserController.uploadProfilePictureToAWS,
            middlewares: [auth, bufferUploadSingle("profile")]
        },
        {
            path: "/profile-picture/aws",
            method: "get",
            controller: UserController.getProfilePictureFromAWS,
            middlewares: [auth]
        }
    ]
};

createRoutes(router, resource);
export default router;