import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import API from '../../api';

// 병실 데이터 타입 정의
interface Room {
    id: number;
    name: string;
    status: string;
    temperature?: string;
    humidity?: string;
    patients?: Patient[];
    patient_count?: number;
}

// 환자 데이터 타입 정의
interface Patient {
    id: number;
    name: string;
    birth?: string;
    gender?: string;
    status?: string;
    blood_type?: string;
    height?: number;
    weight?: number;
    admission_date?: string;
    discharge_date?: string;
    phone?: string;
    bed_number?: string;
}

// 상태별 스타일 정의
const statusStyles = {
    정상: { backgroundColor: '#fff', borderColor: '#2b4c86' },
    주의: { backgroundColor: '#fef3c7', borderColor: '#d97706' }, // 주의: 노랑
    경고: { backgroundColor: '#fee2e2', borderColor: '#dc2626' }, // 경고: 빨강
    normal: { backgroundColor: '#fff', borderColor: '#2b4c86' }, // 기본값
    caution: { backgroundColor: '#fef3c7', borderColor: '#d97706' }, // 영문 대체값
    warning: { backgroundColor: '#fee2e2', borderColor: '#dc2626' }, // 영문 대체값
};

export default function FloorPage() {
    const { floor } = useLocalSearchParams();
    const router = useRouter();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDummy, setIsDummy] = useState(false);

    useEffect(() => {
        const fetchFloorData = async () => {
            try {
                setIsLoading(true);
                const response = await API.floors.getByFloor(floor as string);

                if (response && response.rooms) {
                    setIsDummy(response.is_dummy || false);
                    setRooms(
                        response.rooms.map((room: any) => ({
                            id: room.id,
                            name: room.name,
                            status: room.status || '정상',
                            temperature: room.temperature,
                            humidity: room.humidity,
                            patients: Array.isArray(room.patients) ? room.patients : [],
                            patient_count: Array.isArray(room.patients)
                                ? room.patients.length
                                : room.patient_count || 0,
                        }))
                    );
                } else {
                    setError('층 정보를 불러올 수 없습니다.');
                }
            } catch (err) {
                setError('병실 정보를 가져오는 중 오류가 발생했습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        if (floor) {
            fetchFloorData();
        }
    }, [floor]);

    // 상태에 따른 스타일 구하는 함수
    const getStatusStyle = (status: string) => {
        const key = status as keyof typeof statusStyles;
        return statusStyles[key] || statusStyles.normal;
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={styles.loadingText}>병실 정보를 불러오는 중...</Text>
            </View>
        );
    }

    if (error && rooms.length === 0) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{floor} 병실</Text>

            {isDummy && (
                <View style={styles.dummyBanner}>
                    <Text style={styles.dummyText}>⚠️ 현재 더미 데이터가 표시되고 있습니다</Text>
                </View>
            )}

            {rooms.length === 0 ? (
                <Text style={styles.noDataText}>이 층에 등록된 병실이 없습니다.</Text>
            ) : (
                <View style={styles.roomGrid}>
                    {rooms.map((room) => (
                        <TouchableOpacity
                            key={room.id}
                            style={[styles.roomBox, getStatusStyle(room.status)]}
                            onPress={() => router.push(`/room/${room.name}`)}
                        >
                            <Text style={styles.roomText}>{room.name}</Text>
                            {room.status !== '정상' && room.status !== 'normal' && (
                                <Text style={styles.statusLabel}>⚠️ {room.status}</Text>
                            )}
                            <Text style={styles.patientCount}>
                                입원: {Array.isArray(room.patients) ? room.patients.length : room.patient_count || 0}명
                                {room.temperature && ` | ${room.temperature}°C`}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#f9fafb',
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
    },
    loadingText: {
        marginTop: 10,
        color: '#6b7280',
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        padding: 20,
    },
    errorText: {
        color: '#dc2626',
        fontSize: 16,
        textAlign: 'center',
    },
    noDataText: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 40,
    },
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
        padding: 5,
    },
    roomText: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    statusLabel: { fontSize: 12 },
    patientCount: {
        fontSize: 10,
        color: '#4b5563',
        marginTop: 3,
    },
    dummyBanner: {
        backgroundColor: '#fef3c7',
        padding: 8,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#d97706',
    },
    dummyText: {
        fontSize: 14,
        color: '#92400e',
        textAlign: 'center',
    },
});
