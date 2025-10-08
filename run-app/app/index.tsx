import React, { useCallback, useState } from "react";
import { Text, View, ActivityIndicator, StyleSheet, TouchableOpacity, GestureResponderEvent, Alert, TextInput, ImageBackground, TouchableWithoutFeedback, Keyboard } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "./contexts/AuthContext";
import * as AuthSession from "expo-auth-session";
import { useAuthRequest } from "expo-auth-session";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { rgbaArrayToRGBAColor } from "react-native-reanimated/lib/typescript/Colors";

//firebase
import { auth } from '../firebaseConfig.js'; // Adjust path if needed
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword ,
  updateProfile
} from "firebase/auth";


type Props = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
};

//const stravaClientId = "177332";
//const authorizationEndpoint = "https://www.strava.com/oauth/authorize";

//const redirectUri = AuthSession.makeRedirectUri({
  //scheme: "runapp",
  //path: "strava-auth",
//})
//console.log("Redirect URI:", redirectUri);



const Index: React.FC<Props> = ({ title, onPress }) => {

  const { logout, isAuthenticated } = useAuth();
  const API_URL = "https://run-app-backend-179019793982.us-central1.run.app";
  //sign in form state
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User logged in!', userCredential.user);
    }
    catch (error: any) {
      console.error("Login Error:", error);
      Alert.alert('Login Failed', error.message);
    }
  }

  const handleSignUp = async () => {
    if (!firstName || !lastName || !password || !email) {
      Alert.alert('Error', 'Please enter first name, last name, password, and email.');
      return;
    }
    try {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const displayName = firstName+" "+lastName;
      await updateProfile(user, {
        displayName: displayName,
      })

      const token = await user.getIdToken();

      await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: displayName,
          photoURL: user.photoURL,
        }),
      });
      console.log('User account created & signed in!', user.displayName);
    }
    catch (error: any) {
      console.error("Sign up Error:", error);
      Alert.alert("Sign up failed:", error.message);
    } finally {
      setIsLoading(false);
    }
  }

  const [fontsLoaded] = useFonts({
    LexendBold: require("../assets/fonts/Lexend-Bold.ttf"),
    LexendRegular: require("../assets/fonts/Lexend-Regular.ttf"),
  });
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return <View style={styles.container}><ActivityIndicator size="large" color="#fff" /></View>;;
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/feed" />;
  }
  
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ImageBackground 
        source={{ uri: "https://31.media.tumblr.com/8f1f6eba7015f9bd1df78e845b58fce2/tumblr_mph68j4o901r8epnko1_400.gif"}}
        style={styles.container}
      >
        <Text style={styles.title}>Welcome to RunApp</Text>
        <Text style={styles.subtitle}>Login or Sign Up to continue</Text>
        <TouchableOpacity style={styles.button} onPress={() => {setShowSignIn(true); setShowSignUp(false);}} activeOpacity={0.7}>
          <Text style={styles.btext}>Login</Text>
        </TouchableOpacity>
        {showSignIn && 
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Login</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              placeholderTextColor="#FAF9F6"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#FAF9F6"
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleLogin}>
              <Text style={styles.submitText}>Login</Text>
            </TouchableOpacity>
          </View>
        }
        <TouchableOpacity style={styles.button} onPress={() => {setShowSignIn(false); setShowSignUp(true);}} activeOpacity={0.7}>
          <Text style={styles.btext}>Sign up</Text>
        </TouchableOpacity>
        {showSignUp &&
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Sign Up</Text>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="#FAF9F6"
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput 
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor="#FAF9F6"
              value={lastName}
              onChangeText={setLastName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              placeholderTextColor="#FAF9F6"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#FAF9F6"
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleSignUp} disabled={isLoading}>
              <Text style={styles.submitText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        }
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    justifyContent: "center",
    alignItems: "center",
    gap: "2%",
    backgroundColor: "#3C91FF",
  },
  formContainer: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    gap:"3%",
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  title: {
    fontFamily: "LexendBold",
    fontSize: 28,
    textAlign: "center",
    color: "#3E4744",
  },
  formTitle: {
    fontFamily: "LexendBold",
    fontSize: 24,
    textAlign: 'center',
    color: '#f5f5f5',
  },
  subtitle: {
    fontFamily: "LexendRegular",
    padding: 10,
    borderRadius: 15,
    fontSize: 18,
    textAlign: "center",
    color: "#373F30",
  },
  button: {
    backgroundColor: "#A0D4F2",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    boxShadow: "0px 0px 20px rgba(0, 0, 0, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    height: 60,
    width: "80%",
  },
  btext: {
    fontFamily: "LexendBold",
    color: "#fff",
    fontSize: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    color: "#555",
    paddingHorizontal: 20,
  },
  input: {
    width: 300,
    padding: 15,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ccc',
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: 'rgba(55,63,48,0.6)',
    color: '#f5f5f5',
  },
  submitButton: {
    width: 200,
    height: 50,
    borderRadius: 20,
    backgroundColor: '#477994',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontFamily: 'LexendBold',
    color: '#f5f5f5',
    fontSize: 20,
  }
});

export default Index;
