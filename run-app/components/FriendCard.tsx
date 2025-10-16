import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Friendship, User } from "../app/types";

type FriendCardProps = {
    user: User;
    friendship: Friendship;
    onPress: () => void;
};

const FriendCard: React.FC<FriendCardProps> = ({ onPress, user, friendship }) => {
    return (
        <View style={styles.container}>
            <Text>test</Text>
        </View>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
})

export default FriendCard;