import axios from 'axios';
import { Platform } from 'react-native';
import { auth } from '../config/firebase';

// Configuration for local development machine IP
const DEV_MACHINE_IP = process.env.EXPO_PUBLIC_DEV_MACHINE_IP || '192.168.1.36';

// Determine the API base URL based on platform
const getBaseURL = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api';
  }
  // Mobile (Expo Go / physical device) uses machine IP
  return `http://${DEV_MACHINE_IP}:3000/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 35000,
});

// Interceptor: automatically attach Firebase token to every request
api.interceptors.request.use(async (config) => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  return config;
});

// Fetch all jobs for a specific user
export const getJobs = async (userId: string) => {
  try {
    const response = await api.get(`/jobs/${userId}`);
    return response.data;
  } catch (error) {
    console.error("API Error (getJobs):", error);
    throw error;
  }
};

// Auto-add a job using AI analysis of URL
export const autoAddJob = async (url: string, userId: string) => {
  try {
    console.log(`Sending auto-add request: url=${url}, userId=${userId}`);
    const response = await api.post('/jobs/auto-add', { url, userId });
    console.log("Auto-add response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("API autoAddJob error:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
};

export default api;
