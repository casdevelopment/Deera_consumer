import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import AppTextField from '../ui/AppTextField';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signupUser } from '../network/api';

export default function SignupScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    pass?: string;
    confirmPass?: string;
  }>({});

  // ✅ normalize phone like: remove spaces, dashes etc.
  const cleanPhone = useMemo(() => phone.replace(/\s|-/g, '').trim(), [phone]);

  const validate = () => {
    const newErrors: any = {};

    if (!name.trim()) newErrors.name = 'Full name is required';

    const pkPhoneRegex = /^(03\d{9}|\+923\d{9})$/;
    if (!cleanPhone) newErrors.phone = 'Phone number is required';
    else if (!pkPhoneRegex.test(cleanPhone))
      newErrors.phone = 'Enter valid phone (03xx xxxxxxx)';

    if (!pass) newErrors.pass = 'Password is required';
    else if (pass.length < 6)
      newErrors.pass = 'Password must be at least 6 characters';

    if (!confirmPass) newErrors.confirmPass = 'Confirm password is required';
    else if (confirmPass !== pass)
      newErrors.confirmPass = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    try {
      const payload = {
        username: name,
        phone_number: cleanPhone,
        password: pass,
      };

      const data = await signupUser(payload);

      console.log('Signup response:', data);

      if (data?.result !== 'success') {
        Alert.alert('Signup Failed', data?.message || 'Unable to register');
        return;
      }

      Alert.alert('Success', 'Account created successfully');
      navigation.goBack();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Something went wrong';
      Alert.alert('Error', msg);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoWrap}>
          <Image
            source={require('../assets/images/daira_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Sign Up</Text>
        <Text style={styles.sub}>
          Create your account to start using the app.
        </Text>

        <AppTextField
          label="Full Name"
          placeholder="Muhammad Ahmed"
          value={name}
          onChangeText={t => {
            setName(t);
            if (errors.name) setErrors(p => ({ ...p, name: undefined }));
          }}
          icon={require('../assets/images/user.png')} // change if you want
          error={errors.name}
          autoCorrect={false}
        />

        <AppTextField
          label="Phone Number"
          placeholder="03xx xxxxxxx"
          value={phone}
          onChangeText={t => {
            setPhone(t);
            if (errors.phone) setErrors(p => ({ ...p, phone: undefined }));
          }}
          keyboardType="phone-pad"
          icon={require('../assets/images/mobile.png')}
          error={errors.phone}
          autoCorrect={false}
        />

        <AppTextField
          label="Password"
          placeholder="Create password"
          value={pass}
          onChangeText={t => {
            setPass(t);
            if (errors.pass) setErrors(p => ({ ...p, pass: undefined }));
          }}
          secureTextEntry={!showPass}
          icon={require('../assets/images/padlock.png')}
          error={errors.pass}
          autoCorrect={false}
          rightIcon={
            showPass
              ? require('../assets/images/show.png') // ✅ add this icon
              : require('../assets/images/hide.png') // ✅ add this icon
          }
          onRightIconPress={() => setShowPass(s => !s)}
        />

        <AppTextField
          label="Confirm Password"
          placeholder="Re-enter password"
          value={confirmPass}
          onChangeText={t => {
            setConfirmPass(t);
            if (errors.confirmPass)
              setErrors(p => ({ ...p, confirmPass: undefined }));
          }}
          secureTextEntry={!showConfirmPass}
          icon={require('../assets/images/padlock.png')}
          error={errors.confirmPass}
          autoCorrect={false}
          rightIcon={
            showConfirmPass
              ? require('../assets/images/show.png') // ✅ add this icon
              : require('../assets/images/hide.png') // ✅ add this icon
          }
          onRightIconPress={() => setShowConfirmPass(s => !s)}
        />

        <TouchableOpacity style={styles.btn} onPress={handleSignup}>
          <Text style={styles.btnTxt}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: 14 }}
        >
          <Text style={styles.link}>
            Already have an account? <Text style={styles.linkBold}>Login</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { paddingHorizontal: 20, paddingTop: 26, paddingBottom: 26 },
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
    marginTop: 16,
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
