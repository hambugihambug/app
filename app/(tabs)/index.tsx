import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

const floors = ['1층', '2층', '3층', '4층', '5층'];

const emergencyAlerts = [
    { id: 1, message: '🚨 2층 203호 박철수 환자 이상 징후 감지', roomId: '203호' },
    { id: 2, message: '🔥 3층 301호 화재 감지 센서 작동', roomId: '301호' },
];

export default function Main() {
    const router = useRouter();

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>층수 선택</Text>

            {/* 🚨 긴급 알림 영역 */}
            <View style={styles.alertSection}>
                <Text style={styles.sectionTitle}>🚨 긴급 알림</Text>
                {emergencyAlerts.map((alert) => (
                    <View key={alert.id} style={styles.emergencyCard}>
                        <Text style={styles.emergencyText}>{alert.message}</Text>
                        <View style={styles.buttonWrapper}>
                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={() => router.push(`/room/${encodeURIComponent(alert.roomId)}`)}
                            >
                                <Text style={styles.confirmText}>이동</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </View>

            {/* 구분선 */}
            <View style={styles.separator} />

            {/* 층수 리스트 */}
            {floors.map((floor) => (
                <TouchableOpacity
                    key={floor}
                    style={styles.floorButton}
                    onPress={() => router.push(`/floor/${encodeURIComponent(floor)}`)}
                >
                    <Text style={styles.floorText}>{floor}</Text>
                </TouchableOpacity>
            ))}

            <Text style={styles.updatedAt}>마지막 업데이트: 2025-04-21 14:30:22</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 100,
        backgroundColor: '#f9fafb',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    // 긴급 알림
    alertSection: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#dc2626',
        marginBottom: 10,
    },
    emergencyCard: {
        backgroundColor: '#fee2e2',
        padding: 16,
        borderRadius: 10,
        marginBottom: 15,
        borderLeftWidth: 6,
        borderLeftColor: '#dc2626',
    },
    emergencyText: {
        fontSize: 16,
        color: '#991b1b',
        marginBottom: 10,
    },
    buttonWrapper: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    confirmButton: {
        backgroundColor: '#dc2626',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    confirmText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    // 구분선
    separator: {
        height: 1,
        backgroundColor: '#d1d5db',
        marginVertical: 20,
    },
    // 층 버튼
    floorButton: {
        backgroundColor: '#e0e7ff',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#2b4c86',
    },
    floorText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2b4c86',
    },
    updatedAt: {
        marginTop: 30,
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
});
