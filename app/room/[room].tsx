import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';

export default function RoomPage() {
    const { room } = useLocalSearchParams();
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>{room} 상세 페이지입니다</Text>
        </View>
    );
}
