import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import API from '../../api';

// 방 정보 인터페이스 정의
interface RoomData {
    room_id: number;
    room_name: string;
    room_capacity: number;
    room_temp: string;
    room_humi: string;
    room_Crte_id: string | null;
    room_Crte_dt: string;
    room_Updt_id: string | null;
    room_Updt_dt: string | null;
    patients: Patient[];
    patient_count: number;
}

// 환자 정보 인터페이스 정의
interface Patient {
    patient_id: number;
    patient_name: string;
    patient_blood?: string;
    patient_birth?: string;
    bed_id?: number;
    bed_num?: string;
}

export default function RoomDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [roomData, setRoomData] = useState<RoomData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                setIsLoading(true);
                // API를 통해 병실 정보 가져오기
                const response = await API.rooms.getByName(id as string);

                if (response && response.data) {
                    console.log('병실 데이터:', response.data);

                    // 환자 수 계산 - patients 배열이 있다면 그 길이를 사용
                    const roomInfo = {
                        ...response.data,
                        // API에서 제공하는 patient_count가 없거나 0이면 patients 배열 길이 사용
                        patient_count:
                            response.data.patient_count || (response.data.patients ? response.data.patients.length : 0),
                    };

                    setRoomData(roomInfo);
                } else {
                    setError('병실 정보를 불러올 수 없습니다.');
                }
            } catch (err) {
                console.error('병실 정보 가져오기 실패:', err);
                setError('병실 정보를 가져오는 중 오류가 발생했습니다.');

                // 더미 데이터로 대체
                const dummyPatients = [
                    {
                        patient_id: 1,
                        patient_name: '김환자',
                        patient_blood: 'A+',
                        patient_birth: '1980-01-01',
                        bed_id: 1,
                        bed_num: '1',
                    },
                    {
                        patient_id: 2,
                        patient_name: '이환자',
                        patient_blood: 'B+',
                        patient_birth: '1975-05-15',
                        bed_id: 2,
                        bed_num: '2',
                    },
                    {
                        patient_id: 3,
                        patient_name: '박환자',
                        patient_blood: 'O+',
                        patient_birth: '1990-10-10',
                        bed_id: 3,
                        bed_num: '3',
                    },
                ];

                const dummyData: RoomData = {
                    room_id: 101,
                    room_name: id as string,
                    room_capacity: 4,
                    room_temp: '24.5',
                    room_humi: '48',
                    room_Crte_id: null,
                    room_Crte_dt: '2023-01-01',
                    room_Updt_id: null,
                    room_Updt_dt: null,
                    patients: dummyPatients,
                    patient_count: dummyPatients.length, // 환자 배열의 길이로 설정
                };
                setRoomData(dummyData);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchRoomData();
        }
    }, [id]);

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centeredContent]}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={styles.loadingText}>병실 정보를 불러오는 중...</Text>
            </View>
        );
    }

    if (error && !roomData) {
        return (
            <View style={[styles.container, styles.centeredContent]}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* 상단 고정 CCTV 영역 */}
            <View style={styles.cctvContainer}>
                <Text style={styles.sectionTitle}>📹 CCTV 화면 - {roomData?.room_name}</Text>
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
                        <Text style={styles.sectionTitle}>🧑‍⚕️ 환자 ({roomData?.patients?.length || 0}명)</Text>
                        {roomData?.patients && roomData.patients.length > 0 ? (
                            roomData.patients.map((patient) => (
                                <TouchableOpacity
                                    key={patient.patient_id}
                                    onPress={() => router.push(`/patient/${patient.patient_id}`)}
                                    style={styles.patientButton}
                                >
                                    <Text style={styles.patientText}>{patient.patient_name}</Text>
                                    {patient.bed_num && (
                                        <Text style={styles.patientBedText}>침대 {patient.bed_num}번</Text>
                                    )}
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={styles.noDataText}>입원 환자가 없습니다.</Text>
                        )}
                    </View>

                    {/* 우측: 병실 온습도 */}
                    <View style={styles.roomInfo}>
                        <Text style={styles.sectionTitle}>🌡️ 병실 정보</Text>
                        <Text style={styles.infoText}>온도: {roomData?.room_temp || '-'}°C</Text>
                        <Text style={styles.infoText}>습도: {roomData?.room_humi || '-'}%</Text>
                        <Text style={styles.infoText}>정원: {roomData?.room_capacity || '-'}명</Text>
                        <Text style={styles.infoText}>
                            생성일:{' '}
                            {roomData?.room_Crte_dt ? new Date(roomData.room_Crte_dt).toLocaleDateString('ko-KR') : '-'}
                        </Text>
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
    centeredContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#6b7280',
    },
    errorText: {
        color: '#dc2626',
        fontSize: 16,
        textAlign: 'center',
        padding: 20,
    },
    noDataText: {
        fontSize: 15,
        color: '#6b7280',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 16,
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
        fontWeight: 'bold',
    },
    patientBedText: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    roomInfo: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    infoText: {
        fontSize: 16,
        marginBottom: 8,
    },
});
