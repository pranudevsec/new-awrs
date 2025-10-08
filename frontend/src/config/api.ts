// API Configuration
// This file can be used to set the API URL if environment variables are not available

export const API_CONFIG = {
  // Default API URL - updated to use correct backend IP and port
  BASE_URL: 'http://192.168.1.6:8386',
  
  // You can also use environment variables if available
  get baseURL() {
    return import.meta.env.VITE_APP_API_URL || this.BASE_URL;
  }
};

// Export the base URL for use in other parts of the application
export const getBaseURL = () => API_CONFIG.baseURL;
