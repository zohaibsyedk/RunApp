import React from 'react';
import { Text, View, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const CreateOrganization = () => {
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => {router.back()}} >
                <Ionicons name='arrow-back' color='black' size={34}/>
            </TouchableOpacity>
            <Text>Create Organization</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: '5%',
        left: '5%',
    }
});

export default CreateOrganization;