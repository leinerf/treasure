import express from "express";
import bodyParser from "body-parser";
import authRoutes from "./routes/authRoutes.js";
const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});