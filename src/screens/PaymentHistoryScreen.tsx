import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Chip from "../ui/Chip";
import { getPaymentHistory } from "../network/api";

type PaymentItem = {
  id: number | string;
  amount: number | string;
  payment_method?: string;
  payment_status?: string;
  payment_date?: string;
  display_date?: string;
  note?: string | null;
};

function toneChip(tone: string, text: string) {
  const t = tone?.toLowerCase?.() ?? "";

  if (t.includes("approved"))
    return <Chip text={text} bg="#DDFBE7" color="#16A34A" />;

  if (t.includes("pending"))
    return <Chip text={text} bg="#FFF3CC" color="#F59E0B" />;

  return <Chip text={text} bg="#FFE0E0" color="#EF4444" />;
}

export default function PaymentHistoryScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [summary, setSummary] = useState<{
    approved_amount: number;
    pending_amount: number;
    total_payments: number;
  }>({
    approved_amount: 0,
    pending_amount: 0,
    total_payments: 0,
  });

  const [payments, setPayments] = useState<PaymentItem[]>([]);

  const fetchHistory = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await getPaymentHistory();

      if (data?.result !== "success") {
        Alert.alert(
          "Error",
          data?.message || "Failed to fetch payment history"
        );
        return;
      }

      const payload = data?.data ?? {};

      setSummary({
        approved_amount: Number(payload?.summary?.approved_amount ?? 0),
        pending_amount: Number(payload?.summary?.pending_amount ?? 0),
        total_payments: Number(payload?.summary?.total_payments ?? 0),
      });

      setPayments(Array.isArray(payload?.payments) ? payload.payments : []);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Something went wrong";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory(false);
    }, [])
  );

  // useEffect(() => {
  //   fetchHistory(false);
  // }, []);

  const renderItem = ({ item }: { item: PaymentItem }) => {
    const amountNumber = Number(item.amount ?? 0);
    const amountText = `Rs. ${amountNumber.toLocaleString()}`;

    const methodText = (item.payment_method ?? "").toString();
    const dateText =
      (item.display_date ?? item.payment_date ?? "").toString() || "";

    const subtitle = `${dateText} • ${methodText}`;

    const statusText = (item.payment_status ?? "").toString();
    const tone = statusText.toLowerCase(); // "Approved" -> approved

    return (
      <View style={styles.itemCard}>
        <View style={styles.iconBox}>
          <Image source={require("../assets/images/history-icon.png")} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.amount}>{amountText}</Text>
          <Text style={styles.date}>{subtitle}</Text>
        </View>

        {toneChip(tone, statusText)}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation?.goBack?.()}
            style={styles.backBtn}
          >
            <Image source={require("../assets/images/back-button.png")} />
          </TouchableOpacity>
          <Text style={styles.title}>Payment History</Text>
        </View>

        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation?.goBack?.()}
          style={styles.backBtn}
        >
          <Image source={require("../assets/images/back-button.png")} />
        </TouchableOpacity>
        <Text style={styles.title}>Payment History</Text>
      </View>

      <View style={styles.wrap}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: "#DCFCE7" }]}>
            <Text style={[styles.statSmall, { color: "#28C76F" }]}>Rs.</Text>
            <Text style={[styles.statValue, { color: "#28C76F" }]}>
              {summary.approved_amount.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: "#28C76F" }]}>
              Approved
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: "#FEF9C3" }]}>
            <Text style={[styles.statSmall, { color: "#EAB308" }]}>Rs.</Text>
            <Text style={[styles.statValue, { color: "#EAB308" }]}>
              {summary.pending_amount.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: "#EAB308" }]}>
              Pending
            </Text>
          </View>
        </View>

        <Text style={styles.section}>All Payments</Text>

        <FlatList
          data={payments}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchHistory(true)}
            />
          }
          ListEmptyComponent={
            <View style={{ paddingTop: 30, alignItems: "center" }}>
              <Text style={{ color: "#9AA3AF", fontFamily: "Poppins-Medium" }}>
                No payments found
              </Text>
            </View>
          }
        />

        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("AddPayment")}
        >
          <Image
            style={{ height: 15, width: 15 }}
            source={require("../assets/images/add.png")}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FB" },
  topBar: {
    height: 54,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F5",
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontFamily: "Poppins-SemiBold",
    color: "#111827",
    marginLeft: 15,
  },

  wrap: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },

  statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statSmall: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 18,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 28,
    textAlign: "center",
    lineHeight: 30,
  },
  statLabel: { marginTop: 6, fontFamily: "Poppins-Medium", fontSize: 16 },

  section: {
    color: "#2C3E50",
    fontFamily: "Poppins-SemiBold",
    fontSize: 22,
    marginBottom: 10,
  },

  itemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEF0F5",
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFF7DF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  amount: { fontFamily: "Poppins-SemiBold", color: "#2C3E50", fontSize: 16 },
  date: {
    fontFamily: "Poppins-Regular",
    marginTop: 2,
    color: "#9AA3AF",
    fontSize: 14,
  },

  fab: {
    position: "absolute",
    right: 18,
    bottom: 18,
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#1E63D6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
});
