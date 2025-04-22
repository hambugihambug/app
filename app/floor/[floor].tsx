import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const roomData = {
    '2층': [
        { id: '201', status: 'normal' },
        { id: '202', status: 'warning' },
        { id: '203', status: 'normal' },
        { id: '204', status: 'caution' },
        { id: '205', status: 'normal' },
        { id: '206', status: 'normal' },
        { id: '207', status: 'normal' },
        { id: '208', status: 'normal' },
    ],
};

const statusStyles = {
    normal: { backgroundColor: '#fff', borderColor: '#2b4c86' },
    caution: { backgroundColor: '#fbbf24' }, // 주의: 노랑
    warning: { backgroundColor: '#f87171' }, // 경고: 빨강
};

export default function FloorPage() {
    const { floor } = useLocalSearchParams();
    const router = useRouter();

    const rooms = roomData[floor as keyof typeof roomData] || [];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{floor} 병실</Text>
            <View style={styles.roomGrid}>
                {rooms.map((room) => (
                    <TouchableOpacity
                        key={room.id}
                        style={[styles.roomBox, statusStyles[room.status as keyof typeof statusStyles]]}
                        onPress={() => router.push(`/room/${room.id}`)}
                    >
                        <Text style={styles.roomText}>{room.id}</Text>
                        {room.status === 'warning' && <Text style={styles.statusLabel}>⚠️ 경고</Text>}
                        {room.status === 'caution' && <Text style={styles.statusLabel}>⚠️ 주의</Text>}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    roomGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'flex-start',
    },
    roomBox: {
        width: '22%',
        aspectRatio: 1,
        borderWidth: 2,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        margin: '1%',
    },
    roomText: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    statusLabel: { fontSize: 12 },
});
