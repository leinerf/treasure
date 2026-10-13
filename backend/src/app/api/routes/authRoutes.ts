import { Router } from "express";
import AuthController from "../controller/authController.js";

const router = Router();
const { createVerificationEmail, verifyEmail, register, login, logout, createPasswordReset, resetPassword } = AuthController;

router.post("/create-verification-email", createVerificationEmail);
router.post("/verify-email", verifyEmail);
router.post("/register", register);
router.post("/create-password-reset", createPasswordReset);
router.post("/reset-password/:id", resetPassword);
router.post("/login", login);
router.post("/logout", logout);

export default router;