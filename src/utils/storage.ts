import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeAuth = async (token: string, user: any) => {
  await AsyncStorage.setItem('token', token);
  await AsyncStorage.setItem('user', JSON.stringify(user ?? {}));
};

export const getToken = async () => AsyncStorage.getItem('token');

export const getUser = async () => {
  const user = await AsyncStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const logout = async () => {
  await AsyncStorage.multiRemove(['token', 'user']);
};
