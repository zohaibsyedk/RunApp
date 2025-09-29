import React, { useCallback } from "react";
import { Text, View, ActivityIndicator, StyleSheet, TouchableOpacity, GestureResponderEvent, Alert } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "./contexts/AuthContext";
import * as AuthSession from "expo-auth-session";
import { useAuthRequest } from "expo-auth-session";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";


type Props = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
};

const stravaClientId = "177332";
const authorizationEndpoint = "https://www.strava.com/oauth/authorize";

const redirectUri = AuthSession.makeRedirectUri({
  scheme: "runapp",
  path: "strava-auth",
})
console.log("Redirect URI:", redirectUri);



const Index: React.FC<Props> = ({ title, onPress }) => {

  const [fontsLoaded] = useFonts({
    LexendBold: require("../assets/fonts/Lexend-Bold.ttf"),
    LexendRegular: require("../assets/fonts/Lexend-Regular.ttf"),
  });
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  const { login, isAuthenticated } = useAuth();
    const [request, response, promptAsync] = useAuthRequest(
      {
        clientId: stravaClientId,
        redirectUri,
        scopes: ["activity:read_all"],
        responseType: AuthSession.ResponseType.Code,
      },
      { authorizationEndpoint }
    );

  React.useEffect(() => {
      if (response?.type === "success" && response.params.code) {
        const { code } = response.params;
        const backendUrl = "https://run-app-backend-179019793982.us-central1.run.app/strava/exchange";
      
        (async () => {
          try {
            const res = await fetch(backendUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                code,
                redirectUri, // the one you already compute above
              }),
            });
            const data = await res.json();
            if (!res.ok) {
              console.error("Exchange failed:", data);
              Alert.alert("Login Failed", "Unable to authenticate with Strava. Please try again.");
              console.log("fail point 1", data)
              return;
            }
            console.log("Tokens:", data);
            
            // Validate that we have the required tokens
            if (!data.accessToken || !data.refreshToken) {
              console.error("Missing tokens in response:", data);
              Alert.alert("Login Failed", "Invalid response from server. Please try again.");
              return;
            }
            
            // Save tokens using the auth context
            await login({
              accessToken: String(data.accessToken),
              refreshToken: String(data.refreshToken),
              athleteData: JSON.stringify(data.athlete),
            });
            
          } catch (e) {
            console.error("Network error:", e);
            Alert.alert("Network Error", "Unable to connect to the server. Please check your internet connection.");
          }
        })();
      } else if (response?.type === "error") {
        console.error("Auth error:", response.error);
        Alert.alert("Authentication Error", "Login was cancelled or failed. Please try again.");
      }
    }, [response]);
  
  if (!fontsLoaded) return <View style={styles.container}><ActivityIndicator size="large" color="#fff" /></View>;;
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/homescreen" />;
  }
    
  
  return (
    <LinearGradient colors={['#4786d9','#5428d7']} start={{ x: 0.2, y: 0.2}} end={{ x: 0.8, y: 0.7 }} style={styles.container} onLayout={onLayoutRootView}>
      <Text style={styles.title}>Welcome to RunApp</Text>
      <Text style={styles.subtitle}>Sign in with Strava to continue</Text>
      <TouchableOpacity style={styles.button} onPress={() => promptAsync()} activeOpacity={0.7}>
        <Text style={styles.btext}>Continue to Strava</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    gap: "2%",
    backgroundColor: "#3C91FF",
  },
  title: {
    fontFamily: "LexendBold",
    fontSize: 28,
    textAlign: "center",
    color: "#f5f5f5",
  },
  subtitle: {
    fontFamily: "LexendRegular",
    fontSize: 18,
    textAlign: "center",
    color: "#f5f5f5",
  },
  button: {
    backgroundColor: "#FC4C02",
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
});

export default Index;
