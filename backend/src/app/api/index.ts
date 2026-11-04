import express from "express";
import bodyParser from "body-parser";
import { config } from "../../config.js";
import cookieParser from "cookie-parser";
import { static as serveStatic } from "express";
import authRoutes from "./resources/auth/resource.js";
import userRoutes from "./resources/user/resource.js";
import path from "path";

if(!config.api_port || !config.api_static_dir) {
    throw new Error("API_PORT or API_STATIC_DIR is not defined");
}

const app = express();
const __dirname = path.dirname(import.meta.dirname);

app.use(serveStatic(path.join(__dirname, config.api_static_dir)));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/test", (req, res) => {
    console.log("Test API endpoint hit");
    console.log(req.cookies.jwt)
    res.status(200).json({ message: "API is working" });
});
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.listen(config.api_port, () => {
    console.log(`Server is running on port ${config.api_port}`);
});