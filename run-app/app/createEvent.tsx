import React, {useState} from 'react';
import { Text, View, TouchableOpacity, TextInput, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent} from '@react-native-community/datetimepicker';
import CustomSelector from './components/CustomSelector';

const CreateEvent = () => {
    const [eventName, setEventName] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [organization, setOrganization] = useState('');
    const [showTimePicker, setShowTimePicker] = useState(false);
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
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => {router.back()}} >
                <Ionicons name='arrow-back' color='black' size={34}/>
            </TouchableOpacity>
            <Text style={styles.title}>Create Event</Text>
            <View style={styles.formContainer}>
                <Pressable onPress={() => {setShowTimePicker(false)}}>
                    <ScrollView style={styles.scrollView}>
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
                            {organization === '' && (
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
                                options={[
                                    "Organization 1",
                                    "Organization 2",
                                    "Organization 3"
                                ]} 
                                onSelect={(org) => {
                                    console.log(`Selected Organization: ${org}`);
                                    setOrganization(org);
                                }}
                                placeholder=''
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
                </Pressable>
            </View>
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
    },
    title: {
        position: 'absolute',
        fontFamily: 'Lexend-Bold',
        fontSize: 24,
        top: '10%',
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
        top: '30%',
        width: '95%',
        height: '85%',
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
    }
});

export default CreateEvent;