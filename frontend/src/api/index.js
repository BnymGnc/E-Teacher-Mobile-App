import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'https://e-teacher.onrender.com/api/'
).replace(/\/+$/, '') + '/';

const REQUEST_TIMEOUT_MS = 90000;
const PUBLIC_AUTH_ENDPOINTS = [
  '/auth/login/',
  '/auth/register/',
  '/auth/refresh/',
];
let refreshRequest = null;

const isPublicAuthRequest = (url = '') =>
  PUBLIC_AUTH_ENDPOINTS.some((endpoint) => url.endsWith(endpoint));

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

const refreshAccessToken = async () => {
  const refresh = await AsyncStorage.getItem('refresh_token');
  if (!refresh) {
    throw new Error('Kayıtlı refresh token bulunamadı.');
  }

  const response = await axios.post(
    `${API_BASE_URL}auth/refresh/`,
    { refresh },
    {
      timeout: REQUEST_TIMEOUT_MS,
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const access = response.data?.access;
  if (!access) {
    throw new Error('Backend yeni access token döndürmedi.');
  }

  await AsyncStorage.setItem('access_token', access);
  if (response.data?.refresh) {
    await AsyncStorage.setItem('refresh_token', response.data.refresh);
  }

  return access;
};

api.interceptors.request.use(
  async (config) => {
    if (!isPublicAuthRequest(config.url)) {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isPublicAuthRequest(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshRequest) {
        refreshRequest = refreshAccessToken().finally(() => {
          refreshRequest = null;
        });
      }

      const access = await refreshRequest;
      originalRequest.headers ||= {};
      originalRequest.headers.Authorization = `Bearer ${access}`;
      return api(originalRequest);
    } catch (refreshError) {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
      return Promise.reject(refreshError);
    }
  }
);

export default api;
