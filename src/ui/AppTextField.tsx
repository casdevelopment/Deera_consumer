import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  Image,
  TouchableOpacity,
} from 'react-native';

type Props = TextInputProps & {
  label: string;
  icon?: any;
  rightIcon?: any;
  onRightIconPress?: () => void;
  containerStyle?: any;
  error?: string;
};

export default function AppTextField({
  label,
  icon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  error,
  ...props
}: Props) {
  return (
    <View style={[styles.wrap, containerStyle]}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
        {icon && (
          <Image source={icon} style={styles.leftIcon} resizeMode="contain" />
        )}

        <TextInput
          placeholderTextColor="#B6BDC8"
          style={styles.input}
          {...props}
        />

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // ✅ easier tap
          >
            <Image
              source={rightIcon}
              style={styles.rightIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>

      {!!error && <Text style={styles.errorTxt}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },

  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
    fontFamily: 'Poppins-Medium',
  },

  inputRow: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E7EAF0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  inputRowError: {
    borderColor: '#EF4444',
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Poppins-Regular',
  },

  leftIcon: { width: 18, height: 18, marginRight: 10 },
  rightIcon: { width: 18, height: 18 },

  errorTxt: {
    marginTop: 6,
    fontSize: 12,
    color: '#EF4444',
    fontFamily: 'Poppins-Regular',
  },
});
