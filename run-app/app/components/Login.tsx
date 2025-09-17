import React from 'react';
import * as AuthSession from 'expo-auth-session';
import { View, Text, Button, Modal } from 'react-native';


const Login: React.FC = () => {
    const redirectUri = AuthSession.makeRedirectUri({scheme: "runapp"});
    console.log("yo this the url: "+redirectUri);
    return (
        <Modal visible={true} animationType="slide" style={{ width: "50%", height: "50%" }}>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Button title="Sign in with Strava" onPress={() => {}} />
            </View>
        </Modal>
    );
};

export default Login;