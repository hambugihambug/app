import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import API from '../../api';

// 데이터 타입 정의
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

interface RoomData {
    room_id: number;
    room_name: string;
    room_floor: number;
    patients: Patient[];
    patient_count: number;
    room_temp?: string;
    humidity?: string;
    status?: string;
}

export default function RoomPage() {
    const { room } = useLocalSearchParams();
    const [roomData, setRoomData] = useState<RoomData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                setIsLoading(true);
                // API를 통해 특정 병실 정보 가져오기
                const response = await API.rooms.getByName(room as string);

                if (response && response.data) {
                    setRoomData(response.data);
                } else {
                    setError('병실 정보를 불러올 수 없습니다.');
                }
            } catch (err) {
                console.error('병실 정보 가져오기 실패:', err);
                setError('병실 정보를 가져오는 중 오류가 발생했습니다.');

                // 백엔드 연결 실패 시 테스트 데이터 사용
                const mockRoomData: RoomData = {
                    room_id: 101,
                    room_name: room as string,
                    room_floor: parseInt(room as string) / 100,
                    patients: [
                        {
                            id: 1001,
                            name: '홍길동',
                            birth: '1980-01-01',
                            gender: '남',
                            status: '정상',
                            blood_type: 'A+',
                            height: 175,
                            weight: 70,
                            admission_date: '2023-01-01',
                            discharge_date: '',
                            phone: '010-1234-5678',
                            bed_number: '1',
                        },
                        {
                            id: 1002,
                            name: '김철수',
                            birth: '1975-03-15',
                            gender: '남',
                            status: '정상',
                            blood_type: 'B+',
                            height: 180,
                            weight: 75,
                            admission_date: '2023-02-15',
                            discharge_date: '',
                            phone: '010-2345-6789',
                            bed_number: '2',
                        },
                    ],
                    patient_count: 2,
                    room_temp: '24.5',
                    humidity: '45.0',
                    status: '정상',
                };
                setRoomData(mockRoomData);
            } finally {
                setIsLoading(false);
            }
        };

        if (room) {
            fetchRoomData();
        }
    }, [room]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={styles.loadingText}>병실 정보를 불러오는 중...</Text>
            </View>
        );
    }

    if (error && !roomData) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.roomTitle}>{roomData?.room_name} 상세 정보</Text>
            </View>

            {/* 병실 환경 정보 */}
            <View style={styles.infoCard}>
                <Text style={styles.cardTitle}>병실 환경</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>층:</Text>
                    <Text style={styles.infoValue}>{roomData?.room_floor}층</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>온도:</Text>
                    <Text style={styles.infoValue}>{roomData?.room_temp || '-'}°C</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>습도:</Text>
                    <Text style={styles.infoValue}>{roomData?.humidity || '-'}%</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>상태:</Text>
                    <Text
                        style={[
                            styles.infoValue,
                            roomData?.status === '정상'
                                ? styles.statusNormal
                                : roomData?.status === '주의'
                                ? styles.statusWarning
                                : roomData?.status === '경고'
                                ? styles.statusDanger
                                : null,
                        ]}
                    >
                        {roomData?.status || '정보 없음'}
                    </Text>
                </View>
            </View>

            {/* 환자 정보 */}
            <View style={styles.infoCard}>
                <Text style={styles.cardTitle}>입원 환자 ({roomData?.patient_count || 0}명)</Text>

                {roomData?.patients && roomData.patients.length > 0 ? (
                    roomData.patients.map((patient) => (
                        <View key={patient.id} style={styles.patientCard}>
                            <Text style={styles.patientName}>{patient.name}</Text>
                            {patient.bed_number && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>침대번호:</Text>
                                    <Text style={styles.infoValue}>{patient.bed_number}번</Text>
                                </View>
                            )}
                            {patient.gender && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>성별:</Text>
                                    <Text style={styles.infoValue}>{patient.gender}</Text>
                                </View>
                            )}
                            {patient.blood_type && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>혈액형:</Text>
                                    <Text style={styles.infoValue}>{patient.blood_type}</Text>
                                </View>
                            )}
                            {patient.birth && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>생년월일:</Text>
                                    <Text style={styles.infoValue}>{patient.birth}</Text>
                                </View>
                            )}
                            {patient.admission_date && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>입원일:</Text>
                                    <Text style={styles.infoValue}>
                                        {new Date(patient.admission_date).toLocaleDateString('ko-KR')}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ))
                ) : (
                    <Text style={styles.noDataText}>입원 환자가 없습니다.</Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f9',
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f9',
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
        backgroundColor: '#f5f5f9',
        padding: 20,
    },
    errorText: {
        color: '#dc2626',
        fontSize: 16,
        textAlign: 'center',
    },
    header: {
        marginBottom: 20,
    },
    roomTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    infoCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    infoLabel: {
        fontSize: 15,
        color: '#6b7280',
        flex: 1,
    },
    infoValue: {
        fontSize: 15,
        color: '#1f2937',
        fontWeight: '500',
        flex: 2,
        textAlign: 'right',
    },
    statusNormal: {
        color: '#047857',
    },
    statusWarning: {
        color: '#d97706',
    },
    statusDanger: {
        color: '#dc2626',
    },
    patientCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
    },
    patientName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
    },
    noDataText: {
        fontSize: 15,
        color: '#6b7280',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 16,
    },
});
