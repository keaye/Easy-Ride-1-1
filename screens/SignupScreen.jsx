// screens/SignupScreen.js
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

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { signup, isLoading, authError, user } = useAuth();

  // Password validation
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: "Password is too weak",
    color: "#FF3B30",
  });

  // If user is already logged in, redirect to home screen
  useEffect(() => {
    if (user) {
      navigation.replace("Home");
    }
  }, [user, navigation]);

  // Check password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength({
        score: 0,
        message: "Password is too weak",
        color: "#FF3B30",
      });
      return;
    }

    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Complexity checks
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    let message, color;

    if (score < 2) {
      message = "Password is too weak";
      color = "#FF3B30"; // Red
    } else if (score < 4) {
      message = "Password strength is moderate";
      color = "#FF9500"; // Orange
    } else {
      message = "Password is strong";
      color = "#34C759"; // Green
    }

    setPasswordStrength({ score, message, color });
  }, [password]);

  const handleSignup = async () => {
    // Validate inputs
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (passwordStrength.score < 2) {
      Alert.alert(
        "Weak Password",
        "Please use a stronger password. Include uppercase letters, numbers, and special characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    const success = await signup(name, email, password);

    if (success) {
      Alert.alert("Success", "Account created successfully. You're logged in.");
      navigation.navigate("Login"); // Redirect to login page
    } else if (authError) {
      Alert.alert("Signup Failed", authError);
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

        <Text style={styles.title}>Create a New Account</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />
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

          {password.length > 0 && (
            <View style={styles.passwordStrengthContainer}>
              <View
                style={[
                  styles.passwordStrengthBar,
                  {
                    width: `${(passwordStrength.score / 5) * 100}%`,
                    backgroundColor: passwordStrength.color,
                  },
                ]}
              />
              <Text
                style={[
                  styles.passwordStrengthText,
                  { color: passwordStrength.color },
                ]}
              >
                {passwordStrength.message}
              </Text>
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[
              styles.signUpButton,
              (!name || !email || !password || !confirmPassword) &&
                styles.signUpButtonDisabled,
            ]}
            onPress={handleSignup}
            disabled={
              isLoading || !name || !email || !password || !confirmPassword
            }
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.signUpText}>Sign up</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By signing up, you agree to our{" "}
            <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            style={styles.loginLink}
          >
            <Text>Already have an account? </Text>
            <Text style={styles.loginText}>Log in</Text>
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
  passwordStrengthContainer: {
    marginBottom: 15,
  },
  passwordStrengthBar: {
    height: 5,
    borderRadius: 3,
  },
  passwordStrengthText: {
    fontSize: 12,
    marginTop: 5,
  },
  signUpButton: {
    backgroundColor: "#FF8C00",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 10,
  },
  signUpButtonDisabled: {
    backgroundColor: "#FFD8B2",
  },
  signUpText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  termsText: {
    textAlign: "center",
    fontSize: 12,
    color: "#666",
    marginBottom: 20,
  },
  termsLink: {
    color: "#FF8C00",
    fontWeight: "500",
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
  loginLink: {
    flexDirection: "row",
    justifyContent: "center",
  },
  loginText: {
    color: "#FF8C00",
    fontWeight: "600",
  },
});

export default SignupScreen;
