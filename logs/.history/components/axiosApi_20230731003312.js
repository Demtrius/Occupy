import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage';

const axiosInstance = axios.create({
    baseURL : 'http://127.0.0.1:8000/auth/',
    timeout: 5000,

    headers: {
        'Authorization' : 'Bearer ' + localStorage.getItem('access_token'),
        'Content-Type': 'application/json',
        'accept': 'application/json'
    }
});

export default axiosInstance