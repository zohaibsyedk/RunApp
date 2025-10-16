import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Keyboard, TouchableOpacity } from "react-native";
import { Friendship, User } from "../types";

const Friends = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('friends');

  return (
    <Pressable style={styles.container} onPress={() => Keyboard.dismiss()}>
        <Text style={styles.title}>Friends Screen</Text>
        <Text style={styles.subtitle}>See your friends</Text>
        <TextInput 
          style={styles.searchBar}
          placeholder="Search by name..."
          placeholderTextColor="rgba(60,60,60)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'friends' && styles.activeFilter]} 
            onPress={() => setFilter('friends')}
          >
            <Text style={[styles.filterText, filter === 'friends' && styles.activeFilterText]}>Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'requests' && styles.activeFilter]} 
            onPress={() => setFilter('requests')}
          >
            <Text style={[styles.filterText, filter === 'requests' && styles.activeFilterText]}>Requests</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          {filter === 'friends' && (
            <Text style={styles.description}>Friends</Text>
          )}
          {filter === 'requests' && (
            <Text style={styles.description}>Requests</Text>
          )}
        </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#f5f5f5",
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
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
  searchBar: {
    height: 50,
    width: '100%',
    position: 'absolute',
    top: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
    color: 'rgba(60,60,60)',
  },
  filterContainer: {
    top: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  filterButton: {
      flex: 1,
      paddingVertical: 10,
      marginHorizontal: 5,
      backgroundColor: '#e0e0e0',
      borderRadius: 20,
      alignItems: 'center',
  },
  activeFilter: {
      backgroundColor: '#3498db',
  },
  filterText: {
      color: '#333',
      fontWeight: '600',
  },
  activeFilterText: {
      color: '#fff',
  },
});

export default Friends;
