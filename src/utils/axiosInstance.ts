// apis/axiosInstance.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import Server from '../constant/server';

const axiosInstance = axios.create({
  baseURL: Server,
  headers: {
    Accept: '*/*',
    'Content-Type': 'application/json',
  },
});

// 🔹 Flag to prevent multiple alerts
let isSessionExpired = false;

// 🔹 Request Interceptor → Attach Access Token
axiosInstance.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

// 🔹 Response Interceptor → Handle 401
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && !isSessionExpired) {
      isSessionExpired = true; // block duplicate alerts

      await AsyncStorage.multiRemove(['token', 'token']);

      Alert.alert(
        'Session Expired',
        'Your session has expired. Please log in again.',
        [
          {
            text: 'OK',
            onPress: () => {
              isSessionExpired = false; // reset after user sees alert
              //   store.dispatch(setAuthenticated({ isAuthenticated: false }));

              // 3. Dispatch Redux logout action
              //   store.dispatch(logout());
              //   store.dispatch(resetAuth());
              // navigationRef.current?.reset({
              //   index: 0,
              //   routes: [{ name: 'Login' }],
              // });
            },
          },
        ],
      );
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
