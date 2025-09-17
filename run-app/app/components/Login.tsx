import React from "react";
import { View, Button, Modal, Text, Alert } from "react-native";
import * as AuthSession from "expo-auth-session";
import { useAuth } from "../contexts/AuthContext";

// Constants for Strava OAuth
const stravaClientId = "177332";
const authorizationEndpoint = "https://www.strava.com/oauth/authorize";

const redirectUri = AuthSession.makeRedirectUri({
    scheme: "runapp",
    path: "strava-auth",
  });

console.log("Redirect URI:", redirectUri);

import { useAuthRequest } from "expo-auth-session";

const Login: React.FC = () => {
  const { login, setShowLoginModal } = useAuth();
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
            athleteData: data.athlete,
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
  }, [response, login]);

  const handleClose = () => {
    setShowLoginModal(false);
  };

  return (
    <Modal visible={true} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.3)",
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            padding: 24,
            borderRadius: 12,
            width: "80%",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 20, marginBottom: 16, textAlign: "center" }}>
            Connect your Strava
          </Text>
          
          <Text style={{ fontSize: 14, marginBottom: 20, textAlign: "center", color: "#666" }}>
            Sign in to track your runs and activities
          </Text>

          <Button
            title="Sign in with Strava"
            disabled={!request}
            onPress={() => promptAsync()}
          />
          
          <Button
            title="Cancel"
            onPress={handleClose}
            color="#666"
          />
        </View>
      </View>
    </Modal>
  );
};

export default Login;