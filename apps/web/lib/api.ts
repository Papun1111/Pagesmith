import type { Canvas, UserProfile } from "@/types";

// Use an environment variable for your backend API URL for flexibility.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

async function apiFetch(endpoint: string, token: string, options: RequestInit = {}) {
  if (!token) {
    throw new Error("User is not authenticated. Cannot make API calls.");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    // Try to parse the error message from the backend, otherwise use the status text.
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'An API error occurred.');
  }

  // If the response has no content (e.g., for a 204 No Content response), return null.
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * A collection of functions for interacting with the backend API.
 * This object is exported and used throughout the frontend application.
 */
export const apiClient = {
  /**
   * Fetches all canvases for the currently authenticated user.
   * @param token - The user's auth token.
   */
  getCanvases: (token: string): Promise<Canvas[]> => {
    return apiFetch('/canvases', token);
  },

  /**
   * Fetches a single canvas by its unique ID.
   * @param canvasId - The ID of the canvas to fetch.
   * @param token - The user's auth token.
   */
  getCanvasById: (canvasId: string, token: string): Promise<Canvas> => {
    return apiFetch(`/canvases/${canvasId}`, token);
  },

  /**
   * Creates a new canvas for the authenticated user.
   * @param data - The initial data for the canvas (e.g., { title: 'My New Canvas' }).
   * @param token - The user's auth token.
   */
  createCanvas: (data: { title?: string }, token: string): Promise<Canvas> => {
    return apiFetch('/canvases', token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Updates the title of an existing canvas.
   * @param canvasId - The ID of the canvas to update.
   * @param title - The new title for the canvas.
   * @param token - The user's auth token.
   */
  updateCanvasTitle: (canvasId: string, title: string, token: string): Promise<Canvas> => {
    return apiFetch(`/canvases/${canvasId}/title`, token, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
    });
  },

  /**
   * Fetches the profile of the currently authenticated user from our database.
   * @param token - The user's auth token.
   */
  getUserProfile: (token: string): Promise<UserProfile> => {
    // This will call a GET /api/user/profile endpoint on your backend.
    return apiFetch('/user/profile', token);
  },
};

