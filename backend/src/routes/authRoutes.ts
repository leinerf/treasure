import { Router } from "express";
import UserController from "../controller/authController.js";

const router = Router();
const { createVerificationEmail, verifyEmail, register, login, logout } = UserController;

router.post("/create-verification-email", createVerificationEmail);
router.post("/verify-email", verifyEmail);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

export default router;