import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { router } from "expo-router";

const ProfileScreen = () => {
  const { logout, getAthleteData } = useAuth();
  const [athleteName, setAthleteName] = useState<string>("User");
  const [athletePfp, setAthletePfp] = useState<string>("https://reactjs.org/logo-og.png");
  const [athleteData, setAthleteData] = useState<any>(null);

  useEffect(() => {
    loadAthleteData();
  }, []);

  const loadAthleteData = async () => {
    try {
      const data = await getAthleteData();
      if (data) {
        setAthleteData(data);
        if (data.firstname) {
          setAthleteName(data.firstname);
        }
        if (data.profile) {
          setAthletePfp(data.profile);
        }
      }
    } catch (error) {
      console.error('Error getting athlete data:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
            onPress: async () => {
              await logout();
              // Navigate to root index page
              router.replace("/");
            },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your account</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Image source={{uri: athletePfp}} style={{width: 80, height: 80, borderRadius: 40}} />
          </View>
          <Text style={styles.userName}>{athleteName}</Text>
          <Text style={styles.userEmail}>Connected via Strava</Text>
        </View>
        
        <View style={styles.settings}>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Account Settings</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Privacy</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Notifications</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Help & Support</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  settings: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingText: {
    fontSize: 16,
    color: "#333",
  },
  settingArrow: {
    fontSize: 18,
    color: "#ccc",
  },
  logoutButton: {
    backgroundColor: "#ff4444",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ProfileScreen;
