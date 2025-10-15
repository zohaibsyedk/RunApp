import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type CustomSelectorProps = {
  options: string[];
  onSelect: (option: string) => void;
  placeholder?: string;
  buttonStyle?: StyleProp<ViewStyle>;
  buttonTextStyle?: StyleProp<TextStyle>;
  optionItemStyle?: StyleProp<ViewStyle>;
  optionTextStyle?: StyleProp<TextStyle>; 
};

const CustomSelector: React.FC<CustomSelectorProps> = ({ 
    options, 
    onSelect, 
    placeholder = "Select an option...", 
    buttonStyle,
    buttonTextStyle,
    optionItemStyle,
    optionTextStyle,
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedValue, setSelectedValue] = useState<string | null>(null);

    const handleSelect = (option: string) => {
        setSelectedValue(option);
        onSelect(option);
        setModalVisible(false);
    };

    const finalButtonTextStyle = StyleSheet.flatten([styles.buttonText, buttonTextStyle]);

    return (
        <View>
            <TouchableOpacity style={[styles.button, buttonStyle]} onPress={() => setModalVisible(true)}>
                <Text style={[styles.buttonText, buttonTextStyle]}>{selectedValue || placeholder}</Text>
                <Ionicons name="chevron-down" size={20} color={finalButtonTextStyle.color} />
            </TouchableOpacity>
            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                    <View style={styles.optionsContainer}>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={[styles.optionItem, optionItemStyle]} onPress={() => handleSelect(item)}>
                                    <Text style={[styles.optionText, optionTextStyle]}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    buttonText: {
        fontSize: 16,
        color: 'gray'
    },
    // --- Modal Styles ---
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    optionsContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        width: '80%',
        maxHeight: '60%',
        padding: 10,
    },
    optionItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    optionText: {
        fontSize: 16,
    },
});

export default CustomSelector;