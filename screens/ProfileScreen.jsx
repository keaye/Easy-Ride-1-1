import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import CountryPicker from "react-native-country-picker-modal";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; // Adjust the import path as necessary

const ProfileScreen = ({ navigation }) => {
  const { logout, user: currentUser } = useAuth();
  const nav = useNavigation();
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState({
    name: "",
    phone: "",
    email: "",
    language: "English - US",
  });
  const [selectedLanguage, setSelectedLanguage] = useState(user.language);
  const [countryCode, setCountryCode] = useState("NG");
  const [callingCode, setCallingCode] = useState("234");

  const languages = [
    "English - US",
    "Spanish",
    "Chinese",
    "Hindi",
    "Arabic",
    "Portuguese",
    "Bengali",
    "Russian",
    "Japanese",
    "Punjabi",
  ];

  useEffect(() => {
    if (currentUser) {
      const fetchUserData = async () => {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("Fetched user data:", userData);
          console.log("Current user display name:", currentUser.displayName);
          setUser({
            name: currentUser.displayName || userData.name || "",
            phone: userData.phone || currentUser.phoneNumber || "",
            email: currentUser.email || "",
            language: userData.language || "English - US",
          });
          setSelectedLanguage(userData.language || "English - US");
        }
      };

      fetchUserData();
    }
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) {
      console.error("No user is currently logged in.");
      return;
    }

    try {
      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          phone: user.phone,
          language: selectedLanguage,
        },
        { merge: true }
      );
      setUser({ ...user, language: selectedLanguage });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving user details: ", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(true)}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={32} color="#999" />
          </View>

          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userPhone}>{user.phone}</Text>

          <View style={styles.emailContainer}>
            <MaterialIcons name="email" size={22} color="#666" />
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <Text style={styles.languageText}>{user.language}</Text>
        </View>

        {/* Communication Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Communication preferences</Text>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.optionItem} onPress={logout}>
            <MaterialIcons name="logout" size={24} color="#666" />
            <Text style={styles.optionText}>Log out</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.optionItem}>
            <MaterialIcons name="delete-outline" size={24} color="#666" />
            <Text style={styles.optionText}>Delete account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditing} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setIsEditing(false)}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.phoneContainer}>
                <CountryPicker
                  countryCode={countryCode}
                  withFilter
                  withFlag
                  withCallingCode
                  withEmoji
                  onSelect={(country) => {
                    setCountryCode(country.cca2);
                    setCallingCode(country.callingCode[0]);
                  }}
                />
                <Text style={styles.callingCode}>+{callingCode}</Text>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Phone"
                  value={user.phone.replace(`+${callingCode}`, "")}
                  onChangeText={(text) =>
                    setUser({ ...user, phone: `+${callingCode}${text}` })
                  }
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Language</Text>
                <Picker
                  selectedValue={selectedLanguage}
                  onValueChange={(itemValue) => setSelectedLanguage(itemValue)}
                >
                  {languages.map((language, index) => (
                    <Picker.Item
                      key={index}
                      label={language}
                      value={language}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  editButton: {
    padding: 4,
  },
  editButtonText: {
    fontSize: 16,
    color: "#FF8C00", // Orange accent color
    fontWeight: "500",
  },
  saveButton: {
    padding: 4,
  },
  saveButtonText: {
    fontSize: 16,
    color: "#FF8C00", // Orange accent color
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  profileInfo: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  userName: {
    fontSize: 22,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
    marginLeft: 8,
  },
  section: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionText: {
    marginLeft: 16,
    fontSize: 16,
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginLeft: 56,
  },
  languageText: {
    fontSize: 16,
    color: "#666",
    paddingHorizontal: 16,
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 16,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  callingCode: {
    fontSize: 16,
    color: "#666",
    marginLeft: 8,
    marginRight: 8,
  },
  pickerContainer: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
});

export default ProfileScreen;
