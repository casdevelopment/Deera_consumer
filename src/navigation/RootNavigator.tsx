import React, { useEffect, useState } from "react";
import { Image } from "react-native";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import HomeScreen from "../screens/HomeScreen";
import MilkScreen from "../screens/MilkScreen";
import PaymentHistoryScreen from "../screens/PaymentHistoryScreen";
import AddPaymentScreen from "../screens/AddPaymentScreen";
import HomeIcon from "../assets/svgs/home.svg";
import HomeActiveIcon from "../assets/svgs/home-active.svg";
import MilkIcon from "../assets/svgs/milkbox.svg";
import MilkActiveIcon from "../assets/svgs/milkbox-active.svg";
import PaymentIcon from "../assets/svgs/paymentcard.svg";
import PaymentActiveIcon from "../assets/svgs/paymentcard-active.svg";

import { getToken } from "../utils/storage";

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  MainTabs: undefined;
  AddPayment: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs({ onLogout }: { onLogout: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#1E63D6",
        tabBarInactiveTintColor: "#A3A9B3",
        tabBarStyle: {
          height: 66,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          backgroundColor: "#FFFFFF",
        },

        tabBarIcon: ({ focused }) => {
          if (route.name === "Home") {
            return focused ? (
              <HomeActiveIcon width={22} height={22} />
            ) : (
              <HomeIcon width={22} height={22} />
            );
          }

          if (route.name === "Milk") {
            return focused ? (
              <MilkActiveIcon width={22} height={22} />
            ) : (
              <MilkIcon width={22} height={22} />
            );
          }

          if (route.name === "Payment") {
            return focused ? (
              <PaymentActiveIcon width={22} height={22} />
            ) : (
              <PaymentIcon width={22} height={22} />
            );
          }

          return null;
        },
      })}
    >
      {/* ✅ pass onLogout to HomeScreen */}
      <Tab.Screen name="Home">
        {(props) => <HomeScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>

      <Tab.Screen name="Milk" component={MilkScreen} />
      <Tab.Screen name="Payment" component={PaymentHistoryScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const boot = async () => {
      try {
        const token = await getToken();
        setIsAuthed(!!token);
      } finally {
        setBooting(false);
      }
    };
    boot();
  }, []);

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthed ? (
          <>
            <Stack.Screen name="Login">
              {(props) => (
                <LoginScreen {...props} onLogin={() => setIsAuthed(true)} />
              )}
            </Stack.Screen>

            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs">
              {(props) => (
                <MainTabs
                  {...props}
                  onLogout={() => setIsAuthed(false)} // ✅ switch back to Login stack
                />
              )}
            </Stack.Screen>

            <Stack.Screen
              name="AddPayment"
              component={AddPaymentScreen}
              options={{ presentation: "card" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
