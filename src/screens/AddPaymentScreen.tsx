import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import AppTextField from '../ui/AppTextField';
import { addPayment } from '../network/api';
const METHODS = ['Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa'];

const formatDDMMYYYY = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export default function AddPaymentScreen({ navigation }: any) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [method, setMethod] = useState('Cash');
  const [note, setNote] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const dateText = useMemo(() => formatDDMMYYYY(paymentDate), [paymentDate]);

  const onChangeDate = (event: DateTimePickerEvent, selected?: Date) => {
    // Android closes picker on select/cancel
    if (Platform.OS === 'android') setShowDatePicker(false);

    if (event.type === 'set' && selected) {
      setPaymentDate(selected);
      if (Platform.OS === 'ios') setShowDatePicker(false); // close after pick
    } else {
      // cancelled
      if (Platform.OS === 'ios') setShowDatePicker(false);
    }
  };
  const formatYYYYMMDD = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleSubmit = async () => {
    if (!amount.trim()) {
      Alert.alert('Validation', 'Please enter amount');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        amount: amount.trim(),
        payment_method: method.toLowerCase(), // Cash -> cash
        payment_status: 'approved', // ✅ or "pending" if your backend supports
        node: note?.trim() ? note.trim() : undefined,
        payment_date: formatYYYYMMDD(paymentDate), // ✅ yyyy-mm-dd
      };

      const data = await addPayment(payload);

      console.log(data, '000000');

      if (data?.result !== 'success') {
        Alert.alert('Failed', data?.message || 'Unable to submit payment');
        return;
      }

      // Alert.alert(
      //   'Success',
      //   data?.message || 'Payment submitted successfully!',
      // );
      navigation.goBack();
    } catch (e: any) {
      console.log(e);
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to submit payment';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Image source={require('../assets/images/back-button.png')} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Payment</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.wrap}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoBox}>
          <Image
            style={{ height: 20, width: 20 }}
            source={require('../assets/images/information.png')}
          />
          <Text style={styles.infoTxt}>
            Submit payment details here. {'\n'}Admin will verify and approve
            your payment.
          </Text>
        </View>

        <AppTextField
          label="Amount (Rs.)"
          placeholder="Enter amount"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        {/* ✅ Date field: readonly, open picker on press */}
        <Pressable onPress={() => setShowDatePicker(true)}>
          <View pointerEvents="none">
            <AppTextField
              label="Payment Date"
              placeholder="DD/MM/YYYY"
              value={dateText}
              editable={false}
              rightIcon="calendar-outline"
            />
          </View>
        </Pressable>

        {/* ✅ Method field: readonly, open modal on press */}
        <Pressable onPress={() => setShowMethodModal(true)}>
          <View pointerEvents="none">
            <AppTextField
              label="Payment Method"
              placeholder="Cash"
              value={method}
              editable={false}
              rightIcon="chevron-down-outline"
            />
          </View>
        </Pressable>

        <View style={{ marginBottom: 14 }}>
          <Text style={styles.label}>Note (Optional)</Text>
          <AppTextField
            label=""
            placeholder="Any additional details"
            value={note}
            onChangeText={setNote}
            multiline
            containerStyle={{ marginBottom: 0 }}
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, submitting ? { opacity: 0.7 } : null]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnTxt}>Submit Payment</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footerNote}>Payment will be reviewed by admin</Text>
      </ScrollView>

      {/* ✅ Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={paymentDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeDate}
        />
      )}

      {/* ✅ Method Modal */}
      <Modal
        visible={showMethodModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMethodModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowMethodModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Select Method</Text>

            {METHODS.map(m => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.methodItem,
                  method === m ? styles.methodItemActive : null,
                ]}
                onPress={() => {
                  setMethod(m);
                  setShowMethodModal(false);
                }}
              >
                <Text
                  style={[
                    styles.methodTxt,
                    method === m ? styles.methodTxtActive : null,
                  ]}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FB' },

  topBar: {
    height: 54,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F5',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginLeft: 15,
  },

  wrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 },

  infoBox: {
    backgroundColor: '#EAF3FF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#D8E7FF',
  },
  infoTxt: {
    color: '#1E63D6',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },

  label: { fontSize: 12, color: '#6B7280', marginBottom: 6, fontWeight: '600' },

  btn: {
    marginTop: 6,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#1E63D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTxt: { color: '#FFFFFF', fontFamily: 'Poppins-SemiBold', fontSize: 14 },

  footerNote: {
    textAlign: 'center',
    color: '#9AA3AF',
    fontWeight: '700',
    fontSize: 11,
    marginTop: 10,
  },

  // ✅ Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 10,
  },
  methodItem: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7EAF0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  methodItemActive: {
    borderColor: '#1E63D6',
    backgroundColor: '#EAF3FF',
  },
  methodTxt: {
    fontFamily: 'Poppins-Medium',
    color: '#111827',
  },
  methodTxtActive: {
    color: '#1E63D6',
    fontFamily: 'Poppins-SemiBold',
  },
});
