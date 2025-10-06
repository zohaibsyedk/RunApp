import React, { useEffect, useState } from "react";
import { View, Modal, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from "../contexts/AuthContext";
type Props = {
  visible: boolean;
  onClose: () => void;
};

const CreateEvent: React.FC<Props> = ({ visible, onClose }) => {
  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [plannedRoute, setPlannedRoute] = useState("");
  const [creating, setCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [creatorId, setCreatorId] = useState<string | undefined>(undefined);


  const API_URL = "https://run-app-backend-179019793982.us-central1.run.app";

  const handleCreate = async () => {
    if (!eventName || !date) {
      Alert.alert("Missing info", "Please enter event name and pick a start time." );
      return;
    }
    try {
      setCreating(true);
      const resp = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName, scheduledDateTime: date.toISOString(), plannedRoute, creatorId }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || 'Failed to create event');
      }
      setShareUrl(data.shareableLinkId);
      Alert.alert('Event Created', `Share link:\n${data.shareableLinkId}`);
      onClose();
      setEventName("");
      setPlannedRoute("");
    } catch (e:any) {
      Alert.alert('Error', e.message || 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const onChangeDate = (_: any, selected?: Date) => {
    setShowDate(false);
    if (selected) setDate(selected);
  };
  const onChangeTime = (_: any, selected?: Date) => {
    setShowTime(false);
    if (selected) setDate(prev => {
      const base = selected || prev;
      const merged = new Date(prev);
      merged.setHours(base.getHours(), base.getMinutes(), 0, 0);
      return merged;
    });
  };
  const copyShare = async () => {
    if (shareUrl) {
      await Clipboard.setStringAsync(shareUrl);
      Alert.alert('Copied', 'Share link copied to clipboard');
    }
  };
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
            <TouchableOpacity accessibilityLabel="Close" onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={30} color="#ee3333" />
            </TouchableOpacity>
            <Text style={styles.title}>Create Event</Text>
            <Text style={styles.subtitle}>Fill out the required fields to create a race</Text>
             <ScrollView style={styles.container}>
               <View style={styles.field}>
                 <Text style={styles.label}>Event Name</Text>
                 <TextInput
                   placeholder="Marathon"
                   value={eventName}
                   onChangeText={setEventName}
                   style={styles.input}
                   placeholderTextColor="#888"
                 />
               </View>
               <View style={styles.field}>
                 <Text style={styles.label}>Start Time</Text>
                 <View style={styles.pickerRow}>
                   <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowDate(true)}>
                     <Text style={styles.outlineBtnText}>{date.toDateString()}</Text>
                   </TouchableOpacity>
                   <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowTime(true)}>
                     <Text style={styles.outlineBtnText}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                   </TouchableOpacity>
                 </View>
                 {showDate && (
                   <DateTimePicker
                     value={date}
                     mode="date"
                     display={Platform.OS === 'ios' ? 'inline' : 'default'}
                     onChange={onChangeDate}
                     themeVariant="dark"
                     {...(Platform.OS === 'ios' ? { textColor: '#222' } as any : {})}
                   />
                 )}
                 {showTime && (
                   <DateTimePicker
                     value={date}
                     mode="time"
                     display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                     onChange={onChangeTime}
                     themeVariant="dark"
                     {...(Platform.OS === 'ios' ? { textColor: '#222' } as any : {})}
                   />
                 )}
               </View>
               <View style={styles.field}>
                 <Text style={styles.label}>Planned Route</Text>
                 <TextInput
                   placeholder="Central Park Loop"
                   value={plannedRoute}
                   onChangeText={setPlannedRoute}
                   style={styles.input}
                   placeholderTextColor="#888"
                 />
               </View>
               <TouchableOpacity disabled={creating} onPress={handleCreate} style={[styles.primaryBtn, creating && { opacity: 0.7 }]}>
                 <Text style={styles.primaryBtnText}>{creating ? 'Creating...' : 'Create Event'}</Text>
               </TouchableOpacity>
             </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default CreateEvent;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
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
    subtitle: {
        fontSize: 16,
        color: "#666",
    },
  field: {
    marginBottom: 14,
    color: "#666",
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  outlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  outlineBtnText: {
    color: '#888',
    fontWeight: '600',
  },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  copyBtn: {
    marginTop: 8,
    backgroundColor: '#eee',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  copyBtnText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
});