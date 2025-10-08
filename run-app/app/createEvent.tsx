import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, TextInput, StyleSheet, ScrollView, Pressable, Alert, Keyboard } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent} from '@react-native-community/datetimepicker';
import CustomSelector from './components/CustomSelector';
import { Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useEvents } from './contexts/EventContext';


const CreateEvent = () => {
    const [eventName, setEventName] = useState('');

    const [distanceText, setDistanceText] = useState('');
    const [distanceType, setDistanceType] = useState('Mile(s)');

    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState(new Date());

    const [organizationId, setOrganizationId] = useState('');

    const [visibility, setVisibility] = useState('Private');

    const [showTimePicker, setShowTimePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [readyToSubmit, setReadyToSubmit] = useState(false);

    const [organizations, setOrganizations] = useState([
        { label: "My Personal Events", id: "org_user_123_personal" },
        { label: "Twin Cities Runners", id: "org_tcr_456" },
        { label: "Midwest Marathoners", id: "org_mwm_789" }
    ]);

    const { fetchEvents } = useEvents();

    const API_URL = "https://run-app-backend-179019793982.us-central1.run.app";

    const onChangeDate = (event?: DateTimePickerEvent, selectedDate?: Date) => {
        if (selectedDate) {
            setStartDate(selectedDate);
        }
    }
    const formatter = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short'
    })

    useEffect(() => {
        if (eventName && startDate && organizations) {
            setReadyToSubmit(true);
        }
    }, [eventName, startDate, organizations, visibility]);

    const handleSubmit = async () => {
        if (!readyToSubmit || isSubmitting) return;
        setIsSubmitting(true);
        console.log(`Submitting Event\n
            Name: ${eventName}\n
            Organization ID: ${organizationId}\n
            startDate: ${startDate.toISOString()}\n
            visibility: ${visibility}\n
            Distance: ${distanceText}\n
            Description: ${description}\n`);

        try{
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) {
                throw new Error("No user signed in.");
            }
            const token = await user.getIdToken();

            //convert distance
            let distanceInKm = 0;
            if (distanceText) {
                const numericDistance = parseFloat(distanceText);
                distanceInKm = distanceType === 'Mile(s)' ? numericDistance * 1.60934 : numericDistance;
            }
            
            const eventData = {
                name: eventName,
                organizationId: organizationId,
                startDate: startDate.toISOString(),
                visibility: visibility,
                distance: distanceInKm,
                description: description,
                location: {
                    address: "Minneapolis, MN",
                    geopoint: {
                        latitude: 44.9778,
                        longitude: -93.2650
                    }
                }
            };

            const response = await fetch(`${API_URL}/api/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(eventData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create event");
            }

            await fetchEvents(); 

            const result = await response.json();
            console.log("Successfully created event:", result);
            Alert.alert("Success!", "Your event has been created.", [
                { text: "OK", onPress: () => router.back()}
            ]);
        } catch (error) {
            console.error("Error submitting:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <View style={styles.container}>
            <Pressable onPress={() => {Keyboard.dismiss(); setShowTimePicker(false);}} >
                <TouchableOpacity style={styles.backButton} onPress={() => {router.back()}} >
                    <Ionicons name='arrow-back' color='black' size={34}/>
                </TouchableOpacity>
                <Text style={styles.title}>Create Event</Text>
                <View style={styles.formContainer}>
                    <ScrollView style={styles.scrollView} keyboardShouldPersistTaps='handled'>
                        <View style={styles.inputContainer}>
                            {eventName === '' && (
                                <Text style={styles.placeholderText} pointerEvents='none'>
                                    Event Title
                                    <Text style={styles.asterisk}> *</Text>
                                </Text>
                            )}
                            <TextInput style={styles.input}
                            placeholder=""
                            value={eventName}
                            onChangeText={setEventName}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            {organizationId === '' && (
                                <Text style={styles.placeholderText} pointerEvents='none'>
                                    Add Organization
                                    <Text style={styles.asterisk}> *</Text>
                                </Text>
                            )}
                            <CustomSelector
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
                                optionItemStyle={{
                                    paddingVertical: 20,
                                }}
                                options={organizations.map(org => org.label)} 
                                onSelect={(orgLabel) => {
                                    const selectedOrg = organizations.find(o => o.label === orgLabel);
                                    if (selectedOrg){
                                        setOrganizationId(selectedOrg.id);
                                    }
                                }}
                                placeholder=''
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
                                options={["Public", "Private", "Friends"]}
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

                        <View style={styles.inputContainer}>
                            <Text style={styles.placeholderText} pointerEvents='none'>
                                Start Date
                                <Text style={styles.asterisk}> *</Text>
                            </Text>
                            <TouchableOpacity style={styles.timePickerBtn} onPress={() => {setShowTimePicker(true)}} >
                                <Text style={styles.dateText}>{formatter.format(startDate)}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.inputContainer, { flexDirection: 'row', alignItems: 'center' }]}>
                            {distanceText === '' && (
                                <Text style={styles.placeholderText} pointerEvents='none'>
                                    Distance
                                </Text>
                            )}
                            <TextInput style={[styles.input, { flex: 1 }]}
                                keyboardType='numeric'
                                placeholder=""
                                value={distanceText?.toString()}
                                onChangeText={setDistanceText}
                            />
                            <CustomSelector
                                buttonStyle={{
                                    backgroundColor: 'rgba(190,190,190)',
                                    height: 30,
                                    width: '70%',
                                    paddingVertical: 5,
                                    borderWidth: 0,
                                    left: '32%',
                                }}
                                buttonTextStyle={{
                                    color: 'rgba(227, 227, 227)',
                                    fontFamily: 'Lexend-Regular'
                                }}
                                optionItemStyle={{
                                    paddingVertical: 20,
                                }}
                                options={[
                                    "Mile(s)",
                                    "Kilometer(s)",
                                ]} 
                                onSelect={(distanceType) => {
                                    console.log(`Selected Distance Type: ${distanceType}`);
                                    setDistanceType(distanceType);
                                }}
                                placeholder='Mile(s)'
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
                    {showTimePicker && (
                                <DateTimePicker 
                                    testID='dateTimePicker'
                                    value={startDate}
                                    mode='datetime'
                                    is24Hour={true}
                                    display='spinner'
                                    onChange={onChangeDate}
                                    style={styles.timePicker}
                                />
                    )}
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
    timePickerBtn: {
        backgroundColor: 'rgba(190,190,190)',
        right: '2%',
        width: '50%',
        height: '60%',
        borderRadius: 10,
        position: 'absolute'
    },
    timePicker: {
        backgroundColor: 'rgba(140,140,140, 0.95)',
        borderRadius: 10,
        position: 'absolute',
        bottom: '50%',
        right: '1.5%',
    },
    dateText: {
        fontFamily: 'Lexend-Regular',
        color: 'rgba(227, 227, 227)',
        marginTop: 5,
        textAlign: 'center',
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
});

export default CreateEvent;