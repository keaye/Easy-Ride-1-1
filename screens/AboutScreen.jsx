import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const AboutScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Icon name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerText}>Easy</Text>
          <Text style={styles.headerTextRide}> Ride</Text>
        </View>
        <View style={{ width: 24 }} /> {/* Placeholder for alignment */}
      </View>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.aboutText}>
          "Easy Ride" represents a multifaceted concept centered on simplifying
          and enhancing the transportation experience. It extends beyond a
          single definition, encompassing various modes and technologies aimed
          at providing seamless mobility. At its core, "Easy Ride" signifies a
          move towards greater accessibility, convenience, and comfort in
          travel. "Easy Ride" embodies the pursuit of a future where
          transportation is efficient, comfortable, and readily available to
          all, adapting to diverse needs and preferences. It is about the
          simplification of movement, and making travel a less stressful and
          more enjoyable part of peoples lives.
        </Text>
      </ScrollView>
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
    padding: 20,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 5, // Add margin to bring the text down
  },
  headerTextRide: {
    color: "#FF8C00", // Orange color
    fontStyle: "italic",
    marginTop: 5, // Add margin to bring the text down
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  aboutText: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
});

export default AboutScreen;
