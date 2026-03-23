import axios from 'axios';

// חשוב: החלף את 192.168.1.XX בכתובת ה-IP האמיתית של המחשב שלך
// תוכל למצוא אותה על ידי פקודת 'ipconfig' בטרמינל
const API_URL = 'http://localhost:3000/api'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getJobs = async (userId: string) => {
  const response = await api.get(`/jobs/${userId}`);
  return response.data;
};

export default api;