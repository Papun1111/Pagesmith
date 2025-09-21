import type { Request, Response, NextFunction } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/apiError.js';

// Ensure the Gemini API key is available on server startup.
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined in the environment variables.");
}

// Initialize the Gemini client.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Handles requests to generate content using the Gemini API.
 * This function is designed to be called after an authentication middleware has run.
 */
export const handleGenerateContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Validate the incoming request body.
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new ApiError(400, 'A valid string "prompt" is required.');
    }

    // 2. Call the Gemini API to generate content.
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 3. Send the successful response back to the client.
    res.status(200).json({ response: text });

  } catch (error: any) {
    // 4. Handle any errors that occur during the process.
    logger.error('Gemini API request failed:', error.message || error);
    
    // Pass a standardized error to the global error handler.
    // This prevents leaking sensitive API error details to the client.
    next(new ApiError(500, 'Failed to generate content from AI service.'));
  }
};
