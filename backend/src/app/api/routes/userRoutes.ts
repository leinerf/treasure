import { Router } from "express";
import UserController from "../controller/userController.js";

const router = Router();

router.get("/", UserController.getUser);
router.put("/username", UserController.updateUsername);
router.put("/password", UserController.updatePassword);
router.put("/email", UserController.updateEmail);

export default router;