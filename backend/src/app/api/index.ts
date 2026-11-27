import express from "express";
import bodyParser from "body-parser";
import { config } from "../../config.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { apiRateLimit } from "./middleware/rateLimit.js";
import { securityHeaders } from "./middleware/securityHeaders.js";
import { static as serveStatic } from "express";
import authRoutes from "./resources/auth/resource.js";
import userRoutes from "./resources/user/resource.js";
import path from "path";
import { CleanupService } from "../../domain/services/cleanupService.js";
import { checkDbConnection } from '../../infra/db/scripts/dbHealthCheck.js';
if(!config.api_port || !config.api_static_dir || !config.api_img_dir) {
    throw new Error("API_PORT or API_STATIC_DIR or API_IMG_DIR is not defined");
}

const app = express();
const __dirname = path.dirname(import.meta.dirname);

// First, so every response (API, static files, index.html) carries the security headers.
app.use(securityHeaders);

// CORS is here for convenience and does nothing in the default setup: in development Vite
// proxies /api, and in production Express serves the frontend, so the browser only ever makes
// same-origin requests. It takes effect if the frontend is hosted on a different origin (for
// example app.example.com calling api.example.com): add that origin to ALLOWED_ORIGINS rather
// than allowing every origin, since requests carry the refresh cookie (credentials: true).
// Non-browser clients (mobile apps, servers, Postman) ignore CORS entirely.
app.use(cors({
    origin(origin, callback) {
        if (!origin || config.allowed_origins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
}));

app.use("/api", apiRateLimit);

app.use(serveStatic(path.join(__dirname, config.api_static_dir)));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/test", async (req, res) => {
    console.log("Test API endpoint hit");
    console.log("test db connection")
    const dbConnected = await checkDbConnection();
    if (!dbConnected) {
        console.error("Database connection failed");
        return res.status(500).json({ message: "Database connection failed" });
    }
    res.status(200).json({ message: "API is working", dbConnected });
});

app.use("/api", authRoutes);
app.use("/api", userRoutes);

console.log(path.join(__dirname, config.api_static_dir, "index.html"))
app.get("/*path", (req, res) => {
    res.sendFile(path.join(__dirname, config.api_static_dir, "index.html"));
});

app.listen(config.api_port, () => {
    console.log(`Server is running on port ${config.api_port}`);
    CleanupService.start();
});