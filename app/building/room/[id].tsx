import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Image,
    TouchableOpacity,
    Platform,
    Button,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import config from '../../config';

// API 서버 주소 설정
const API_URL = config.API_URL;
// 모바일 기기에서는 직접 IP 주소 사용 (localhost는 에뮬레이터/시뮬레이터에서만 유효)
// const API_URL = Platform.OS === 'ios' ? 'http://localhost:3000' : 'http://10.0.2.2:3000';

// 네트워크 요청 함수
const fetchApi = async (url: string, options = {}) => {
    console.log(`API 요청: ${url}`);
    try {
        const response = await axios(url, {
            ...options,
            timeout: 10000,
        });
        console.log(
            `API 응답 [${response.status}]:`,
            typeof response.data === 'object' ? JSON.stringify(response.data).substring(0, 200) + '...' : response.data
        );
        return response;
    } catch (error: any) {
        console.error(`API 오류 [${url}]:`, error.message);
        if (axios.isAxiosError(error)) {
            if (error.response) {
                console.log('오류 응답:', error.response.status, JSON.stringify(error.response.data));
            } else if (error.request) {
                console.log('요청 전송됨, 응답 없음:', error.request);
            }
        }
        throw error;
    }
};

interface Patient {
    patient_id: number;
    patient_name: string;
    patient_blood: string;
    patient_birth: string;
    patient_sex?: string;
    patient_height?: number;
    patient_weight?: number;
    patient_status?: string;
    patient_in?: string;
    patient_out?: string;
    patient_tel?: string;
    bed_id: number;
    bed_num: string;
    age?: number;
}

interface Room {
    room_id: number;
    room_name: string;
    room_type: string;
    room_capacity: number;
    room_temp?: string;
    room_humi?: string;
    room_Crte_id?: string | null;
    room_Crte_dt?: string;
    room_Updt_id?: string | null;
    room_Updt_dt?: string | null;
    floor_id: number;
    floor_name?: string;
    patients: Patient[];
}

export default function RoomDetailScreen() {
    const { id } = useLocalSearchParams();
    const [room, setRoom] = useState<Room | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [serverStatus, setServerStatus] = useState<string | null>(null);
    const router = useRouter();

    // 서버 상태 확인
    const checkServerStatus = async () => {
        try {
            const response = await fetchApi(`${API_URL}/api/health`);
            setServerStatus('서버 연결 성공: ' + JSON.stringify(response.data));
            Alert.alert('성공', '서버에 연결되었습니다.');
        } catch (error: any) {
            console.error('서버 연결 오류:', error);
            setServerStatus('서버 연결 실패: ' + error.message);
            Alert.alert('오류', '서버 연결에 실패했습니다.');
        }
    };

    // 병실 정보 불러오기
    const fetchRoomData = async () => {
        try {
            setLoading(true);
            console.log('병실 정보 요청 시작:', `${API_URL}/api/rooms/${id}`);

            const response = await fetchApi(`${API_URL}/api/rooms/${id}`);
            console.log('응답 수신:', JSON.stringify(response.data));

            if (response.data.code === 0) {
                const roomData = response.data.data;
                console.log('데이터 세팅:', roomData);

                // 환자 나이 계산
                if (roomData.patients && roomData.patients.length > 0) {
                    roomData.patients = roomData.patients.map((patient: Patient) => {
                        if (patient && patient.patient_birth) {
                            const birthYear = new Date(patient.patient_birth).getFullYear();
                            const currentYear = new Date().getFullYear();
                            patient.age = currentYear - birthYear;
                        }
                        return patient;
                    });
                }

                // room_type 필드 추가 (없는 경우)
                if (!roomData.room_type) {
                    const roomNumber = parseInt(roomData.room_name.substr(-2));
                    roomData.room_type = roomNumber === 1 ? 'vip' : 'normal';
                }

                setRoom(roomData);
            } else {
                console.log('서버 응답 오류:', response.data);
                Alert.alert('오류', '병실 정보를 불러오는데 실패했습니다.');
            }
        } catch (error: any) {
            console.error('병실 정보 조회 오류:', error);
            if (axios.isAxiosError(error)) {
                console.log('상세 에러:', error.response?.data || error.message);
            }
            Alert.alert('오류', '서버 연결에 문제가 있습니다: ' + error.message);
            // 더미 데이터로 대체
            renderDummyData();
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // 더미 데이터 테스트
    const testDummyData = () => {
        Alert.alert('테스트', '더미 데이터를 강제로 로드합니다.');
        renderDummyData();
    };

    // 초기 데이터 로딩
    useEffect(() => {
        fetchRoomData();
    }, [id]);

    // 수동 새로고침
    const onRefresh = () => {
        setRefreshing(true);
        fetchRoomData();
    };

    // 더미 데이터 설정 (서버 연결 안 될 경우)
    const renderDummyData = () => {
        const roomId = Number(id);
        const floorId = Math.floor(roomId / 100);
        const roomNumber = roomId % 100;
        const currentYear = new Date().getFullYear();

        const dummyPatients: Patient[] = [];
        const patientCount = Math.floor(Math.random() * 3); // 0~2명의 환자

        for (let i = 1; i <= patientCount; i++) {
            const birthYear = 1930 + Math.floor(Math.random() * 50);

            dummyPatients.push({
                patient_id: i,
                patient_name: `환자${i}`,
                patient_blood: ['A+', 'B+', 'O+', 'AB+'][Math.floor(Math.random() * 4)],
                patient_birth: `${birthYear}-01-01`,
                patient_sex: i % 2 === 0 ? '남' : '여',
                patient_height: 160 + Math.floor(Math.random() * 30),
                patient_weight: 50 + Math.floor(Math.random() * 40),
                patient_status: 'active',
                patient_in: `${currentYear - 1}-${Math.floor(Math.random() * 12) + 1}-${
                    Math.floor(Math.random() * 28) + 1
                }`,
                patient_tel: `010-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(
                    1000 + Math.random() * 9000
                )}`,
                bed_id: i,
                bed_num: `${floorId}0${roomNumber}-${i}`,
                age: currentYear - birthYear,
            });
        }

        const dummyRoom: Room = {
            room_id: roomId,
            room_name: `${floorId}0${roomNumber}호`,
            room_type: roomNumber === 1 ? 'vip' : 'normal',
            room_capacity: roomNumber === 1 ? 1 : 2,
            floor_id: floorId,
            floor_name: `${floorId}층`,
            room_temp: (20 + Math.random() * 5).toFixed(1),
            room_humi: (40 + Math.random() * 20).toFixed(1),
            room_Crte_id: null,
            room_Crte_dt: `${currentYear - 1}-01-01`,
            room_Updt_id: null,
            room_Updt_dt: null,
            patients: dummyPatients,
        };

        setRoom(dummyRoom);
    };

    // 환자 상세 페이지로 이동
    const handlePatientPress = (patient: Patient) => {
        router.push({
            pathname: '/patient/[name]',
            params: { name: patient.patient_name, id: patient.patient_id },
        });
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>병실 정보를 불러오는 중...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.debugContainer}>
                <Button title="서버 연결 테스트" onPress={checkServerStatus} />
                <Button title="더미 데이터 테스트" onPress={testDummyData} />
                {serverStatus && <Text style={styles.statusText}>{serverStatus}</Text>}
            </View>

            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />}
            >
                {room && (
                    <>
                        <View style={styles.roomHeader}>
                            <View style={styles.roomTitleContainer}>
                                <Text style={styles.roomName}>{room.room_name}</Text>
                                <View
                                    style={[
                                        styles.roomTypeBadge,
                                        room.room_type === 'vip'
                                            ? styles.vipBadge
                                            : room.room_type === 'suite'
                                            ? styles.suiteBadge
                                            : styles.normalBadge,
                                    ]}
                                >
                                    <Text style={styles.roomTypeText}>
                                        {room.room_type === 'vip'
                                            ? 'VIP'
                                            : room.room_type === 'suite'
                                            ? 'SUITE'
                                            : '일반'}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.roomInfo}>
                                {room.floor_name} · 정원 {room.room_capacity}명 · 현재 {room.patients?.length || 0}명
                            </Text>
                        </View>

                        <View style={styles.patientsContainer}>
                            <Text style={styles.sectionTitle}>환자 정보</Text>

                            {!room.patients || room.patients.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="bed-outline" size={40} color="#999" />
                                    <Text style={styles.emptyText}>환자가 없습니다</Text>
                                </View>
                            ) : (
                                room.patients.map((patient) => (
                                    <TouchableOpacity
                                        key={patient.patient_id}
                                        style={styles.patientCard}
                                        onPress={() => handlePatientPress(patient)}
                                    >
                                        <View style={styles.patientInfo}>
                                            <View style={styles.patientAvatar}>
                                                <Text style={styles.patientInitial}>
                                                    {patient.patient_name?.charAt(0) || '?'}
                                                </Text>
                                            </View>

                                            <View style={styles.patientDetails}>
                                                <Text style={styles.patientName}>{patient.patient_name}</Text>
                                                <Text style={styles.patientSubInfo}>
                                                    {patient.age}세 · {patient.patient_blood} · 침대 {patient.bed_num}
                                                </Text>
                                            </View>
                                        </View>

                                        <Ionicons name="chevron-forward" size={20} color="#999" />
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>

                        <View style={styles.emptyBedsContainer}>
                            <Text style={styles.sectionTitle}>빈 침대</Text>

                            {room.patients?.length >= room.room_capacity ? (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>빈 침대가 없습니다</Text>
                                </View>
                            ) : (
                                [...Array(room.room_capacity - (room.patients?.length || 0))].map((_, idx) => (
                                    <View key={`empty-${idx}`} style={styles.emptyBedCard}>
                                        <Ionicons name="bed-outline" size={24} color="#999" />
                                        <Text style={styles.emptyBedText}>비어있음</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </>
                )}
            </ScrollView>
            {loading && !refreshing && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>병실 정보를 불러오는 중...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    roomHeader: {
        backgroundColor: 'white',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    roomTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    roomName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginRight: 10,
    },
    roomTypeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    vipBadge: {
        backgroundColor: '#FFE4B5',
    },
    suiteBadge: {
        backgroundColor: '#FFD700',
    },
    normalBadge: {
        backgroundColor: '#E6F3FF',
    },
    roomTypeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    roomInfo: {
        fontSize: 15,
        color: '#666',
    },
    patientsContainer: {
        backgroundColor: 'white',
        margin: 16,
        borderRadius: 10,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    patientCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    patientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    patientAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    patientInitial: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    patientDetails: {
        flex: 1,
    },
    patientName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    patientSubInfo: {
        fontSize: 14,
        color: '#666',
    },
    emptyBedsContainer: {
        backgroundColor: 'white',
        margin: 16,
        marginTop: 0,
        borderRadius: 10,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    emptyBedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        marginBottom: 8,
    },
    emptyBedText: {
        marginLeft: 12,
        fontSize: 15,
        color: '#999',
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 8,
        fontSize: 15,
        color: '#999',
    },
    debugContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
    },
    statusText: {
        fontSize: 15,
        color: '#666',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
});
