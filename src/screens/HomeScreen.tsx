import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import MonthPicker from "react-native-month-year-picker";

import { getUser, logout } from "../utils/storage";
import { getDashboardStats } from "../network/api";

function ShadowCard({ children, style }: any) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function HomeScreen({ onLogout, navigation }: any) {
  // ✅ default current month/year
  const now = new Date();

  // We store selected date as Date (picker needs Date)
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(now.getFullYear(), now.getMonth(), 1)
  );

  const [showPicker, setShowPicker] = useState(false);
  const [userName, setUserName] = useState(""); // default empty

  const [loadingStats, setLoadingStats] = useState(false);
  const [currentStats, setCurrentStats] = useState({
    total_products: 0,
    total_rs: 0,
  });
  const [previousStats, setPreviousStats] = useState({
    total_products: 0,
    total_rs: 0,
  });
  const [stats, setStats] = useState<{
    total_products: number;
    total_rs: number;
  }>({
    total_products: 10,
    total_rs: 10,
  });

  console;

  const month = selectedDate.getMonth() + 1; // 1..12
  const year = selectedDate.getFullYear();

  const monthLabel = useMemo(() => {
    return `${MONTHS[month - 1]}\n${year}`;
  }, [month, year]);

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };
  // const buildDateParam = (dateObj: Date) => {
  //   const y = dateObj.getFullYear();
  //   const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  //   return `${y}-${m}`; // ✅ "YYYY-MM"
  // };
  // 2) Helpers
  const buildDateParam = (dateObj: any) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`; // "YYYY-MM"
  };

  const mapStats = (data: any) => {
    const payload = data?.data ?? data;

    return {
      total_products: Number(payload?.total_milk_sold ?? 0),
      total_rs: Number(payload?.grand_total ?? 0),
    };
  };
  // ✅ Load user from AsyncStorage
  useEffect(() => {
    const loadUser = async () => {
      const u = await getUser();

      // your API might return username, name, full_name etc
      const name = u?.username || "";

      setUserName(name);
    };

    loadUser();
  }, []);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);

      // current month
      const currentDateParam = buildDateParam(selectedDate);

      // previous month
      const prevDateObj = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() - 1,
        1
      );
      const prevDateParam = buildDateParam(prevDateObj);

      const [currRes, prevRes] = await Promise.all([
        getDashboardStats(currentDateParam),
        getDashboardStats(prevDateParam),
      ]);

      setCurrentStats(mapStats(currRes));
      setPreviousStats(mapStats(prevRes));
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to load dashboard stats");
    } finally {
      setLoadingStats(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchStats();
    }, [selectedDate])
  );

  // ✅ fetch stats whenever month/year changes
  // useEffect(() => {
  //   const fetchStats = async () => {
  //     try {
  //       setLoadingStats(true);

  //       // ✅ Call API
  //       const dateParam = buildDateParam(selectedDate);
  //       const data = await getDashboardStats(dateParam);

  //       // ✅ Map response keys based on your backend response
  //       // If your API returns: { data: { total_products, total_rs } }
  //       const payload = data?.data ?? data;
  //       console.log(payload);

  //       setStats({
  //         total_products: Number(
  //           payload?.total_milk_sold ?? payload?.total_milk_sold ?? 0
  //         ),
  //         total_rs: Number(payload?.grand_total ?? payload?.grand_total ?? 0),
  //       });
  //     } catch (e: any) {
  //       Alert.alert("Error", e?.message || "Failed to load dashboard stats");
  //     } finally {
  //       setLoadingStats(false);
  //     }
  //   };

  //   fetchStats();
  // }, [month, year]);

  const onMonthYearChange = (event: any, newDate?: Date) => {
    // Android: close picker after selection
    // iOS: picker stays until dismissed (we close on selection too)
    setShowPicker(false);

    if (newDate) {
      setSelectedDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ✅ Header */}
      <ImageBackground
        source={require("../assets/images/home-page-bannar.png")}
        resizeMode="stretch"
        style={styles.headerBg}
      >
        {/* ✅ Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutBtn}
          activeOpacity={0.85}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} // <--- Add this
        >
          <Image
            style={{ height: 25, width: 25 }}
            source={require("../assets/images/logout.png")}
          />
        </TouchableOpacity>

        {/* <Text style={styles.gm}>Good Morning</Text> */}
        <Text style={styles.name}>{userName}</Text>
      </ImageBackground>

      <View style={styles.body}>
        <ShadowCard style={{ paddingHorizontal: 14, paddingVertical: 30 }}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.muted}>This Month</Text>
              <Text style={styles.muted}>Summary</Text>
            </View>

            {/* ✅ Open Month-Year Picker */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.monthPill}
              onPress={() => setShowPicker(true)}
            >
              <Image source={require("../assets/images/calender.png")} />
              <Text style={styles.monthTxt}>{monthLabel}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.metric}>
              <View style={styles.metricInline}>
                {loadingStats ? (
                  <ActivityIndicator />
                ) : (
                  <>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-end",
                        alignSelf: "center",
                      }}
                    >
                      <Text style={styles.metricValue}>
                        {currentStats?.total_products}
                      </Text>
                      <Text style={styles.metricUnitInline}>KG</Text>
                    </View>
                    <Text style={styles.metricLabel}>Total Products</Text>
                  </>
                )}
              </View>
            </View>

            <View style={styles.vLine} />

            <View style={styles.metric}>
              <View style={styles.metricInline}>
                {loadingStats ? (
                  <ActivityIndicator />
                ) : (
                  <>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-end",
                        alignSelf: "center",
                      }}
                    >
                      <Text style={styles.metricValue}>
                        {currentStats.total_rs.toLocaleString()}
                      </Text>
                    </View>
                    <Text style={styles.metricLabel}>Total (Rs.)</Text>
                  </>
                )}
              </View>
            </View>
          </View>
        </ShadowCard>
        <View style={{ marginTop: 10, alignItems: "center" }}>
          <Text
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 14,
              color: "#6B7280",
            }}
          >
            Previous Month Amount
          </Text>

          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 18,
              color: "#111827",
              marginTop: 2,
            }}
          >
            Rs. {previousStats?.total_rs.toLocaleString()}
          </Text>
        </View>

        {/* ✅ cards */}
        <View style={styles.grid}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Milk")}
            activeOpacity={0.9}
            style={{ flex: 1 }}
          >
            <ShadowCard style={styles.actionCard}>
              <View style={styles.actionIconBox}>
                <Image source={require("../assets/images/Milk.png")} />
              </View>
              <Text style={styles.actionText}>Milk Collection</Text>
            </ShadowCard>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Payment")}
            activeOpacity={0.9}
            style={{ flex: 1 }}
          >
            <ShadowCard style={styles.actionCard}>
              <View
                style={[styles.actionIconBox, { backgroundColor: "#E8F6EC" }]}
              >
                <Image source={require("../assets/images/payment.png")} />
              </View>
              <Text style={styles.actionText}>Payment History</Text>
            </ShadowCard>
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ Month-Year Picker (package) */}
      {showPicker && (
        <MonthPicker
          onChange={onMonthYearChange}
          value={selectedDate}
          minimumDate={new Date(2020, 0)} // optional
          maximumDate={new Date(2035, 11)} // optional
          locale="en"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FB" },

  headerBg: {
    height: 300,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 34,

    elevation: 10, // Android
  },

  logoutBtn: {
    position: "absolute",
    right: 18,
    top: 18,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 10,
    zIndex: 100, // <--- Add this
    elevation: 10, // <--- Add this for Android
  },

  gm: { color: "#FFFFFF", fontSize: 14, fontFamily: "Poppins-Medium" },
  name: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    marginTop: 2,
  },

  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    position: "absolute",
    width: "100%",
    top: 180,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },

  muted: {
    color: "#7F7F7F",
    fontFamily: "Poppins-Regular",
    fontSize: 16,
    lineHeight: 16,
  },

  monthPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E3F2FD",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  monthTxt: {
    color: "#0052CC",
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    lineHeight: 14,
  },

  summaryRow: { flexDirection: "row", marginTop: 14, alignItems: "center" },

  metric: { flex: 1, alignItems: "center" },

  metricInline: {
    backgroundColor: "#F2F7FF",
    paddingVertical: 10,
    width: "90%",
    paddingHorizontal: 20,
    borderRadius: 10,
  },

  metricValue: {
    fontSize: 32,
    fontFamily: "Poppins-SemiBold",
    color: "#111827",
  },

  metricUnitInline: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#9AA3AF",
    marginBottom: 10,
    marginLeft: 4,
  },

  metricLabel: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#9AA3AF",
    marginTop: 4,
    alignSelf: "center",
  },

  vLine: { width: 1, height: 44, backgroundColor: "#EDF0F5" },

  grid: { flexDirection: "row", gap: 14, marginTop: 16 },

  actionCard: {
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  actionIconBox: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#EEF5FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  actionText: {
    color: "#111827",
    fontFamily: "Poppins-SemiBold",
    fontSize: 18,
  },
});
