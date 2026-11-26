import AuthController from "./controller.js";
import { Router } from "express";
import { createRoutes } from "../util/index.js";

const router = Router();
const resource = {
    resourcePath: "/auth",
    routes: [
        {
            path: "/create-verification-email",
            method: "post",
            controller: AuthController.createVerificationEmail,
        },
        {
            path: "/register",
            method: "post",
            controller: AuthController.register,
        },
        {
            path: "/create-password-reset",
            method: "post",
            controller: AuthController.createPasswordReset,
        },
        {
            path: "/reset-password",
            method: "post",
            controller: AuthController.resetPassword,
        },
        {
            path: "/login",
            method: "post",
            controller: AuthController.login,
        },
        {
            path: "/logout",
            method: "post",
            controller: AuthController.logout,
        },
        {
            path: "/status",
            method: "get",
            controller: AuthController.status,
        },
        {
            path: "/refresh-token",
            method: "post",
            controller: AuthController.refreshToken,
        }
    ]
};

createRoutes(router, resource);
export default router;