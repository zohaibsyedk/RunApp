import React from "react";
import { View, Button, Modal, Text } from "react-native";
import * as AuthSession from "expo-auth-session";

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
      console.log("got auth code:", code);
    }
  }, [response]);

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
          <Text style={{ fontSize: 20, marginBottom: 16 }}>
            Connect your Strava
          </Text>

          <Button
            title="Sign in with Strava"
            disabled={!request}
            onPress={() => promptAsync()}
          />
        </View>
      </View>
    </Modal>
  );
};

export default Login;