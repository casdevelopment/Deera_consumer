import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
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

type Product = {
  name: string;
  quantity: number;
  unit: string;
};

type DashboardData = {
  total_products: number;
  total_rs: number;
  products: Product[];
};

export default function HomeScreen({ onLogout, navigation }: any) {
  const now = new Date();

  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(now.getFullYear(), now.getMonth(), 1)
  );

  const [showPicker, setShowPicker] = useState(false);
  const [userName, setUserName] = useState("");

  const [loadingStats, setLoadingStats] = useState(false);
  const [currentStats, setCurrentStats] = useState<DashboardData>({
    total_products: 0,
    total_rs: 0,
    products: [],
  });
  const [previousStats, setPreviousStats] = useState<DashboardData>({
    total_products: 0,
    total_rs: 0,
    products: [],
  });

  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();

  const monthLabel = useMemo(() => {
    return `${MONTHS[month - 1]}\n${year}`;
  }, [month, year]);

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  const buildDateParam = (dateObj: any) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  };

  const mapStats = (data: any): DashboardData => {
    const payload = data?.data ?? data;
    return {
      total_products: Number(payload?.products?.length ?? 0),
      total_rs: Number(payload?.grand_total ?? 0),
      products: Array.isArray(payload?.products) ? payload.products : [],
    };
  };

  // Load user from AsyncStorage
  React.useEffect(() => {
    const loadUser = async () => {
      const u = await getUser();
      const name = u?.username || "";
      setUserName(name);
    };
    loadUser();
  }, []);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);

      const currentDateParam = buildDateParam(selectedDate);

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
    } catch (e: any) {
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

  const onMonthYearChange = (event: any, newDate?: Date) => {
    setShowPicker(false);
    if (newDate) {
      setSelectedDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <ImageBackground
        source={require("../assets/images/home-page-bannar.png")}
        resizeMode="stretch"
        style={styles.headerBg}
      >
        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutBtn}
          activeOpacity={0.85}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Image
            style={{ height: 25, width: 25 }}
            source={require("../assets/images/logout.png")}
          />
        </TouchableOpacity>

        <Text style={styles.name}>{userName}</Text>
      </ImageBackground>

      <View style={styles.body}>
        {/* Summary Card */}
        <ShadowCard style={{ paddingHorizontal: 14, paddingVertical: 30 }}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.muted}>This Month</Text>
              <Text style={styles.muted}>Summary</Text>
            </View>

            {/* Month-Year Picker */}
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

        {/* Previous Month */}
        {/* <View style={{ marginTop: 10, alignItems: "center" }}>
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
        </View> */}
      </View>

      {/* Sold Productions Section - scrollable */}
      <ScrollView
        style={styles.soldScroll}
        contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Sold Productions Section */}
        <View style={styles.soldSection}>
          <Text style={styles.soldTitle}>Sold Products</Text>

          {loadingStats ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#1E63D6" />
            </View>
          ) : currentStats.products.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          ) : (
            currentStats.products.map((product, index) => (
              <View key={index} style={styles.productCard}>
                <View style={styles.productIconBox}>
                  <Text style={styles.productEmoji}>📦</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productUnit}>{product.unit}</Text>
                </View>

                <View style={styles.productQtyBox}>
                  <Text style={styles.productQty}>{product.quantity}</Text>
                  <Text style={styles.productQtyLabel}>{product.unit}</Text>
                </View>
              </View>
            ))
          )}

          {/* Footer row: totals */}
          {!loadingStats && currentStats.products.length > 0 && (
            <View style={styles.productFooter}>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>Total Products</Text>
                <Text style={styles.footerValue}>
                  {currentStats.total_products}
                </Text>
              </View>

              <View style={styles.footerDivider} />

              <View style={[styles.footerItem, { alignItems: "flex-end" }]}>
                <Text style={styles.footerLabel}>Total (Rs.)</Text>
                <Text style={[styles.footerValue, { color: "#1E63D6" }]}>
                  Rs. {currentStats.total_rs.toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Month-Year Picker */}
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
  safe: { flex: 1, backgroundColor: "#F5F7FB" },

  headerBg: {
    height: 300,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 34,
    elevation: 10,
  },

  logoutBtn: {
    position: "absolute",
    right: 18,
    top: 18,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 10,
    zIndex: 100,
    elevation: 10,
  },

  gm: { color: "#FFFFFF", fontSize: 14, fontFamily: "Poppins-Medium" },
  name: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    marginTop: 2,
  },

  body: {
    paddingHorizontal: 16,
    paddingTop: 14,
    position: "absolute",
    width: "100%",
    top: 100,
  },

  soldScroll: {
    position: "absolute",
    width: "100%",
    top: 365,
    bottom: 0,
    paddingTop: 15,
    paddingBottom: 20,
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

  // ── Sold Productions ──────────────────────────────
  soldSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  soldTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 18,
    color: "#111827",
    marginBottom: 14,
  },

  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEF0F5",
  },

  productIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  productEmoji: {
    fontSize: 22,
  },

  productName: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: "#111827",
  },

  productUnit: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: "#9AA3AF",
    marginTop: 2,
  },

  productQtyBox: {
    alignItems: "flex-end",
  },

  productQty: {
    fontFamily: "Poppins-Bold",
    fontSize: 22,
    color: "#1E63D6",
  },

  productQtyLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: "#9AA3AF",
  },

  productFooter: {
    flexDirection: "row",
    marginTop: 6,
    backgroundColor: "#F2F7FF",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "space-between",
    alignItems: "center",
  },

  footerItem: {
    flex: 1,
  },

  footerDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#D0E4FF",
    marginHorizontal: 12,
  },

  footerLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: "#6B7280",
  },

  footerValue: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 18,
    color: "#111827",
    marginTop: 2,
  },

  emptyBox: {
    paddingVertical: 20,
    alignItems: "center",
  },

  emptyText: {
    fontFamily: "Poppins-Medium",
    fontSize: 14,
    color: "#9AA3AF",
  },
});
