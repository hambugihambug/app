import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert as RNAlert,
} from 'react-native';
import React from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import API from '../../api';
import SafeArea from '../../components/common/SafeArea';
import { Ionicons } from '@expo/vector-icons';

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
    patient_img?: string;
}

// 알림 인터페이스 정의
interface Alert {
    id: number;
    message: string;
    roomId: string;
    createdAt?: string;
    type?: 'accident' | 'environmental';
}

export default function RoomDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [roomData, setRoomData] = useState<RoomData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [emergencyAlerts, setEmergencyAlerts] = useState<Alert[]>([]);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

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
                        patient_img: 'https://randomuser.me/api/portraits/men/32.jpg',
                    },
                    {
                        patient_id: 2,
                        patient_name: '이환자',
                        patient_blood: 'B+',
                        patient_birth: '1975-05-15',
                        bed_id: 2,
                        bed_num: '2',
                        patient_img: 'https://randomuser.me/api/portraits/women/44.jpg',
                    },
                    {
                        patient_id: 3,
                        patient_name: '박환자',
                        patient_blood: 'O+',
                        patient_birth: '1990-10-10',
                        bed_id: 3,
                        bed_num: '3',
                        patient_img: 'https://randomuser.me/api/portraits/men/67.jpg',
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

        // 긴급 알림 정보 가져오기
        const fetchEmergencyAlerts = async () => {
            try {
                // 낙상 알림 가져오기
                const fallAlerts = await API.alerts.getEmergency();

                // 환경 알림 가져오기
                const envAlerts = await API.alerts.getEnvironmentalAlerts();

                // 낙상 알림에는 'accident' 타입 추가, 환경 알림에는 'environmental' 타입 추가
                const typedFallAlerts = fallAlerts.map((alert: Alert) => ({ ...alert, type: 'accident' }));
                const typedEnvAlerts = envAlerts.map((alert: Alert) => ({ ...alert, type: 'environmental' }));

                // 현재 방에 해당하는 알림만 필터링
                const roomAlerts = [...typedFallAlerts, ...typedEnvAlerts].filter((alert) => alert.roomId === id);

                // 알림을 시간순으로 정렬 (최신순)
                const sortedAlerts = roomAlerts.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA; // 내림차순 (최신순)
                });

                // 가장 최근 알림 1개만 설정
                setEmergencyAlerts(sortedAlerts.length > 0 ? [sortedAlerts[0]] : []);
            } catch (err) {
                console.error('긴급 알림 정보 가져오기 실패:', err);
                // 오류 발생 시 빈 배열 설정
                setEmergencyAlerts([]);
            }
        };

        if (id) {
            fetchRoomData();
            fetchEmergencyAlerts();

            // 5분마다 알림 갱신
            const alertInterval = setInterval(fetchEmergencyAlerts, 300000);

            // 컴포넌트 언마운트 시 인터벌 정리
            return () => clearInterval(alertInterval);
        }
    }, [id]);

    // 알림 확인 처리 함수
    const handleConfirmAlert = async (alertId: number) => {
        try {
            setConfirmLoading(true);

            // 확인 처리 전 사용자에게 확인
            RNAlert.alert('알림 확인', '이 알림을 확인 처리하시겠습니까?', [
                {
                    text: '취소',
                    style: 'cancel',
                    onPress: () => setConfirmLoading(false),
                },
                {
                    text: '확인',
                    onPress: async () => {
                        try {
                            // 낙상 알림만 확인 처리 (환경 알림은 제외)
                            if (alertId < 1000) {
                                // API 호출하여 accident_chYN을 Y로 변경
                                const response = await API.alerts.confirmAccident(alertId);

                                if (response && response.code === 0) {
                                    // 알림 목록에서 해당 알림 제거
                                    setEmergencyAlerts([]);
                                    RNAlert.alert('확인 완료', '알림이 확인 처리되었습니다.');
                                } else {
                                    RNAlert.alert('오류', response?.message || '알림 확인 처리에 실패했습니다.');
                                }
                            } else {
                                // 환경 알림은 단순히 목록에서만 제거
                                setEmergencyAlerts([]);
                                RNAlert.alert('확인 완료', '환경 알림이 확인 처리되었습니다.');
                            }
                        } catch (error) {
                            console.error('알림 확인 처리 실패:', error);
                            RNAlert.alert('오류', '서버 연결에 문제가 있습니다.');
                        } finally {
                            setConfirmLoading(false);
                        }
                    },
                },
            ]);
        } catch (error) {
            console.error('알림 확인 처리 중 오류:', error);
            setConfirmLoading(false);
            RNAlert.alert('오류', '알림 확인 처리 중 문제가 발생했습니다.');
        }
    };

    // 이미지 로딩 에러 처리 함수
    const handleImageError = (patientId: number) => {
        setImageErrors((prev) => ({
            ...prev,
            [patientId]: true,
        }));
    };

    if (isLoading) {
        return (
            <SafeArea>
                <Stack.Screen
                    options={{
                        headerShown: false,
                    }}
                />
                <View style={[styles.container, styles.centeredContent]}>
                    <ActivityIndicator size="large" color="#1E6091" />
                    <Text style={styles.loadingText}>병실 정보를 불러오는 중...</Text>
                </View>
            </SafeArea>
        );
    }

    if (error && !roomData) {
        return (
            <SafeArea>
                <Stack.Screen
                    options={{
                        headerShown: false,
                    }}
                />
                <View style={[styles.container, styles.centeredContent]}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            </SafeArea>
        );
    }

    return (
        <SafeArea>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            {/* 헤더 */}
            <View style={styles.headerContainer}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#1E6091" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{roomData?.room_name} 병실</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                {/* 긴급 알림 표시 영역 */}
                {emergencyAlerts.length > 0 && (
                    <View style={styles.emergencyContainer}>
                        <View style={styles.alertHeader}>
                            <Ionicons name="warning" size={20} color="#B91C1C" />
                            <Text style={styles.alertHeaderText}>
                                {emergencyAlerts[0].type === 'environmental'
                                    ? `${roomData?.room_name} 환경 이상`
                                    : '긴급 알림'}
                            </Text>
                        </View>
                        <View style={styles.alertContent}>
                            <View style={styles.alertContentRow}>
                                <View style={styles.alertTextContainer}>
                                    {emergencyAlerts[0].type === 'environmental' ? (
                                        <>
                                            <Text style={styles.alertText}>온도: {roomData?.room_temp || '--'}°C</Text>
                                            <Text style={styles.alertText}>습도: {roomData?.room_humi || '--'}%</Text>
                                        </>
                                    ) : (
                                        <Text style={styles.alertText}>{emergencyAlerts[0].message}</Text>
                                    )}
                                    {emergencyAlerts[0].createdAt && (
                                        <Text style={styles.alertTime}>
                                            {new Date(emergencyAlerts[0].createdAt).toLocaleString('ko-KR', {
                                                year: 'numeric',
                                                month: 'numeric',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </Text>
                                    )}
                                </View>

                                {/* 확인 버튼 */}
                                <TouchableOpacity
                                    style={styles.confirmButton}
                                    onPress={() => handleConfirmAlert(emergencyAlerts[0].id)}
                                    disabled={confirmLoading}
                                >
                                    {confirmLoading ? (
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    ) : (
                                        <Text style={styles.confirmButtonText}>확인</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* CCTV 영역 */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="videocam-outline" size={22} color="#1E6091" />
                        <Text style={styles.sectionTitle}>실시간 모니터링</Text>
                    </View>
                    <Image
                        source={{ uri: 'https://via.placeholder.com/350x200.png?text=CCTV+화면' }}
                        style={styles.cctvImage}
                        resizeMode="cover"
                    />
                </View>

                {/* 병실 요약 정보 */}
                <View style={styles.roomSummaryCard}>
                    <View style={styles.roomSummaryHeader}>
                        <Text style={styles.sectionTitle}>병실 요약</Text>
                    </View>
                    <View style={styles.roomStatsContainer}>
                        <View style={styles.roomStatItem}>
                            <Ionicons name="thermometer-outline" size={24} color="#FF9500" />
                            <Text style={styles.statValue}>{roomData?.room_temp || '--'}°C</Text>
                            <Text style={styles.statLabel}>온도</Text>
                        </View>
                        <View style={styles.roomStatItem}>
                            <Ionicons name="water-outline" size={24} color="#0A84FF" />
                            <Text style={styles.statValue}>{roomData?.room_humi || '--'}%</Text>
                            <Text style={styles.statLabel}>습도</Text>
                        </View>
                        <View style={styles.roomStatItem}>
                            <Ionicons name="people-outline" size={24} color="#1E6091" />
                            <Text style={styles.statValue}>
                                {roomData?.patients?.length || 0}/{roomData?.room_capacity || 4}
                            </Text>
                            <Text style={styles.statLabel}>환자</Text>
                        </View>
                    </View>
                </View>

                {/* 환자 리스트 */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="people-outline" size={22} color="#1E6091" />
                        <Text style={styles.sectionTitle}>입원 환자 목록</Text>
                    </View>

                    {roomData?.patients && roomData.patients.length > 0 ? (
                        <View style={styles.patientListContainer}>
                            {roomData.patients.map((patient) => (
                                <TouchableOpacity
                                    key={patient.patient_id}
                                    onPress={() => router.push(`/patient/${patient.patient_id}`)}
                                    style={styles.patientCard}
                                >
                                    {patient.patient_img && !imageErrors[patient.patient_id] ? (
                                        <Image
                                            source={{ uri: patient.patient_img }}
                                            style={styles.patientImage}
                                            onError={() => handleImageError(patient.patient_id)}
                                        />
                                    ) : (
                                        <View style={styles.patientIcon}>
                                            <Ionicons name="person" size={24} color="#64748B" />
                                        </View>
                                    )}
                                    <View style={styles.patientInfo}>
                                        <Text style={styles.patientName}>{patient.patient_name}</Text>
                                        <View style={styles.patientDetails}>
                                            {patient.bed_num && (
                                                <View style={styles.patientDetailItem}>
                                                    <Ionicons name="bed-outline" size={16} color="#64748B" />
                                                    <Text style={styles.patientDetailText}>
                                                        침대 {patient.bed_num}번
                                                    </Text>
                                                </View>
                                            )}
                                            {patient.patient_blood && (
                                                <View style={styles.patientDetailItem}>
                                                    <Ionicons name="water-outline" size={16} color="#DC2626" />
                                                    <Text style={styles.patientDetailText}>
                                                        {patient.patient_blood}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyStateContainer}>
                            <Ionicons name="bed-outline" size={40} color="#94A3B8" />
                            <Text style={styles.noDataText}>현재 입원 환자가 없습니다</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeArea>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E6091',
        textAlign: 'center',
    },
    placeholder: {
        width: 40,
    },
    centeredContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#1E6091',
    },
    errorText: {
        color: '#E11D48',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        padding: 20,
    },
    emergencyContainer: {
        backgroundColor: '#FEE2E2',
        borderRadius: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FCA5A5',
        overflow: 'hidden',
    },
    alertHeader: {
        backgroundColor: '#FECACA',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    alertHeaderText: {
        color: '#B91C1C',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    alertContent: {
        padding: 12,
    },
    alertContentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    alertTextContainer: {
        flex: 1,
        marginRight: 10,
    },
    alertTitle: {
        color: '#B91C1C',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },
    alertText: {
        color: '#B91C1C',
        fontWeight: '500',
        fontSize: 15,
    },
    alertTime: {
        color: '#9B2C2C',
        fontSize: 13,
        marginTop: 6,
    },
    confirmButton: {
        backgroundColor: '#1E6091',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 15,
    },
    roomSummaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    roomSummaryHeader: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    roomStatsContainer: {
        flexDirection: 'row',
        padding: 12,
    },
    roomStatItem: {
        flex: 1,
        alignItems: 'center',
        padding: 12,
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E293B',
        marginVertical: 6,
    },
    statLabel: {
        fontSize: 14,
        color: '#64748B',
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
        marginLeft: 8,
    },
    cctvImage: {
        width: '100%',
        height: 220,
        backgroundColor: '#E2E8F0',
    },
    patientListContainer: {
        paddingTop: 4,
    },
    patientCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    patientIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    patientInfo: {
        flex: 1,
    },
    patientName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 4,
    },
    patientDetails: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    patientDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    patientDetailText: {
        fontSize: 14,
        color: '#64748B',
        marginLeft: 4,
    },
    emptyStateContainer: {
        padding: 30,
        alignItems: 'center',
    },
    noDataText: {
        fontSize: 15,
        color: '#64748B',
        marginTop: 12,
    },
    patientImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: '#E2E8F0',
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
});
