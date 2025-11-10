import React from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

const EventModal = () => {
    return (
        <>
            <View style={styles.container}>
                <Pressable onPress={() => router.back()} style={StyleSheet.absoluteFill}/>
                <View style={styles.modalView}>
                    <TouchableOpacity style={styles.button} onPress={() => {router.replace('/createEvent')}}>
                        <Text style={styles.title}>Create Event</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => {router.replace('/createOrganization')}}>
                        <Text style={styles.title}>Create Organization</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button}>
                        <Text style={styles.title}>Join Race</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#DDDDDD',
    },
    modalView: {
        height: '30%',
        width: '100%',
        backgroundColor: '#1A1A1A',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'space-evenly'
    },
    button: {
        borderRadius: 15,
        backgroundColor: '#282828',
        height: '28%',
        width: '85%',
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: "#DDDDDD",
        borderWidth: 1,
    }
})

export default EventModal;