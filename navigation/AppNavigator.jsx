// navigation/AppNavigator.js
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";

// Auth Screens
import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";

// App Screens (you'll need to create these)
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import PaymentScreen from "../screens/PaymentScreen";
import AboutScreen from "../screens/AboutScreen"; 
import SupportScreen from "../screens/SupportScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Authentication navigator
const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Splash" component={SplashScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

// // Main app navigator with tabs
// const AppTabNavigator = () => (
//   <Tab.Navigator screenOptions={{ headerShown: false }}>
    
//   </Tab.Navigator>
// );

// Main navigator that handles auth state
const AppNavigator = () => {
  const { isLoading, userToken } = useAuth();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Check if the user is already logged in
    const bootstrapAsync = async () => {
      try {
        await AsyncStorage.getItem("userToken");
      } catch (e) {
        console.log("Failed to get token", e);
      }
      setInitializing(false);
    };

    bootstrapAsync();
  }, []);

  if (isLoading || initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
            <Tab.Screen name="Payment" component={PaymentScreen} /> 
            <Tab.Screen name="About" component={AboutScreen} />
            <Tab.Screen name="Support" component={SupportScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
});

export default AppNavigator;
