import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
  Modal,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import MapView, { PROVIDER_GOOGLE, Circle, Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import * as Location from "expo-location";

const HomeScreen = ({ navigation }) => {
  const { user: currentUser } = useAuth();
  const nav = useNavigation();
  const [region, setRegion] = useState({
    latitude: 7.2906,
    longitude: 5.1368,
    latitudeDelta: 0.0122,
    longitudeDelta: 0.0121,
  });
  const [showRideSelection, setShowRideSelection] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [selectedPickup, setSelectedPickup] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("");
  const [activeSelection, setActiveSelection] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [recentLocations, setRecentLocations] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [multipleDestinations, setMultipleDestinations] = useState([]);
  const [pickupSearchText, setPickupSearchText] = useState("");
  const [pickupSearchResults, setPickupSearchResults] = useState([]);
  const [currentLocationName, setCurrentLocationName] = useState("");

  const [user, setUser] = useState({
    name: "",
  });

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
          });
        }
      };

      fetchUserData();
    }
  }, [currentUser]);

  const searchNearbyPlaces = async (searchText, location) => {
    try {
      // Don't make API calls for very short search terms
      if (searchText.length < 3) {
        return [];
      }

      // Build the Nominatim API URL
      // Using viewbox to search in an area around the current location
      // The viewbox is a bounding box defined by [min longitude, min latitude, max longitude, max latitude]
      const delta = 0.05; // Roughly 5km at the equator
      const viewbox = [
        location.longitude - delta,
        location.latitude - delta,
        location.longitude + delta,
        location.latitude + delta,
      ].join(",");

      const apiUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        searchText
      )}&format=json&addressdetails=1&limit=5&viewbox=${viewbox}&bounded=1`;

      // Add a short delay to avoid hitting rate limits
      await new Promise((resolve) => setTimeout(resolve, 300));

      const response = await fetch(apiUrl, {
        headers: {
          // It's good practice to include a user-agent with your app name
          // OpenStreetMap may block requests without proper identification
          "User-Agent": "EasyRide-App/1.0",
          "Accept-Language": "en", // Prefer English results
        },
      });

      if (!response.ok) {
        throw new Error(`OpenStreetMap API error: ${response.status}`);
      }

      const data = await response.json();

      // Transform the response to match our app's data structure
      return data.map((item) => {
        // Determine icon based on the type of place
        let icon = "location";
        if (item.type === "restaurant" || item.category === "restaurant") {
          icon = "restaurant";
        } else if (item.type === "hospital" || item.category === "hospital") {
          icon = "medkit";
        } else if (item.type === "school" || item.category === "education") {
          icon = "school";
        } else if (item.type === "park" || item.category === "leisure") {
          icon = "leaf";
        }

        return {
          name: item.name || item.display_name.split(",")[0],
          description: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          icon: icon,
        };
      });
    } catch (error) {
      console.error("Error fetching places from OpenStreetMap:", error);
      // Fallback to mock data in case of API failure
      return mockSearchNearbyPlaces(searchText, location);
    }
  };

  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      // Use OpenStreetMap's reverse geocoding API
      const apiUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;

      const response = await fetch(apiUrl, {
        headers: {
          "User-Agent": "EasyRide-App/1.0",
          "Accept-Language": "en",
        },
      });

      if (!response.ok) {
        throw new Error(
          `OpenStreetMap reverse geocoding error: ${response.status}`
        );
      }

      const data = await response.json();

      if (data && data.address) {
        const address = data.address;
        const formattedAddress = [
          address.road,
          address.suburb,
          address.city || address.town || address.village,
          address.postcode,
        ]
          .filter(Boolean)
          .join(", ");

        return formattedAddress || data.display_name || "Current Location";
      }
      return "Current Location";
    } catch (error) {
      console.error("Error in reverse geocoding:", error);
      // Fallback to expo-location if available
      try {
        const location = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (location && location[0]) {
          const address = location[0];
          const formattedAddress = `${address.street || ""} ${
            address.city || ""
          } ${address.postalCode ? `${address.postalCode}` : ""}`;
          return formattedAddress.trim();
        }
      } catch (expoCatchError) {
        console.error("Error with expo-location fallback:", expoCatchError);
      }

      return "Current Location";
    }
  };

  // Fetch user's current location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0122,
        longitudeDelta: 0.0121,
      };
      setUserLocation(locationData);
      setRegion(locationData);

      // Get address from coordinates
      updateCurrentLocationName();
    })();
  }, []);

  // // Fetch recent locations from Firestore
  // useEffect(() => {
  //   const fetchRecentLocations = async () => {
  //     try {
  //       const querySnapshot = await getDocs(collection(db, "recentLocations"));
  //       const locations = querySnapshot.docs.map((doc) => doc.data());
  //       if (locations.length > 0) {
  //         setRecentLocations(locations);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching recent locations:", error);
  //       // If Firestore fetch fails, we'll use the mock data set in the location effect
  //     }
  //   };

  //   fetchRecentLocations();
  // }, []);

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
          });
        }
      };

      fetchUserData();
    }
  }, [currentUser]);

  const updateCurrentLocationName = async () => {
    if (userLocation) {
      const address = await getAddressFromCoordinates(
        userLocation.latitude,
        userLocation.longitude
      );
      setCurrentLocationName(address);
    }
  };

  const handleCompassPress = () => {
    if (userLocation) {
      // Explicitly set a new region object to ensure React Native detects the change
      const newRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0122,
        longitudeDelta: 0.0121,
      };

      // Update the region state
      setRegion(newRegion);

      // Optional: Add animation for smoother transition
      if (mapRef && mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 500);
      }
    }
  };
  const mapRef = useRef(null);

  // Animation for panel swiping
  const panelHeight = useRef(new Animated.Value(0)).current;
  const maxPanelHeight = 400; // Maximum height when fully expanded

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy < 0) {
          // Swiping up
          Animated.timing(panelHeight, {
            toValue: Math.min(-gestureState.dy, maxPanelHeight),
            duration: 0,
            useNativeDriver: false,
          }).start();
        } else {
          // Swiping down
          Animated.timing(panelHeight, {
            toValue: Math.max(-gestureState.dy, 0),
            duration: 0,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy < -10) {
          // Swipe up to open
          Animated.timing(panelHeight, {
            toValue: maxPanelHeight,
            duration: 300,
            useNativeDriver: false,
          }).start();
        } else if (gestureState.dy > 10) {
          // Swipe down to close
          Animated.timing(panelHeight, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const panResponderMenu = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx < -50) {
          // Swipe left threshold
          setShowMenu(false);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -50) {
          // Swipe left threshold
          setShowMenu(false);
        }
      },
    })
  ).current;

  const rides = [
    { type: "Toyota Camry", capacity: "Black", price: 500 },
    { type: "Lexus ES 350", capacity: "Gray", price: 600 },
  ];

  const handleLocationSelect = (location, type) => {
    if (type === "pickup") {
      setSelectedPickup(location.name);
      setPickupSearchText(location.name);
      // Update map to show pickup location
      if (location.latitude && location.longitude) {
        setRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.0122,
          longitudeDelta: 0.0121,
        });
      }
    } else {
      setSelectedDestination(location.name);
      setSearchText(location.name);
      // Update map to show destination location
      if (location.latitude && location.longitude) {
        setRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.0122,
          longitudeDelta: 0.0121,
        });
      }
    }

    // If both pickup and destination are selected, show ride selection
    if (
      (type === "pickup" && selectedDestination) ||
      (type === "destination" && selectedPickup)
    ) {
      setShowRideSelection(true);
    }

    setActiveSelection(null);
    // Clear search results after selection
    setPickupSearchResults([]);
    setSearchResults([]);
  };

  const handleMapButtonPress = (type) => {
    setActiveSelection(type);
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const handlePickupSearch = async (text) => {
    setPickupSearchText(text);
    if (text.length > 2) {
      const results = await searchNearbyPlaces(text, region);
      setPickupSearchResults(results);
    } else {
      setPickupSearchResults([]);
    }
  };

  const handleDestinationSearch = async (text) => {
    setSearchText(text);
    if (text.length > 2) {
      const results = await searchNearbyPlaces(text, region);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  // Add the code to display predefined rides once the destination and pickup are selected

  const renderRideOptions = () => {
    if (!showRideSelection) return null;

    return (
      <View style={styles.rideOptionsContainer}>
        {rides.map((ride, index) => (
          <TouchableOpacity
            key={index}
            style={styles.rideOption}
            onPress={() => setSelectedRide(ride)}
          >
            <Text style={styles.rideOptionText}>{ride.type}</Text>
            <Text style={styles.rideOptionText}>{ride.capacity}</Text>
            <Text style={styles.rideOptionText}>₦{ride.price}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Your existing render methods...
  const renderMenuPanel = () => {
    // Use currentUser.displayName or fallback to email if displayName is not available

    return (
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMenu(false)}
      >
        <View
          style={styles.menuModalContainer}
          {...panResponderMenu.panHandlers}
        >
          <View style={styles.menuPanel}>
            {/* User Profile Section */}
            <View style={styles.userProfileSection}>
              <View style={styles.userAvatar}>
                <Ionicons name="person-outline" size={40} color="#777" />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <TouchableOpacity onPress={() => nav.navigate("Profile")}>
                  <Text style={styles.viewProfile}>View profile</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Menu Items */}
            <View style={styles.menuItems}>
              <TouchableOpacity style={styles.menuItem}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name="card-outline" size={24} color="#555" />
                </View>
                <TouchableOpacity onPress={() => nav.navigate("Payment")}>
                  <Text style={styles.menuItemText}>Payment</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name="help-circle-outline" size={24} color="#555" />
                </View>
                <TouchableOpacity onPress={() => nav.navigate("Support")}>
                  <Text style={styles.menuItemText}>Support</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <View style={styles.menuIconContainer}>
                  <Ionicons
                    name="information-circle-outline"
                    size={24}
                    color="#555"
                  />
                </View>
                <TouchableOpacity onPress={() => nav.navigate("About")}>
                  <Text style={styles.menuItemText}>About</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>

            {/* Become a driver banner */}
            {/* <View style={styles.driverBanner}>
              <View style={styles.driverBannerContent}>
                <Text style={styles.driverBannerTitle}>Become a driver</Text>
                <Text style={styles.driverBannerSubtext}>
                  Earn money on your schedule
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBannerButton}>
                <Ionicons name="close" size={20} color="#555" />
              </TouchableOpacity>
            </View> */}
          </View>
        </View>
      </Modal>
    );
  };

  const renderLocationSelector = () => {
    if (!activeSelection) return null;

    return (
      <View style={styles.locationSelectorOverlay}>
        <View style={styles.locationSelector}>
          <View style={styles.locationSelectorHeader}>
            <Text style={styles.locationSelectorTitle}>
              Select{" "}
              {activeSelection === "pickup" ? "pickup point" : "destination"}
            </Text>
            <TouchableOpacity onPress={() => setActiveSelection(null)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.locationList}>
            {userLocation && (
              <TouchableOpacity
                style={styles.locationItem}
                onPress={() =>
                  handleLocationSelect(
                    {
                      name: "Current Location",
                      description:
                        currentLocationName || "Your current location",
                      ...userLocation,
                    },
                    activeSelection
                  )
                }
              >
                <View style={styles.locationMarker}>
                  <Ionicons
                    name="location"
                    size={20}
                    color={activeSelection === "pickup" ? "#FF8C00" : "#FF8C00"}
                  />
                </View>
                <View style={styles.locationDetails}>
                  <Text style={styles.locationName}>Current Location</Text>
                  <Text style={styles.locationDesc}>
                    {currentLocationName || "Your current location"}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            {recentLocations.map((location, index) => (
              <TouchableOpacity
                key={index}
                style={styles.locationItem}
                onPress={() => handleLocationSelect(location, activeSelection)}
              >
                <View style={styles.locationMarker}>
                  <Ionicons
                    name={location.icon || "location"}
                    size={20}
                    color={activeSelection === "pickup" ? "#FF8C00" : "#FF8C00"}
                  />
                </View>
                <View style={styles.locationDetails}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <Text style={styles.locationDesc}>
                    {location.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderRideSelection = () => {
    if (!showRideSelection) return null;

    return (
      <Animated.View
        style={[
          styles.rideSelectionContainer,
          {
            marginTop: Animated.add(
              panelHeight,
              new Animated.Value(-maxPanelHeight)
            ),
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.rideSelectionContent}>
          <View style={styles.dragIndicator} />

          <View style={styles.routeContainer}>
            <View style={styles.routeHeaderContainer}>
              <TouchableOpacity onPress={() => setShowRideSelection(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.routeHeaderText}>Your route</Text>
              <Ionicons name="star" size={24} color="#000" />
            </View>
            <View style={styles.routePointsContainer}>
              <View style={styles.destinationSearchContainer}>
                <Ionicons name="search" size={20} color="#777" />
                <TextInput
                  style={styles.destinationInput}
                  placeholder="Pickup location"
                  value={pickupSearchText}
                  onChangeText={handlePickupSearch}
                  placeholderTextColor="#777"
                />
                <TouchableOpacity
                  style={styles.destinationMapButton}
                  onPress={() => handleMapButtonPress("pickup")}
                >
                  <Ionicons name="map" size={20} color="#FF8C00" />
                </TouchableOpacity>
              </View>

              <View
                style={[styles.destinationSearchContainer, { marginTop: 10 }]}
              >
                <Ionicons name="search" size={20} color="#777" />
                <TextInput
                  style={styles.destinationInput}
                  placeholder="Destination"
                  value={searchText}
                  onChangeText={handleDestinationSearch}
                  placeholderTextColor="#777"
                />
                <TouchableOpacity
                  style={styles.destinationMapButton}
                  onPress={() => handleMapButtonPress("destination")}
                >
                  <Ionicons name="map" size={20} color="#FF8C00" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {(pickupSearchResults.length > 0 || searchResults.length > 0) && (
            <ScrollView style={styles.searchResultsContainer}>
              {pickupSearchText && pickupSearchResults.length > 0
                ? pickupSearchResults.map((result, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.searchResultItem}
                      onPress={() => {
                        handleLocationSelect(result, "pickup");
                      }}
                    >
                      <Ionicons
                        name={result.icon || "location"}
                        size={20}
                        color="#FF8C00"
                      />
                      <View style={styles.searchResultTextContainer}>
                        <Text style={styles.searchResultName}>
                          {result.name}
                        </Text>
                        <Text style={styles.searchResultDescription}>
                          {result.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                : searchResults.map((result, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.searchResultItem}
                      onPress={() => {
                        handleLocationSelect(result, "destination");
                      }}
                    >
                      <Ionicons
                        name={result.icon || "location"}
                        size={20}
                        color="#FF8C00"
                      />
                      <View style={styles.searchResultTextContainer}>
                        <Text style={styles.searchResultName}>
                          {result.name}
                        </Text>
                        <Text style={styles.searchResultDescription}>
                          {result.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
            </ScrollView>
          )}

          {multipleDestinations.length > 0 && (
            <View style={styles.multipleDestinationsContainer}>
              {multipleDestinations.map((dest, index) => (
                <View key={index} style={styles.routePoint}>
                  <View style={styles.routePointDot}>
                    <View
                      style={[styles.orangeDot, { backgroundColor: "#4B0082" }]}
                    />
                  </View>
                  <Text style={styles.routePointText}>{dest.name}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.recentRoutesContainer}>
            {recentLocations.map((location, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentRouteItem}
                onPress={() => handleLocationSelect(location, "destination")}
              >
                <View style={styles.recentRouteIcon}>
                  <Ionicons
                    name={location.icon || "location"}
                    size={20}
                    color="#777"
                  />
                </View>
                <View style={styles.recentRouteDetails}>
                  <Text style={styles.recentRouteName}>{location.name}</Text>
                  <Text style={styles.recentRouteDescription}>
                    {location.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.indicatorBar} />

          {/* Render ride options */}
          {renderRideOptions()}
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Map View - Full Screen */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
        >
          <Circle
            center={region}
            radius={1000}
            fillColor="rgba(255, 140, 0, 0.2)"
            strokeColor="rgba(255, 140, 0, 0.3)"
          />
          {userLocation && (
            <Marker
              coordinate={userLocation}
              title="Your Location"
              description="This is where you are"
            />
          )}
        </MapView>
      </View>

      {/* Header - Logo centered */}
      <View style={styles.header}>
        <View style={styles.menuButtonContainer}>
          <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
            <Ionicons name="menu-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Easy</Text>
          <Text style={styles.logoTextItalic}>Ride</Text>
        </View>
        <View style={styles.placeholderForBalance}></View>
      </View>

      {/* Google and Compass */}
      <View style={styles.googleCompassContainer}>
        <Text style={styles.googleText}>Google</Text>
        <TouchableOpacity onPress={handleCompassPress}>
          <Ionicons name="compass-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Bottom Panel */}
      {!showRideSelection && (
        <View style={styles.recentDestinationsPanel}>
          {/* Search Bar inside panel */}
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => setShowRideSelection(true)}
          >
            <Ionicons name="search" size={20} color="#000" />
            <Text style={styles.searchText}>Where to?</Text>
          </TouchableOpacity>

          {/* Recent Destinations */}
          {recentLocations.slice(0, 3).map((location, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recentDestItem}
              onPress={() => handleLocationSelect(location, "destination")}
            >
              <Ionicons
                name={location.icon || "location"}
                size={20}
                color="#666"
              />
              <View style={styles.recentDestText}>
                <Text style={styles.recentDestTitle}>{location.name}</Text>
                <Text style={styles.recentDestDescription}>
                  {location.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          <View style={styles.indicatorBar} />
        </View>
      )}

      {/* Ride selection overlay */}
      {renderRideSelection()}

      {/* Location selector overlay */}
      {renderLocationSelector()}

      {/* Menu panel */}
      {renderMenuPanel()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "transparent",
    position: "absolute",
    top: 3, // Adjusted to bring down the header
    left: 0,
    right: 0,
    zIndex: 10,
  },
  menuButtonContainer: {
    width: 40,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "orange",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 9,
  },
  placeholderForBalance: {
    width: 40,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    textShadowColor: "rgba(255, 255, 255, 0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  logoTextItalic: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FF8C00",
    fontStyle: "italic",
    textShadowColor: "rgba(255, 255, 255, 0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  mapContainer: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  searchBar: {
    backgroundColor: "#f5f5f5",
    borderRadius: 30,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 15,
  },
  searchText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#777",
  },
  recentDestinationsPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 5,
  },
  recentDestItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  recentDestText: {
    marginLeft: 15,
  },
  recentDestTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  recentDestDescription: {
    color: "#777",
    fontSize: 14,
    marginTop: 2,
  },
  indicatorBar: {
    width: 0,
    height: 5,
    backgroundColor: "#e0e0e0",
    borderRadius: 2.5,
    alignSelf: "center",
    marginTop: 10,
  },
  // Ride Selection Styles
  rideSelectionContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    height: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 20,
  },
  rideSelectionContent: {
    padding: 5,
    height: "100%",
  },
  dragIndicator: {
    width: 50,
    height: 5,
    backgroundColor: "#e0e0e0",
    borderRadius: 2.5,
    alignSelf: "center",
    marginVertical: 10,
  },
  routeContainer: {
    padding: 10,
  },
  routeHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  routeHeaderText: {
    fontSize: 19,
    fontWeight: "900",
  },
  routePointsContainer: {
    marginBottom: 10,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  routePointDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  orangeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF8C00",
  },
  routePointText: {
    fontSize: 15,
  },
  destinationSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#FF8C00",
    borderRadius: 30,
    backgroundColor: "#fff",
  },
  destinationPlaceholder: {
    marginLeft: 10,
    color: "#777",
    flex: 1,
  },
  destinationMapButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  recentRoutesContainer: {
    marginTop: 10,
  },
  recentRouteItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  recentRouteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  recentRouteDetails: {
    flex: 1,
  },
  recentRouteName: {
    fontSize: 16,
    fontWeight: "500",
  },
  recentRouteDescription: {
    color: "#777",
    fontSize: 14,
    marginTop: 2,
  },
  // Location Selector Styles
  locationSelectorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
    zIndex: 20,
  },
  locationSelector: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: "70%",
  },
  locationSelectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  locationSelectorTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  locationList: {
    maxHeight: 400,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  locationMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  locationDetails: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "500",
  },
  locationDesc: {
    color: "#777",
    fontSize: 14,
  },
  googleCompassContainer: {
    position: "absolute",
    bottom: 140, // Position it just above the recent destinations panel
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 9,
  },
  googleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginRight: 10,
    position: "relative",
  },
  // Menu Panel Styles
  menuModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  menuPanel: {
    width: "85%",
    height: "100%",
    backgroundColor: "#fff",
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    paddingVertical: 20,
  },
  userProfileSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 5,
  },
  viewProfile: {
    color: "orange",
    fontSize: 16,
  },
  menuItems: {
    paddingTop: 15,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  menuIconContainer: {
    width: 30,
    alignItems: "center",
    marginRight: 20,
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemSubtext: {
    fontSize: 14,
    color: "#777",
    marginTop: 3,
  },
  driverBanner: {
    backgroundColor: "orange",
    margin: 20,
    marginTop: 40,
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  driverBannerContent: {
    flex: 1,
  },
  driverBannerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  driverBannerSubtext: {
    fontSize: 14,
    color: "#777",
    marginTop: 5,
  },
  closeBannerButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  closeMenuButton: {
    alignItems: "center",
    marginTop: 50,
  },
  closeButtonLine: {
    width: 40,
    height: 5,
    backgroundColor: "#e0e0e0",
    borderRadius: 2.5,
  },
  destinationInput: {
    flex: 1,
    marginLeft: 10,
    color: "#000",
  },
  searchResultsContainer: {
    maxHeight: 200,
    marginTop: 10,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  searchResultTextContainer: {
    marginLeft: 10,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: "500",
  },
  searchResultDescription: {
    color: "#777",
    fontSize: 14,
    marginTop: 2,
  },
  // Add to the styles object
  destinationInput: {
    flex: 1,
    marginLeft: 10,
    color: "#333",
    fontSize: 16,
  },
  searchResultsContainer: {
    maxHeight: 200,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  searchResultTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: "500",
  },
  searchResultDescription: {
    fontSize: 14,
    color: "#777",
  },
  multipleDestinationsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  rideOptionsContainer: {
    padding: 10,
  },
  rideOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  rideOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
});

export default HomeScreen;
