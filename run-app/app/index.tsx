import React from "react";
import { Text, View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "./contexts/AuthContext";
import LoginModal from "./components/Login";

const Index = () => {
  const { isAuthenticated, isLoading, showLoginModal } = useAuth();
  console.log('Rendering Index - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Loading...</Text>
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Welcome to RunApp</Text>
      <Text style={{ fontSize: 16, textAlign: "center", marginBottom: 20 }}>
        Please sign in with Strava to continue
      </Text>
      {showLoginModal && <LoginModal />}
    </View>
  );
};

export default Index;