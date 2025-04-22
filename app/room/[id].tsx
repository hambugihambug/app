import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function RoomDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const patients = ['김환자', '이환자', '박환자'];
    const temperature = '24.5°C';
    const humidity = '48%';

    return (
        <View style={styles.container}>
            {/* 상단 고정 CCTV 영역 */}
            <View style={styles.cctvContainer}>
                <Text style={styles.sectionTitle}>📹 CCTV 화면</Text>
                <Image
                    source={{ uri: 'https://via.placeholder.com/350x200.png?text=CCTV+화면' }}
                    style={styles.cctvImage}
                    resizeMode="cover"
                />
            </View>

            {/* 하단 스크롤 영역 */}
            <ScrollView contentContainerStyle={styles.bottomContent}>
                <View style={styles.bottomSection}>
                    {/* 좌측: 환자 리스트 */}
                    <View style={styles.patientList}>
                        <Text style={styles.sectionTitle}>🧑‍⚕️ 환자</Text>
                        {patients.map((name) => (
                            <TouchableOpacity
                                key={name}
                                onPress={() => router.push(`/patient/${encodeURIComponent(name)}`)}
                                style={styles.patientButton}
                            >
                                <Text style={styles.patientText}>{name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* 우측: 병실 온습도 */}
                    <View style={styles.roomInfo}>
                        <Text style={styles.sectionTitle}>🌡️ 병실 정보</Text>
                        <Text style={styles.infoText}>온도: {temperature}</Text>
                        <Text style={styles.infoText}>습도: {humidity}</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    cctvContainer: {
        padding: 16,
        backgroundColor: '#fff',
    },
    cctvImage: {
        width: '100%',
        height: 350, // CCTV 화면을 크게
        borderRadius: 10,
        backgroundColor: '#ccc',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    bottomContent: {
        padding: 16,
    },
    bottomSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 20,
    },
    patientList: {
        flex: 1,
    },
    patientButton: {
        padding: 10,
        backgroundColor: '#e5e7eb',
        marginBottom: 8,
        borderRadius: 6,
    },
    patientText: {
        fontSize: 16,
    },
    roomInfo: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 10,
        elevation: 2,
    },
    infoText: {
        fontSize: 16,
        marginBottom: 8,
    },
});
