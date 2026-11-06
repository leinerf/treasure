import UserController from "./controller.js";
import { auth } from "../../middleware/auth.js";
import { Router } from "express";
import { createRoutes } from "../util/index.js";
import upload from "../../middleware/fileUpload.js";

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
            middlewares: [auth, upload.single("profile")]
        },
        {
            path: "/profile-picture",
            method: "get",
            controller: UserController.getProfilePicture,
            middlewares: [auth]
        }
    ]
};

createRoutes(router, resource);
export default router;