import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useReducer,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential, // Corrected from signInWithCredentail
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import * as Google from "expo-auth-session/providers/google"; // Expo Google Auth
import * as WebBrowser from "expo-web-browser"; // For browser session
import { CLIENT_ID, IOS_CLIENT_ID, ANDROID_CLIENT_ID } from "@env";

WebBrowser.maybeCompleteAuthSession(); // Complete auth session

const AuthContext = createContext({});

const initialState = {
  isLoading: true,
  userToken: null,
  user: null,
  authError: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };
    case "SET_USER_TOKEN":
      return { ...state, userToken: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, authError: action.payload };
    case "CLEAR_ERROR":
      return { ...state, authError: null };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [user, setUser] = useState(null);

  // Google Auth Request
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    redirectUri: "https://auth.expo.io/@ayoee/easyride",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        dispatch({ type: "SET_USER", payload: user });
        const token = await user.getIdToken();
        dispatch({ type: "SET_USER_TOKEN", payload: token });
        await AsyncStorage.setItem("userToken", token);
      } else {
        dispatch({ type: "SET_USER", payload: null });
        dispatch({ type: "SET_USER_TOKEN", payload: null });
        await AsyncStorage.removeItem("userToken");
      }
      dispatch({ type: "SET_LOADING", payload: false });
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(async (result) => {
          const user = result.user;
          const token = await user.getIdToken();
          dispatch({ type: "SET_USER_TOKEN", payload: token });
          dispatch({ type: "SET_USER", payload: user });
          await AsyncStorage.setItem("userToken", token);

          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (!userDoc.exists()) {
            await setDoc(doc(db, "users", user.uid), {
              email: user.email,
              displayName: user.displayName || "User",
              createdAt: new Date(),
              lastLogin: new Date(),
            });
          } else {
            await setDoc(
              doc(db, "users", user.uid),
              { lastLogin: new Date() },
              { merge: true }
            );
          }
        })
        .catch((error) => {
          dispatch({
            type: "SET_ERROR",
            payload: parseFirebaseError(error.code),
          });
        });
    }
  }, [response]);

  const signup = async (name, email, password) => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "CLEAR_ERROR" });

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      await setDoc(
        doc(db, "users", user.uid),
        {
          name,
          email,
          displayName: name, // Sync with Authentication
          createdAt: new Date(),
          lastLogin: new Date(),
        },
        { merge: true }
      );

      const token = await user.getIdToken();
      await AsyncStorage.setItem("userToken", token);
      dispatch({ type: "SET_USER_TOKEN", payload: token });
      dispatch({ type: "SET_USER", payload: { ...user, displayName: name } });
      dispatch({ type: "SET_LOADING", payload: false });
      return true;
    } catch (error) {
      console.log("Signup error:", error);
      dispatch({
        type: "SET_ERROR",
        payload: parseFirebaseError(error.code || error.message),
      });
      dispatch({ type: "SET_LOADING", payload: false });
      return false;
    }
  };

  const login = async (email, password) => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "CLEAR_ERROR" });

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const token = await user.getIdToken();
      await AsyncStorage.setItem("userToken", token);
      dispatch({ type: "SET_USER_TOKEN", payload: token });
      dispatch({ type: "SET_USER", payload: user });
      dispatch({ type: "SET_LOADING", payload: false });
      return true;
    } catch (error) {
      console.log("Login error:", error);
      dispatch({
        type: "SET_ERROR",
        payload: parseFirebaseError(error.code || error.message),
      });
      dispatch({ type: "SET_LOADING", payload: false });
      return false;
    }
  };

  const logout = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      await signOut(auth);
      await AsyncStorage.removeItem("userToken");
      dispatch({ type: "SET_USER_TOKEN", payload: null });
      dispatch({ type: "SET_USER", payload: null });
      dispatch({ type: "SET_LOADING", payload: false });
      return true;
    } catch (error) {
      console.log("Logout error:", error);
      dispatch({ type: "SET_LOADING", payload: false });
      return false;
    }
  };

  const signInWithGoogle = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "CLEAR_ERROR" });
    try {
      await promptAsync();
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: parseFirebaseError(error.code || error.message),
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const parseFirebaseError = (errorCode) => {
    // ... (unchanged, add Google-specific errors if needed)
    switch (errorCode) {
      case "auth/popup-closed-by-user":
        return "Sign-in was canceled by the user.";
      case "auth/account-exists-with-different-credential":
        return "An account already exists with a different sign-in method.";
      default:
        return "An error occurred during Google sign-in. Please try again.";
    }
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        signup,
        isLoading: state.isLoading,
        userToken: state.userToken,
        user: state.user,
        authError: state.authError,
        clearError,
        signInWithGoogle,
        promptAsync,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export const useAuth = () => useContext(AuthContext);
