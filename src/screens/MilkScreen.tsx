import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MonthPicker from 'react-native-month-year-picker';

import { getMilkCollection } from '../network/api';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

type MilkItem = {
  date?: string;
  display_date?: string;
  quantity?: number;
  total_amount?: number;
  payment_status?: string;
};

export default function MilkScreen({ navigation }: any) {
  const now = new Date();

  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(now.getFullYear(), now.getMonth(), 1),
  );
  const [showPicker, setShowPicker] = useState(false);

  const [loading, setLoading] = useState(true);
  const [monthTitle, setMonthTitle] = useState('');
  const [summary, setSummary] = useState({
    total_milk_sold: 0,
    grand_total: 0,
  });
  const [history, setHistory] = useState<MilkItem[]>([]);

  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();

  const monthLabel = useMemo(() => {
    return `${MONTHS[month - 1]}\n${year}`;
  }, [month, year]);

  const buildDateParam = (dateObj: Date) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`; // ✅ YYYY-MM
  };

  const fetchMilk = async () => {
    try {
      setLoading(true);

      const dateParam = buildDateParam(selectedDate);
      const res = await getMilkCollection(dateParam);

      if (res?.result !== 'success') {
        Alert.alert('Error', res?.message || 'Failed to fetch milk collection');
        return;
      }

      const data = res?.data ?? {};
      setMonthTitle(data?.month || `${MONTHS[month - 1]} ${year}`);

      setSummary({
        total_milk_sold: Number(data?.summary?.total_milk_sold ?? 0),
        grand_total: Number(data?.summary?.grand_total ?? 0),
      });

      setHistory(Array.isArray(data?.history) ? data.history : []);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Something went wrong';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilk();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const onMonthYearChange = (event: any, newDate?: Date) => {
    setShowPicker(false);
    if (newDate) {
      setSelectedDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    }
  };

  const renderItem = ({ item }: { item: MilkItem }) => {
    const qty = Number(item.quantity ?? 0);
    const dateText = item.display_date || item.date || '';
    const status = (item.payment_status ?? '').toString();

    return (
      <View style={styles.itemCard}>
        <View style={styles.iconCircle}>
          <Image source={require('../assets/images/Milk.png')} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>{dateText}</Text>
          <Text style={styles.itemSub}>{status}</Text>
        </View>

        <Text style={styles.itemKg}>{qty} KG</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation?.goBack?.()}
          style={styles.backBtn}
        >
          <Image source={require('../assets/images/back-button.png')} />
        </TouchableOpacity>

        <Text style={styles.title}>Milk Collection</Text>
        <View style={{ width: 34 }} />
      </View>

      <View style={styles.wrap}>
        {/* ✅ Month Button like HomeScreen */}
        <View style={styles.monthRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.monthPill}
            onPress={() => setShowPicker(true)}
          >
            <Image source={require('../assets/images/calender.png')} />
            <Text style={styles.monthTxt}>{monthLabel}</Text>
          </TouchableOpacity>

          <Text style={styles.monthTitle}>{monthTitle}</Text>
        </View>

        {/* ✅ Summary Card */}
        <View style={styles.totalCard}>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <>
              <View>
                <Text style={styles.smallBlue}>Total Milk Sold</Text>
                <Text style={styles.bigBlue}>{summary.total_milk_sold} KG</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.smallGrey}>Total Amount</Text>
                <Text style={styles.bigDark}>
                  Rs. {summary.grand_total.toLocaleString()}
                </Text>
              </View>
            </>
          )}
        </View>

        <Text style={styles.section}>Daily Collection</Text>

        {loading ? (
          <View style={{ paddingTop: 20 }}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(i, idx) => String((i as any)?.id ?? idx)}
            contentContainerStyle={{ paddingBottom: 30 }}
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={{ paddingTop: 30, alignItems: 'center' }}>
                <Text
                  style={{ color: '#9AA3AF', fontFamily: 'Poppins-Medium' }}
                >
                  No record found
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* ✅ Picker */}
      {showPicker && (
        <MonthPicker
          onChange={onMonthYearChange}
          value={selectedDate}
          minimumDate={new Date(2020, 0)}
          maximumDate={new Date(2035, 11)}
          locale="en"
        />
      )}
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
  title: { fontSize: 22, fontFamily: 'Poppins-SemiBold', color: '#111827' },

  wrap: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  monthTxt: {
    color: '#0052CC',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    lineHeight: 14,
  },

  monthTitle: {
    color: '#111827',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },

  totalCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    minHeight: 78,
    alignItems: 'center',
  },

  smallBlue: { color: '#0052CC', fontFamily: 'Poppins-Medium', fontSize: 14 },
  bigBlue: {
    color: '#1E63D6',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 28,
    marginTop: 4,
  },
  smallGrey: { color: '#7F7F7F', fontFamily: 'Poppins-Regular', fontSize: 14 },
  bigDark: {
    color: '#111827',
    fontFamily: 'Poppins-Medium',
    fontSize: 22,
    marginTop: 4,
  },

  section: {
    color: '#2C3E50',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 22,
    marginBottom: 10,
  },

  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEF0F5',
  },
  iconCircle: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemTitle: {
    fontFamily: 'Poppins-SemiBold',
    color: '#2C3E50',
    fontSize: 16,
  },
  itemSub: {
    fontFamily: 'Poppins-Regular',
    marginTop: 2,
    color: '#9AA3AF',
    fontSize: 14,
  },
  itemKg: { fontFamily: 'Poppins-SemiBold', color: '#111827', fontSize: 16 },
});
