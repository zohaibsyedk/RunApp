import React from "react";
import { View, Text, StyleSheet } from "react-native";
const Friends = () => {

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Friends Screen</Text>
      <Text style={styles.subtitle}>See your friends</Text>
      
      <View style={styles.content}>
        <Text style={styles.description}>
          Whatever
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#333335",
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
    color: "#F2F0EF",
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
    color: "#DDDDDD",
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
    color: "#DDDDDD",
    paddingHorizontal: 20,
  },
});

export default Friends;
