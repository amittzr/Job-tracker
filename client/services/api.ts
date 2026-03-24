import axios from 'axios';
import { Platform } from 'react-native';

// חשוב: החלף את 192.168.1.XX בכתובת ה-IP האמיתית של המחשב שלך
// תוכל למצוא אותה על ידי פקודת 'ipconfig' בטרמינל

// 1. הגדרת ה-IP של המחשב שלך ברשת המקומית (תחליף ל-IP שלך מ-ipconfig)
const DEV_MACHINE_IP = '192.168.1.36'; 

// 2. בחירה אוטומטית של הכתובת לפי הפלטפורמה
const getBaseURL = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api';
  }
  
  // אם אתה באנדרואיד (אמולטור), הוא יודע לגשת למחשב דרך הכתובת המיוחדת הזו
  // אם אתה במכשיר פיזי, הוא ישתמש ב-IP של המחשב
  return Platform.OS === 'android' 
    ? `http://${DEV_MACHINE_IP}:3000/api` 
    : `http://${DEV_MACHINE_IP}:3000/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // הוספת Timeout כדי שלא ייתקע לנצח בטעינה
});

export const getJobs = async (userId: string) => {
  try {
    const response = await api.get(`/jobs/${userId}`);
    return response.data;
  } catch (error) {
    console.error("API Error (getJobs):", error);
    throw error;
  }
};

export default api;