import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage';

const axiosInstance = axios.create({
    baseURL : process.env.EXPO_PUBLIC_BACKEND_URL + '/auth/',
    timeout: 5000,

    headers: {
        'Authorization' : 'Bearer ' + AsyncStorage.getItem('access_token'),
        'Content-Type': 'application/json',
        'accept': 'application/json'
    }
});

export default axiosInstance