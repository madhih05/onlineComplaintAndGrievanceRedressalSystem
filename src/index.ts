import "dotenv/config";
import mongoose from "mongoose";
import express from "express";
import authRoutes from "./routes/auth.routes.js";
import complaintRoutes from "./routes/complaints.js";
import logger from "./utils/logger.js";
import { requestLogger } from "./middleware/request-logger.middleware.js";

const app = express();
app.use(express.json());
app.use(requestLogger);

const mongodbUri = process.env.MONGODB_URI as string;

mongoose.connect(mongodbUri)
    .then(() => {
        logger.info("Connected to MongoDB");
    })
    .catch((error) => {
        logger.error("Error connecting to MongoDB:", error);
    });

app.use('/api/auth', authRoutes);
app.use('/complaints', complaintRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});
