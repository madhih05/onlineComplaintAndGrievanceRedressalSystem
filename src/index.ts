import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";

const app = express();
app.use(express.json());

dotenv.config();

const mongodbUri = process.env.MONGODB_URI as string;

mongoose.connect(mongodbUri)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((error) => {
        console.error("Error connecting to MongoDB:", error);
    });

app.use('/api/auth', authRoutes);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});