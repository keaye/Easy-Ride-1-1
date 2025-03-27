import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const PaymentScreen = ({ navigation }) => {
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [balance, setBalance] = useState(0);

  const handleAddCard = () => {
    if (!cardNumber || !expiryDate || !cvv) {
      Alert.alert("Error", "Please fill in all card details");
      return;
    }

    // Here you would typically send the card details to your backend for processing
    // For this example, we'll just update the balance and close the modal
    setBalance(balance + 1000); // Add a fixed amount to the balance for demonstration
    setShowAddCardModal(false);
    Alert.alert("Success", "Card added successfully and balance updated");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Easy Ride Balance Section */}
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Easy Ride balance</Text>
        <Text style={styles.balanceAmount}>₦{balance}</Text>
        <View style={styles.divider} />
        <Text style={styles.balanceNotAvailable}>
          Easy Ride balance is not available with this payment method
        </Text>

        {/* Balance Info and Transactions */}
        <TouchableOpacity style={styles.infoRow}>
          <Icon name="help-outline" size={22} color="#6B6B6B" />
          <Text style={styles.infoText}>What is Easy Ride balance?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoRow}>
          <Icon name="access-time" size={22} color="#6B6B6B" />
          <Text style={styles.infoText}>
            See Easy Ride balance transactions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Payment Methods Section */}
      <View style={styles.paymentMethodsContainer}>
        <Text style={styles.sectionTitle}>Payment methods</Text>

        {/* Cash Option */}
        <TouchableOpacity style={styles.paymentOption}>
          <View style={styles.paymentOptionLeft}>
            <View style={styles.cashIconContainer}>
              <MaterialCommunityIcons name="cash" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.paymentOptionText}>Cash</Text>
          </View>
          <View style={styles.radioButton}>
            <View style={styles.radioButtonInner} />
          </View>
        </TouchableOpacity>

        {/* Add Card Option */}
        <TouchableOpacity
          style={styles.paymentOption}
          onPress={() => setShowAddCardModal(true)}
        >
          <View style={styles.paymentOptionLeft}>
            <Icon name="add" size={24} color="#000000" />
            <Text style={styles.paymentOptionText}>Add debit/credit card</Text>
          </View>
        </TouchableOpacity>
      </View>


      {/* Bottom Indicator */}
      <View style={styles.bottomIndicator} />

      {/* Add Card Modal */}
      <Modal
        visible={showAddCardModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddCardModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Card</Text>
            <TextInput
              style={styles.input}
              placeholder="Card Number"
              keyboardType="numeric"
              value={cardNumber}
              onChangeText={setCardNumber}
            />
            <TextInput
              style={styles.input}
              placeholder="Expiry Date (MM/YY)"
              value={expiryDate}
              onChangeText={setExpiryDate}
            />
            <TextInput
              style={styles.input}
              placeholder="CVV"
              keyboardType="numeric"
              secureTextEntry
              value={cvv}
              onChangeText={setCvv}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddCard}>
              <Text style={styles.addButtonText}>Add Card</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddCardModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
  },
  balanceContainer: {
    backgroundColor: "#F7F7F7",
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: "#6B6B6B",
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: "600",
    color: "#6B6B6B",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 16,
  },
  balanceNotAvailable: {
    fontSize: 14,
    color: "#6B6B6B",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  infoText: {
    fontSize: 14,
    color: "#6B6B6B",
    marginLeft: 12,
  },
  paymentMethodsContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  paymentOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  cashIconContainer: {
    backgroundColor: "#4CAF50",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  paymentOptionText: {
    fontSize: 14,
    marginLeft: 12,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FF8C00", // Orange accent color
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF8C00", // Orange accent color
  },
  workProfileOption: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  workProfileText: {
    fontSize: 14,
    marginLeft: 12,
  },
  bottomIndicator: {
    width: 60,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    alignSelf: "center",
    position: "absolute",
    bottom: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: "#FF8C00",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  addButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  cancelButton: {
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    width: "100%",
  },
  cancelButtonText: {
    color: "#FF8C00",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default PaymentScreen;
