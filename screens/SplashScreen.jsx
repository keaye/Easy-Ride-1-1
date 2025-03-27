import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';

const SplashScreen = ({ navigation }) => {
  return (
    <ImageBackground 
      source={require('../assets/car-background.jpeg')}
      style={styles.background}
    >
      <View style={styles.container}>
        <Text style={styles.welcomeText}>welcome to</Text>
        <Text style={styles.brandText}>Easy Ride</Text>
        <Text style={styles.subtitleText}>
          The best transport booking experience for your journey effortlessly
        </Text>
        <TouchableOpacity 
          style={styles.proceedButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Proceed</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 40,
  },
  welcomeText: {
    color: 'white',
    fontSize: 24,
    marginBottom: 10,
  },
  brandText: {
    color: '#FFD700',
    fontSize: 48,
    fontFamily: 'cursive',
    marginBottom: 20,
  },
  subtitleText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 30,
  },
  proceedButton: {
    backgroundColor: '#FF8C00',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default SplashScreen;