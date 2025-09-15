import type { Request, Response, NextFunction } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/apiError.js';

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined in the environment variables.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Handles requests to generate content using the Gemini API.
 */
export const handleGenerateContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      throw new ApiError(400, 'A valid string "prompt" is required.');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ response: text });
  } catch (error) {
    logger.error('Gemini API request failed:', error);
    // Pass a generic error to the client to avoid exposing internal details.
    next(new ApiError(500, 'Failed to generate content from AI service.'));
  }
};

