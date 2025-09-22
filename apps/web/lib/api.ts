import type { Canvas, UserProfile, AccessType } from "@/types";

// Use an environment variable for your backend API URL for flexibility.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

/**
 * A reusable fetch wrapper for making authenticated API calls to your backend.
 * It automatically includes the user's auth token in the headers.
 */
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
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'An API error occurred.');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * A collection of functions for interacting with the backend API.
 */
export const apiClient = {
  getCanvases: (token: string): Promise<Canvas[]> => {
    return apiFetch('/canvases', token);
  },

  getCanvasById: (canvasId: string, token: string): Promise<Canvas> => {
    return apiFetch(`/canvases/${canvasId}`, token);
  },

  createCanvas: (data: { title?: string }, token: string): Promise<Canvas> => {
    return apiFetch('/canvases', token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  deleteCanvas: (canvasId: string, token: string): Promise<void> => {
    return apiFetch(`/canvases/${canvasId}`, token, {
      method: 'DELETE',
    });
  },
  updateCanvasTitle: (canvasId: string, title: string, token: string): Promise<Canvas> => {
    return apiFetch(`/canvases/${canvasId}/title`, token, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
    });
  },

  // --- NEW: Function to update the main content of a canvas ---
  updateCanvasContent: (canvasId: string, content: string, token: string): Promise<Canvas> => {
    return apiFetch(`/canvases/${canvasId}/content`, token, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  },
  
  // --- CORRECTED: Function for adding a collaborator ---
  addCollaborator: (canvasId: string, collaboratorId: string, accessType: AccessType, token: string): Promise<Canvas> => {
    return apiFetch(`/canvases/${canvasId}/collaborators`, token, {
      method: 'POST',
      body: JSON.stringify({ collaboratorId, accessType }),
    });
  },

  // --- CORRECTED: Function for removing a collaborator ---
  removeCollaborator: (canvasId: string, collaboratorId: string, token: string): Promise<Canvas> => {
    return apiFetch(`/canvases/${canvasId}/collaborators/${collaboratorId}`, token, {
      method: 'DELETE',
    });
  },

  getUserProfile: (token: string): Promise<UserProfile> => {
    return apiFetch('/user/profile', token);
  },
};

