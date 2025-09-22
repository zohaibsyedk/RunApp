import React from "react";
import { View, Modal, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
type Props = {
  visible: boolean;
  onClose: () => void;
};

const CreateEvent: React.FC<Props> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <TouchableOpacity accessibilityLabel="Close" onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={30} color="#ee3333" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Event</Text>
        </View>
      </View>
    </Modal>
  );
};

export default CreateEvent;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    minHeight: 500,
  },
  closeButton: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222",
    marginBottom: 12,
    paddingRight: 36,
  },
});