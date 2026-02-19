import { GoogleGenerativeAI } from "@google/generative-ai";
import logger from "../utils/logger.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export const analyzePriorityWithAI = async (title: string, description: string): Promise<"low" | "medium" | "high" | "critical"> => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `Analyze the following customer complaint and rate its urgency/priority.
        You must respond with EXACTLY ONE WORD from this list: low, medium, high, critical.
        Do not include any other text, punctuation, formatting, or explanation.

        Title: ${title}
        Description: ${description}`;

        const result = await model.generateContent(prompt);
        const priority = result.response.text().trim().toLowerCase();

        if (["low", "medium", "high", "critical"].includes(priority)) {
            return priority as "low" | "medium" | "high" | "critical";
        } else {
            logger.warn("Unexpected response from Gemini API for priority analysis", { response: result.response.text() });
            return "medium"; // Default to medium if response is unexpected
        }
    }
    catch (error) {
        logger.error("Error analyzing priority with Gemini API", { error });
        return "medium"; // Default to medium if there's an error
    }
}