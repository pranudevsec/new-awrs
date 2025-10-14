
export const API_CONFIG = {

  BASE_URL: 'http://192.168.1.6:8386',
  

  get baseURL() {
    return import.meta.env.VITE_APP_API_URL || this.BASE_URL;
  }
};

export const getBaseURL = () => API_CONFIG.baseURL;
