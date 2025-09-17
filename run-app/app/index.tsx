import { Text, View } from "react-native";
import LoginModal from "./components/Login";

const Index = () => {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <LoginModal />
        <Text>Hello</Text>
      </View>
    );
  }

export default Index;