// screens/LoginScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const {
    login,
    isLoading,
    authError,
    user,
    resetPassword,
    clearError,
    signInWithGoogle,
  } = useAuth();

  // Modified useEffect hook
  useEffect(() => {
    if (user) {
      navigation.replace("Home");
    }

    // Clear error when component unmounts
    return () => clearError();
  }, [user, navigation]);

  const handleLogin = async () => {
    clearError(); // Clear previous errors
    setErrorMessage(""); // Reset local error state

    if (!email || !password) {
      setErrorMessage("Please enter both email and password");
      return;
    }

    try {
      const success = await login(email, password);
      if (!success && authError) {
        handleAuthError(authError);
      }
    } catch (error) {
      setErrorMessage("Login failed. Please try again.");
    }
  };

  const handleAuthError = (errorCode) => {
    switch (errorCode) {
      case "auth/wrong-password":
      case "auth/user-not-found":
        setErrorMessage("Invalid email or password");
        break;
      case "auth/too-many-requests":
        setErrorMessage("Too many attempts. Try again later");
        break;
      default:
        setErrorMessage("Login failed. Please try again");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert(
        "Email Required",
        "Please enter your email address to reset your password."
      );
      return;
    }

    try {
      await resetPassword(email);
      Alert.alert(
        "Password Reset Email Sent",
        "Please check your email for instructions to reset your password."
      );
    } catch (error) {
      Alert.alert(
        "Password Reset Failed",
        error.message ||
          "Failed to send password reset email. Please try again later."
      );
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const user = await signInWithGoogle(); // Ensure this returns the signed-in user or success status
      if (user) {
        navigation.replace("Home"); // Redirect to the Home screen
      } else {
        Alert.alert("Google Sign-In Failed", "Please try again.");
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      Alert.alert(
        "Google Sign-In Error",
        error.message || "An error occurred. Please try again."
      );
    }
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Login to your Account</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <View style={styles.rememberContainer}>
            <TouchableOpacity
              style={[styles.checkbox, rememberMe && styles.checkedBox]}
              onPress={() => setRememberMe(!rememberMe)}
            >
              {rememberMe && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <Text>Remember me</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.signInButton,
              (!email || !password) && styles.signInButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading || !email || !password}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.signInText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Text style={styles.orText}>or continue with</Text>

          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Image
                  source={require("../assets/google-icon.png")}
                  style={styles.socialIcon}
                />
              )}
              
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate("Signup")}
            style={styles.signupLink}
          >
            <Text>Don't have an account? </Text>
            <Text style={styles.signupText}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContainer: {
    padding: 20,
    flexGrow: 1,
  },
  backButton: {
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
  },
  inputContainer: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  errorText: {
    color: "red",
    marginBottom: 15,
    textAlign: "center",
  },
  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginRight: 10,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  checkedBox: {
    backgroundColor: "#FF8C00",
    borderColor: "#FF8C00",
  },
  checkmark: {
    color: "white",
    fontSize: 12,
  },
  signInButton: {
    backgroundColor: "#FF8C00",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 20,
  },
  signInButtonDisabled: {
    backgroundColor: "#FFD8B2",
  },
  signInText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  forgotPassword: {
    alignItems: "center",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#FF8C00",
  },
  orText: {
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 25,
    marginHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  signupLink: {
    flexDirection: "row",
    justifyContent: "center",
  },
  signupText: {
    color: "#FF8C00",
    fontWeight: "600",
  },
});

export default LoginScreen;
