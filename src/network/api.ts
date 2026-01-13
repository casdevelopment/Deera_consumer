import axios from 'axios';
import Server from '../constant/server';
import axiosInstance from '../utils/axiosInstance';
export const signupUser = async (payload: {
  phone_number: string;
  password: string;
  username: string;
}) => {
  try {
    const formData = new FormData();

    formData.append('phone_number', payload.phone_number);
    formData.append('password', payload.password);
    formData.append('username', payload.username);

    const response = await axios.post(`${Server}/customer-register`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Accept: '*/*',
      },
    });

    return response.data;
  } catch (error: any) {
    console.log('Signup API Error:', error?.response?.data || error.message);
    throw error;
  }
};
export const loginUser = async payload => {
  try {
    const response = await axios.post(
      `${Server}/customer-login`, // 👈 adjust endpoint
      payload,
      {
        headers: {
          Accept: '*/*',
          'Content-Type': 'application/json',
        },
      },
    );
    return response?.data;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
};

// network/api.ts
export const getDashboardStats = async (date: string) => {
  // date must be "YYYY-MM" e.g. "2025-11"
  const res = await axiosInstance.get('/customer-dashboard', {
    params: { date },
  });
  return res.data;
};

export const addPayment = async (payload: {
  amount: string;
  payment_method: string;
  payment_status: string;
  node?: string;
  payment_date: string; // yyyy-mm-dd
}) => {
  const form = new FormData();
  form.append('amount', payload.amount);
  form.append('payment_method', payload.payment_method);
  form.append('payment_status', payload.payment_status);
  form.append('payment_date', payload.payment_date);

  if (payload.node) form.append('node', payload.node);

  const res = await axiosInstance.post('/customer-payment-history', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return res.data;
};

export const getPaymentHistory = async () => {
  const res = await axiosInstance.get('/customer-payment-history');
  return res.data;
};

export const getMilkCollection = async (date: string) => {
  // date = "YYYY-MM" e.g. "2026-01"
  const res = await axiosInstance.get('/customer-milk-collection', {
    params: { date },
  });
  return res.data;
};
