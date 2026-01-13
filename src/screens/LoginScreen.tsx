import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppTextField from '../ui/AppTextField';
import { loginUser } from '../network/api';
import { storeAuth } from '../utils/storage';

export default function LoginScreen({ navigation, onLogin }: any) {
  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ password show/hide state
  const [showPass, setShowPass] = useState(false);

  const [errors, setErrors] = useState<{ phone?: string; pass?: string }>({});

  const cleanPhone = useMemo(() => phone.replace(/\s|-/g, '').trim(), [phone]);

  const validate = () => {
    const newErrors: { phone?: string; pass?: string } = {};

    const pkPhoneRegex = /^(03\d{9}|\+923\d{9})$/;

    if (!cleanPhone) newErrors.phone = 'Phone number is required';
    else if (!pkPhoneRegex.test(cleanPhone))
      newErrors.phone = 'Enter valid phone (03xx xxxxxxx)';

    if (!pass) newErrors.pass = 'Password is required';
    else if (pass.length < 6)
      newErrors.pass = 'Password must be at least 6 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const payload = { phone_number: cleanPhone, password: pass };
      const data = await loginUser(payload);
      console.log(data.result, 'hhhhhhhhhhh');

      if (data?.result !== 'success') {
        Alert.alert('Login failed', data?.message || 'Invalid credentials');
        return;
      }

      const token = data?.token || data?.access_token; // adjust to your API response
      const user = data?.user || data?.data || data?.result;

      if (!token) {
        Alert.alert('Error', 'Token not found in API response');
        return;
      }

      await storeAuth(token, user);
      onLogin?.(); // ✅ this will switch stack to MainTabs
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Something went wrong';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.logoWrap}>
          <Image
            source={require('../assets/images/daira_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.sub}>Welcome back! Please login to continue.</Text>

        <AppTextField
          label="Phone Number"
          placeholder="03xx xxxxxxx"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={t => {
            setPhone(t);
            if (errors.phone) setErrors(p => ({ ...p, phone: undefined }));
          }}
          icon={require('../assets/images/mobile.png')}
          error={errors.phone}
          autoCorrect={false}
        />

        <AppTextField
          label="Password"
          placeholder="Enter password"
          value={pass}
          onChangeText={t => {
            setPass(t);
            if (errors.pass) setErrors(p => ({ ...p, pass: undefined }));
          }}
          icon={require('../assets/images/padlock.png')}
          error={errors.pass}
          autoCorrect={false}
          secureTextEntry={!showPass} // ✅ toggle works now
          rightIcon={
            showPass
              ? require('../assets/images/show.png') // ✅ add this icon
              : require('../assets/images/hide.png') // ✅ add this icon
          }
          onRightIconPress={() => setShowPass(s => !s)} // ✅ toggle handler
        />

        <TouchableOpacity
          style={[styles.btn, loading ? { opacity: 0.7 } : null]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.btnTxt}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Signup')}
          style={{ marginTop: 14 }}
          disabled={loading}
        >
          <Text style={styles.link}>
            Don’t have an account? <Text style={styles.linkBold}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 26 },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },

  logo: {
    width: 140,
    height: 140,
  },

  title: { fontSize: 26, fontFamily: 'Poppins-Bold', color: '#111827' },
  sub: {
    marginTop: 6,
    marginBottom: 22,
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    lineHeight: 20,
  },
  btn: {
    marginTop: 30,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#1E63D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTxt: { color: '#FFFFFF', fontFamily: 'Poppins-SemiBold', fontSize: 15 },
  link: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
  },
  linkBold: { color: '#1E63D6', fontFamily: 'Poppins-SemiBold' },
});
