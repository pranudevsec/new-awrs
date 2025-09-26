// API Configuration
// This file can be used to set the API URL if environment variables are not available

export const API_CONFIG = {
  // Default API URL - update this if your backend is running on a different port
  BASE_URL: 'http://localhost:3001',
  
  // You can also use environment variables if available
  get baseURL() {
    return import.meta.env.VITE_APP_API_URL || this.BASE_URL;
  }
};

// Export the base URL for use in other parts of the application
export const getBaseURL = () => API_CONFIG.baseURL;
