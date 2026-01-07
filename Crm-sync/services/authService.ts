import { API_URL } from "../constants";

export interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  plan?: string;
  tier?: string;
  subscriptionTier?: string; // Backend sends this field
  subscriptionStatus?: string;
  firstName?: string;
  lastName?: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Login failed');
    }
    
    return res.json();
  },

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Registration failed');
    }

    return res.json();
  },

  async getProfile(token: string): Promise<User> {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('401 Unauthorized - Token invalid or expired');
        }
        throw new Error(`Failed to fetch profile: ${res.status}`);
      }

      const data = await res.json();
      return data.user || data;
    } catch (error: any) {
      // Distinguish between network errors and auth errors
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        throw error; // Re-throw auth errors
      }
      // For network errors, provide more context
      console.error('Network error fetching profile:', error);
      throw new Error(`Network error: ${error.message}`);
    }
  }
};