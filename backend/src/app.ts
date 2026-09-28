import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

import dataSource from "./infra/dataSource.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { auth as authMiddleware } from "./middleware/auth.js";

try {
    await dataSource.initialize();
    console.log("Data source has been initialized!");
} catch (err) {
    console.error("Error during data source initialization:", err);
}

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const PORT = process.env.PORT || 3000;

app.get("/api/test", (req, res) => {
    console.log("Test API endpoint hit");
    res.send("Welcome to the API");
});
app.use("/api/auth", authRoutes);
app.use("/api/user", authMiddleware, userRoutes);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});