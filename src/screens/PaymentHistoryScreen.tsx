import React, { useState, useCallback } from "react";
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
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Chip from "../ui/Chip";
import { getPaymentHistory, addPayment, getBills } from "../network/api"; // ✅ add payPayment

type PaymentItem = {
  id: number | string;
  amount: number | string;
  payment_method?: string;
  payment_status?: string;
  payment_date?: string;
  display_date?: string;
  note?: string | null;
};
type BillItem = {
  id: number | string;
  from_date: string; // "2025-12-06"
  to_date: string; // "2026-01-05"
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  status: string; // "pending" | "approved" | etc
};

function toneChip(tone: string, text: string) {
  const t = tone?.toLowerCase?.() ?? "";
  if (t.includes("paid"))
    return <Chip text={text} bg="#DDFBE7" color="#16A34A" />;
  if (t.includes("pending"))
    return <Chip text={text} bg="#FFF3CC" color="#F59E0B" />;
  return <Chip text={text} bg="#FFE0E0" color="#EF4444" />;
}

export default function PaymentHistoryScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillItem | null>(null);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [summary, setSummary] = useState({
    approved_amount: 0,
    pending_amount: 0,
    total_payments: 0,
  });

  const [payments, setPayments] = useState<PaymentItem[]>([]);

  // ✅ Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(
    null
  );
  const [paying, setPaying] = useState(false);

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPayment(null);
    setPaying(false);
  };

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

      // setPayments(Array.isArray(payload?.payments) ? payload.payments : []);
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
  const fetchBills = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await getBills();

      if (data?.result !== "success") {
        Alert.alert(
          "Error",
          data?.message || "Failed to fetch payment history"
        );
        return;
      }

      const payload = data?.data ?? {};

      setPayments(Array.isArray(payload) ? payload : []);
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
      fetchBills(false);
    }, [])
  );

  // ✅ open modal on card press
  const onPressPayment = (item: PaymentItem) => {
    const status = (item.status ?? "").toLowerCase();

    console.log(status, "mmmmmioioiiii");

    // ❌ already paid → do NOT open modal
    if (
      status.includes("approved") ||
      status.includes("paid") ||
      status.includes("pending_approval")
    ) {
      Alert.alert("Info", "This bill is already paid.");
      return;
    }
    setSelectedBill(item);

    setSelectedPayment(item);
    setModalOpen(true);
  };

  const formatYYYYMMDD = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // ✅ pay button handler
  const onPay = async () => {
    if (!selectedPayment) return;

    console.log(selectedPayment, "mmmm");

    try {
      setPaying(true);

      // optional: block paying for already-approved payments
      const status = (selectedPayment.payment_status ?? "").toLowerCase();
      if (status.includes("approved")) {
        Alert.alert("Info", "This payment is already approved.");
        setPaying(false);
        return;
      }

      const payload = {
        amount: String(selectedPayment.total_amount ?? 0),
        payment_method: "cash",
        bill_id: String(selectedPayment.id),
        node: "",
        payment_date: formatYYYYMMDD(paymentDate), // ✅ yyyy-mm-dd
      };

      console.log(payload, "mmmmmmmeer");

      const data = await addPayment(payload);

      // const data = {};

      console.log(data, "000000");

      if (data?.result !== "success") {
        Alert.alert("Failed", data?.message || "Unable to submit payment");
        return;
      }

      if (data?.result !== "success") {
        Alert.alert("Error", data?.message || "Payment failed");
        setPaying(false);
        return;
      }

      console.log(data, "mmmm555");

      Alert.alert("Success", data?.message || "Payment successful");
      closeModal();
      fetchHistory(true); // refresh list + summary
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Payment failed";
      Alert.alert("Error", msg);
    } finally {
      setPaying(false);
    }
  };

  const renderItem = ({ item }: { item: BillItem }) => {
    const total = Number(item.total_amount ?? 0);
    const paid = Number(item.paid_amount ?? 0);
    const due = Number(item.due_amount ?? 0);

    const statusText = (item.status ?? "").toString();
    const tone = statusText.toLowerCase();

    const rangeText = `${item.from_date || "-"}  →  ${item.to_date || "-"}`;

    // optional icon bg per status
    const iconBg = tone.includes("paid")
      ? "#DCFCE7"
      : tone.includes("pending")
      ? "#FEF9C3"
      : "#FFE4E6";

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onPressPayment(item as any)} // or create onPressBill(item)
        style={styles.billCard}
      >
        {/* Left Icon */}
        <View style={[styles.billIconBox, { backgroundColor: iconBg }]}>
          <Image source={require("../assets/images/history-icon.png")} />
          {/* <Image
            source={
              tone.includes("approved")
                ? require("../assets/images/check.png") // add if you have
                : require("../assets/images/history-icon.png")
            }
            style={{ width: 20, height: 20, resizeMode: "contain" }}
          /> */}
        </View>

        {/* Middle Content */}
        <View style={{ flex: 1 }}>
          <View style={styles.billTopRow}>
            <Text style={styles.billTitle}>Milk Bill</Text>
            {toneChip(tone, statusText)}
          </View>

          <Text style={styles.billRange}>{rangeText}</Text>

          {/* Amount Row */}
          <View style={styles.billAmountsRow}>
            <View style={styles.billAmountBox}>
              <Text style={styles.billAmountLabel}>Total</Text>
              <Text style={styles.billAmountValue}>
                Rs. {total.toLocaleString()}
              </Text>
            </View>

            <View style={styles.billDivider} />

            <View style={styles.billAmountBox}>
              <Text style={styles.billAmountLabel}>Paid</Text>
              <Text style={styles.billAmountValue}>
                Rs. {paid.toLocaleString()}
              </Text>
            </View>

            <View style={styles.billDivider} />

            <View style={styles.billAmountBox}>
              <Text style={styles.billAmountLabel}>Due</Text>
              <Text style={[styles.billAmountValue, { color: "#EF4444" }]}>
                Rs. {due.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // const renderItem = ({ item }: { item: PaymentItem }) => {
  //   const amountNumber = Number(item.amount ?? 0);
  //   const amountText = `Rs. ${amountNumber.toLocaleString()}`;

  //   const methodText = (item.payment_method ?? "").toString();
  //   const dateText = (item.display_date ?? item.payment_date ?? "").toString();
  //   const subtitle = `${dateText || "-"} • ${methodText || "-"}`;

  //   const statusText = (item.payment_status ?? "").toString();
  //   const tone = statusText.toLowerCase();

  //   return (
  //     <TouchableOpacity
  //       activeOpacity={0.85}
  //       onPress={() => onPressPayment(item)}
  //       style={styles.itemCard}
  //     >
  //       <View style={styles.iconBox}>
  //         <Image source={require("../assets/images/history-icon.png")} />
  //       </View>

  //       <View style={{ flex: 1 }}>
  //         <Text style={styles.amount}>{amountText}</Text>
  //         <Text style={styles.date}>{subtitle}</Text>
  //       </View>

  //       {toneChip(tone, statusText)}
  //     </TouchableOpacity>
  //   );
  // };

  const selectedAmountNumber = Number(selectedPayment?.total_amount ?? 0);
  const selectedAmountText = `Rs. ${selectedAmountNumber.toLocaleString()}`;
  const selectedStatus = (selectedPayment?.status ?? "").toLowerCase();
  const isApproved = selectedStatus.includes("approved");

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
        {/* <View style={styles.statsRow}>
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
        </View> */}

        {/* <Text style={styles.section}>All Payments</Text> */}

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
      </View>

      {/* ✅ Modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        {/* overlay close */}
        <Pressable style={styles.modalOverlay} onPress={closeModal} />

        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Payment</Text>

          <View style={styles.modalRow}>
            <Text style={styles.modalLabel}>Amount</Text>
            <Text style={styles.modalValue}>{selectedAmountText}</Text>
          </View>

          <View style={styles.modalRow}>
            <Text style={styles.modalLabel}>Status</Text>
            <Text style={styles.modalValue}>
              {(selectedPayment?.status ?? "-").toString()}
            </Text>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              onPress={closeModal}
              style={[styles.modalBtn, styles.modalBtnGhost]}
              disabled={paying}
            >
              <Text style={styles.modalBtnGhostText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onPay}
              style={[
                styles.modalBtn,
                styles.modalBtnPrimary,
                (paying || isApproved) && { opacity: 0.6 },
              ]}
              disabled={paying || isApproved}
            >
              {paying ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.modalBtnPrimaryText}>
                  {isApproved ? "Paid" : "Pay"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  billCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEF0F5",
  },

  billIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  billTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  billTitle: {
    fontFamily: "Poppins-SemiBold",
    color: "#111827",
    fontSize: 16,
  },

  billRange: {
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 10,
  },

  billAmountsRow: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
  },

  billAmountBox: {
    flex: 1,
    alignItems: "center",
  },

  billAmountLabel: {
    fontFamily: "Poppins-Medium",
    color: "#6B7280",
    fontSize: 12,
    marginBottom: 4,
  },

  billAmountValue: {
    fontFamily: "Poppins-SemiBold",
    color: "#111827",
    fontSize: 13,
  },

  billDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 6,
  },

  // ✅ modal styles
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalCard: {
    position: "absolute",
    left: 16,
    right: 16,
    top: "32%",
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
  },
  modalTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 18,
    color: "#111827",
    marginBottom: 12,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F5",
  },
  modalLabel: {
    fontFamily: "Poppins-Medium",
    color: "#6B7280",
    fontSize: 14,
  },
  modalValue: {
    fontFamily: "Poppins-SemiBold",
    color: "#111827",
    fontSize: 14,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  modalBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnGhost: {
    backgroundColor: "#F3F4F6",
  },
  modalBtnGhostText: {
    fontFamily: "Poppins-SemiBold",
    color: "#111827",
  },
  modalBtnPrimary: {
    backgroundColor: "#1E63D6",
  },
  modalBtnPrimaryText: {
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
});

// import React, { useEffect, useMemo, useState, useCallback } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   TouchableOpacity,
//   Image,
//   ActivityIndicator,
//   Alert,
//   RefreshControl,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useFocusEffect } from "@react-navigation/native";
// import Chip from "../ui/Chip";
// import { getPaymentHistory } from "../network/api";

// type PaymentItem = {
//   id: number | string;
//   amount: number | string;
//   payment_method?: string;
//   payment_status?: string;
//   payment_date?: string;
//   display_date?: string;
//   note?: string | null;
// };

// function toneChip(tone: string, text: string) {
//   const t = tone?.toLowerCase?.() ?? "";

//   if (t.includes("approved"))
//     return <Chip text={text} bg="#DDFBE7" color="#16A34A" />;

//   if (t.includes("pending"))
//     return <Chip text={text} bg="#FFF3CC" color="#F59E0B" />;

//   return <Chip text={text} bg="#FFE0E0" color="#EF4444" />;
// }

// export default function PaymentHistoryScreen({ navigation }: any) {
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   const [summary, setSummary] = useState<{
//     approved_amount: number;
//     pending_amount: number;
//     total_payments: number;
//   }>({
//     approved_amount: 0,
//     pending_amount: 0,
//     total_payments: 0,
//   });

//   const [payments, setPayments] = useState<PaymentItem[]>([]);

//   const fetchHistory = async (isRefresh = false) => {
//     try {
//       if (isRefresh) setRefreshing(true);
//       else setLoading(true);

//       const data = await getPaymentHistory();

//       if (data?.result !== "success") {
//         Alert.alert(
//           "Error",
//           data?.message || "Failed to fetch payment history"
//         );
//         return;
//       }

//       const payload = data?.data ?? {};

//       setSummary({
//         approved_amount: Number(payload?.summary?.approved_amount ?? 0),
//         pending_amount: Number(payload?.summary?.pending_amount ?? 0),
//         total_payments: Number(payload?.summary?.total_payments ?? 0),
//       });

//       setPayments(Array.isArray(payload?.payments) ? payload.payments : []);
//     } catch (e: any) {
//       const msg =
//         e?.response?.data?.message ||
//         e?.response?.data?.error ||
//         e?.message ||
//         "Something went wrong";
//       Alert.alert("Error", msg);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   useFocusEffect(
//     useCallback(() => {
//       fetchHistory(false);
//     }, [])
//   );

//   // useEffect(() => {
//   //   fetchHistory(false);
//   // }, []);

//   const renderItem = ({ item }: { item: PaymentItem }) => {
//     const amountNumber = Number(item.amount ?? 0);
//     const amountText = `Rs. ${amountNumber.toLocaleString()}`;

//     const methodText = (item.payment_method ?? "").toString();
//     const dateText =
//       (item.display_date ?? item.payment_date ?? "").toString() || "";

//     const subtitle = `${dateText} • ${methodText}`;

//     const statusText = (item.payment_status ?? "").toString();
//     const tone = statusText.toLowerCase(); // "Approved" -> approved

//     return (
//       <View style={styles.itemCard}>
//         <View style={styles.iconBox}>
//           <Image source={require("../assets/images/history-icon.png")} />
//         </View>

//         <View style={{ flex: 1 }}>
//           <Text style={styles.amount}>{amountText}</Text>
//           <Text style={styles.date}>{subtitle}</Text>
//         </View>

//         {toneChip(tone, statusText)}
//       </View>
//     );
//   };

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.safe}>
//         <View style={styles.topBar}>
//           <TouchableOpacity
//             onPress={() => navigation?.goBack?.()}
//             style={styles.backBtn}
//           >
//             <Image source={require("../assets/images/back-button.png")} />
//           </TouchableOpacity>
//           <Text style={styles.title}>Payment History</Text>
//         </View>

//         <View
//           style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
//         >
//           <ActivityIndicator size="large" />
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.safe}>
//       <View style={styles.topBar}>
//         <TouchableOpacity
//           onPress={() => navigation?.goBack?.()}
//           style={styles.backBtn}
//         >
//           <Image source={require("../assets/images/back-button.png")} />
//         </TouchableOpacity>
//         <Text style={styles.title}>Payment History</Text>
//       </View>

//       <View style={styles.wrap}>
//         <View style={styles.statsRow}>
//           <View style={[styles.statCard, { backgroundColor: "#DCFCE7" }]}>
//             <Text style={[styles.statSmall, { color: "#28C76F" }]}>Rs.</Text>
//             <Text style={[styles.statValue, { color: "#28C76F" }]}>
//               {summary.approved_amount.toLocaleString()}
//             </Text>
//             <Text style={[styles.statLabel, { color: "#28C76F" }]}>
//               Approved
//             </Text>
//           </View>

//           <View style={[styles.statCard, { backgroundColor: "#FEF9C3" }]}>
//             <Text style={[styles.statSmall, { color: "#EAB308" }]}>Rs.</Text>
//             <Text style={[styles.statValue, { color: "#EAB308" }]}>
//               {summary.pending_amount.toLocaleString()}
//             </Text>
//             <Text style={[styles.statLabel, { color: "#EAB308" }]}>
//               Pending
//             </Text>
//           </View>
//         </View>

//         <Text style={styles.section}>All Payments</Text>

//         <FlatList
//           data={payments}
//           keyExtractor={(i) => String(i.id)}
//           contentContainerStyle={{ paddingBottom: 80 }}
//           renderItem={renderItem}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={() => fetchHistory(true)}
//             />
//           }
//           ListEmptyComponent={
//             <View style={{ paddingTop: 30, alignItems: "center" }}>
//               <Text style={{ color: "#9AA3AF", fontFamily: "Poppins-Medium" }}>
//                 No payments found
//               </Text>
//             </View>
//           }
//         />

//         {/* <TouchableOpacity
//           style={styles.fab}
//           onPress={() => navigation.navigate("AddPayment")}
//         >
//           <Image
//             style={{ height: 15, width: 15 }}
//             source={require("../assets/images/add.png")}
//           />
//         </TouchableOpacity> */}
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: "#F5F7FB" },
//   topBar: {
//     height: 54,
//     backgroundColor: "#FFFFFF",
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 14,
//     borderBottomWidth: 1,
//     borderBottomColor: "#EEF0F5",
//   },
//   backBtn: {
//     width: 34,
//     height: 34,
//     borderRadius: 10,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   title: {
//     fontSize: 22,
//     fontFamily: "Poppins-SemiBold",
//     color: "#111827",
//     marginLeft: 15,
//   },

//   wrap: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },

//   statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
//   statCard: {
//     flex: 1,
//     borderRadius: 14,
//     padding: 14,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   statSmall: {
//     fontFamily: "Poppins-SemiBold",
//     fontSize: 18,
//     marginBottom: 4,
//   },
//   statValue: {
//     fontFamily: "Poppins-SemiBold",
//     fontSize: 28,
//     textAlign: "center",
//     lineHeight: 30,
//   },
//   statLabel: { marginTop: 6, fontFamily: "Poppins-Medium", fontSize: 16 },

//   section: {
//     color: "#2C3E50",
//     fontFamily: "Poppins-SemiBold",
//     fontSize: 22,
//     marginBottom: 10,
//   },

//   itemCard: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 14,
//     padding: 12,
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 10,
//     borderWidth: 1,
//     borderColor: "#EEF0F5",
//   },
//   iconBox: {
//     width: 38,
//     height: 38,
//     borderRadius: 12,
//     backgroundColor: "#FFF7DF",
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 12,
//   },
//   amount: { fontFamily: "Poppins-SemiBold", color: "#2C3E50", fontSize: 16 },
//   date: {
//     fontFamily: "Poppins-Regular",
//     marginTop: 2,
//     color: "#9AA3AF",
//     fontSize: 14,
//   },

//   fab: {
//     position: "absolute",
//     right: 18,
//     bottom: 18,
//     width: 48,
//     height: 48,
//     borderRadius: 14,
//     backgroundColor: "#1E63D6",
//     alignItems: "center",
//     justifyContent: "center",
//     shadowColor: "#000",
//     shadowOpacity: 0.16,
//     shadowRadius: 10,
//     shadowOffset: { width: 0, height: 10 },
//     elevation: 5,
//   },
// });
