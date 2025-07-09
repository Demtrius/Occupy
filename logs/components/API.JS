import axios from 'axios';


const API  = axios.create({
baseURL: process.env.EXPO_PUBLIC_BACKEND_URL,
headers: {
    'Content-Type': 'application/json',
  },

});
API.interceptors.request.use(async config => {
    const token = await AsyncStorage.getItem('token'); // Adjust according to your auth method
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

export default API