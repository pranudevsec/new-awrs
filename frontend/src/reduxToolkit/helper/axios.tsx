import axios from 'axios';

export const baseURL = import.meta.env.VITE_APP_API_URL;

const Axios = axios.create({
  baseURL: baseURL,
});

Axios.interceptors.request.use(
  function (config) {
    const token = localStorage.getItem('persist:admin');
    const parsedData = token ? JSON.parse(token) : null;
    const userToken = JSON.parse(parsedData?.admin ?? 'null')?.token ?? null;

    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }
    return config;
  },
  function (error) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
);

Axios.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data?.message === 'Invalid access token.'
    ) {
      localStorage.clear();
      window.location.href = '/authentication/sign-in';
    }

    if (!(error instanceof Error)) {
      const customError = new Error(error.message ?? 'Unknown error');
      (customError as any).originalError = error;
      return Promise.reject(customError);
    }

    return Promise.reject(error);
  }
);

export default Axios;
