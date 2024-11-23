import axios from 'axios';


const API  = axios.create({
baseURL: "http://127.0.0.1:8000/",
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