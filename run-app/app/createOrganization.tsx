import React, { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, TextInput, StyleSheet, Pressable, Keyboard, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CustomSelector from '../components/CustomSelector';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, updateDoc, getDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "./contexts/AuthContext";
import { getAuth } from 'firebase/auth';
import { useOrganizations } from './contexts/OrganizationContext';
import { useEvents } from './contexts/EventContext';

const CreateOrganization = () => {
    const [readyToSubmit, setReadyToSubmit] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);

    const [organizationName, setOrganizationName] = useState('');
    const [organizationPhotoURL, setOrganizationPhotoURL] = useState('');
    const [visibility, setVisibility] = useState('Public');
    const [description, setDescription] = useState('');

    const { user } = useAuth();
    const { organizations, loading: isLoadingOrgs, error: orgError, fetchOrganizations } = useOrganizations();
    const { fetchEvents } = useEvents();

    const API_URL = "https://run-app-backend-179019793982.us-central1.run.app";

    const handleSubmit = async () => {
        if (!readyToSubmit || isSubmitting) return;
        console.log("Submitting");
        
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) {
                throw new Error("No user signed in.");
            }
            const token = await user.getIdToken();

            const organizationData = {
                name: organizationName,
                organizationPhotoURL: organizationPhotoURL,
                visibility: visibility,
                description: description
            };
            const response = await fetch(`${API_URL}/api/organizations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(organizationData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create organization");
            }

            const result = await response.json();
            console.log("API Response Body:", JSON.stringify(result, null, 2));

            //save org photo url in storage
            const finalPhotoURL = await uploadImageAsync(organizationPhotoURL, result.organization.id);

            const orgDocRef = doc(db, 'organizations', result.organization.id);
            const batch = writeBatch(db);
            batch.update(orgDocRef, { organizationPhotoURL: finalPhotoURL });
            await batch.commit();

            await fetchOrganizations('mine');
            await fetchEvents('mine');

            console.log("Successfully created organization:", result);
            Alert.alert("Success!", "Your organization has been created.", [
                { text: "OK", onPress: () => router.back()}
            ]);
        } catch (err) {
            console.error("Error submitting:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (organizationName && visibility && organizationPhotoURL) {
            setReadyToSubmit(true);
        }
    }, [organizationName, organizationPhotoURL, visibility]);

    const uploadImageAsync = async (uri: string, organizationId: string) => {
        if (!user) {
            throw new Error("User not authenticated");
        }
    
        const response = await fetch(uri);
        const blob = await response.blob();
    
        const storage = getStorage();
        // Use the new, unique organization ID for the image path
        const storageRef = ref(storage, `organization-logos/${organizationId}`);
    
        await uploadBytes(storageRef, blob);
        
        return await getDownloadURL(storageRef);
    };

    const handleImageClick = async () => {
        setLoading(true);
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1,1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setOrganizationPhotoURL(result.assets[0].uri);
        }
        setLoading(false);
    };


    return (
        <View style={styles.container}>
            <Pressable onPress={() => {Keyboard.dismiss();}} >
                <TouchableOpacity style={styles.backButton} onPress={() => {router.back()}} >
                    <Ionicons name='arrow-back' color='black' size={34}/>
                </TouchableOpacity>
                <Text style={styles.title}>Create Organization</Text>
                <View style={styles.formContainer}>
                    <ScrollView style={styles.scrollView} keyboardShouldPersistTaps='handled'>
                        <TouchableOpacity onPress={handleImageClick} style={styles.orgImage}>
                        {loading ? (
                            <ActivityIndicator size="large" color="#000" style={{width: 300, height: 300}}/>
                        ) : (
                            <Image source={{uri: organizationPhotoURL || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}} style={{width: 300, height: 300, borderRadius: 150}} />
                        )}
                        </TouchableOpacity>
                        <View style={styles.inputContainer}>
                            {organizationName === '' && (
                                <Text style={styles.placeholderText} pointerEvents='none'>
                                    Organization Title
                                    <Text style={styles.asterisk}> *</Text>
                                </Text>
                            )}
                            <TextInput style={styles.input}
                            placeholder=""
                            value={organizationName}
                            onChangeText={setOrganizationName}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            {visibility === '' && (
                                <Text style={styles.placeholderText} pointerEvents='none'>
                                    Visiblity
                                    <Text style={styles.asterisk}> *</Text>
                                </Text>
                            )}
                            <CustomSelector
                                options={["Public", "Invite Only", "Friends"]}
                                onSelect={setVisibility}
                                placeholder={visibility}
                                buttonStyle={{
                                    backgroundColor: 'none',
                                    height: 40,
                                    width: '100%',
                                    paddingVertical: 5,
                                    borderWidth: 0,
                                    right: '5%'
                                }}
                                buttonTextStyle={{
                                    color: 'rgba(227, 227, 227)',
                                    fontFamily: 'Lexend-Regular'
                                }}
                            />
                        </View>

                        <View style={[styles.descriptionContainer, { paddingTop: 5 }]}>
                            <TextInput style={styles.input} 
                                placeholder='Description'
                                placeholderTextColor='rgba(200, 200, 200)'
                                value={description}
                                onChangeText={setDescription}
                                multiline={true}
                            />
                        </View>
                    </ScrollView>
                </View>
                {readyToSubmit && (
                    <TouchableOpacity style={styles.createButton} onPress={() => {handleSubmit()}} >
                        <Text style={styles.createTextReady}>Create</Text>
                    </TouchableOpacity>
                )}
                {!readyToSubmit && (
                    <TouchableOpacity style={styles.createButton} onPress={() => {Alert.alert("Fill out all required Fields")}} >
                        <Text style={styles.createText}>Create</Text>
                    </TouchableOpacity>
                )}
            </Pressable>
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
        top: '8%',
        left: '5%',
    },
    title: {
        fontFamily: 'Lexend-Bold',
        fontSize: 18,
        top: '13%',
        textAlign: 'center',
    },
    input: {
        fontSize: 16,
        height: '100%',
        color: 'rgba(227, 227, 227)',
    },
    scrollView: {
        backgroundColor: 'rgba(227, 227, 227, 0.6)',
        padding: 5,
        borderRadius: 15,
    },
    formContainer: {
        top: '20%',
        width: '95%',
        height: '100%',
    },
    placeholderText: {
        fontFamily: 'Lexend-Regular',
        color: 'rgba(227, 227, 227)',
        position: 'absolute',
        left: 10,
        fontSize: 16,
    },
    asterisk: {
        fontFamily: 'Lexend-Regular',
        color: 'red',
    },
    inputContainer: {
        justifyContent: 'center',
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 10,
        backgroundColor: 'rgba(140,140,140)',
        marginBottom: 20,
    },
    createButton: {
        position: 'absolute',
        right: '5%',
        top: '9%',
    },
    createText: {
        fontFamily: 'Lexend-Regular',
        fontSize: 16,
        color: 'black'
    },
    createTextReady: {
        fontFamily: 'Lexend-Regular',
        fontSize: 16,
        color: 'blue'
    },
    descriptionContainer: {
        height: 100,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 10,
        backgroundColor: 'rgba(140,140,140)',
        marginBottom: 20,
    },
    orgImage: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 20,
    }
});

export default CreateOrganization;