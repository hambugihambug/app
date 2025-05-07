import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import API from '../../api';
import { Ionicons } from '@expo/vector-icons';

// 알림 타입 정의
interface EmergencyAlert {
    id: number;
    message: string;
    roomId: string;
    type?: string;
    createdAt?: string;
}

// 층 타입 정의
interface Floor {
    id: number;
    name: string;
}

export default function Main() {
    const router = useRouter();
    const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
    const [floors, setFloors] = useState<Floor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState('');

    // 층수 데이터 가져오기
    useEffect(() => {
        const fetchFloors = async () => {
            try {
                setIsLoading(true);
                // 층 정보를 가져오는 API 호출
                const response = await API.floors.getAll();

                if (response && response.length > 0) {
                    setFloors(response);
                } else {
                    // API가 빈 배열을 반환하면 기본 데이터 사용
                    setFloors([
                        { id: 1, name: '1층' },
                        { id: 2, name: '2층' },
                        { id: 3, name: '3층' },
                        { id: 4, name: '4층' },
                        { id: 5, name: '5층' },
                    ]);
                }
            } catch (err) {
                console.error('층 정보 로딩 실패:', err);
                // 백엔드가 없거나 오류 시 기본 층 데이터 사용
                setFloors([
                    { id: 1, name: '1층' },
                    { id: 2, name: '2층' },
                    { id: 3, name: '3층' },
                    { id: 4, name: '4층' },
                    { id: 5, name: '5층' },
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFloors();
    }, []);

    // 긴급 알림 데이터 가져오기
    useEffect(() => {
        const fetchEmergencyAlerts = async () => {
            try {
                setIsLoading(true);
                // getAllAlerts 함수를 사용하여 낙상과 환경 알림 모두 가져오기
                const alertsData = await API.alerts.getAllAlerts();

                if (alertsData) {
                    setEmergencyAlerts(alertsData);
                    // 현재 시간을 마지막 업데이트 시간으로 설정
                    const now = new Date();
                    setLastUpdated(now.toLocaleString('ko-KR'));
                }
            } catch (err) {
                console.error('긴급 알림 로딩 실패:', err);
                setError('긴급 알림을 불러오는데 실패했습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchEmergencyAlerts();

        // 30초마다 업데이트 (실시간 알림 확인)
        const intervalId = setInterval(fetchEmergencyAlerts, 30000);

        return () => clearInterval(intervalId);
    }, []);

    // 알림 카드 배경색 지정 함수
    const getAlertCardStyle = (alertType?: string) => {
        if (alertType === 'environmental') {
            return {
                ...styles.emergencyCard,
                backgroundColor: '#e6f7ff',
                borderLeftColor: '#0092ff',
            };
        }
        return styles.emergencyCard;
    };

    // 알림 텍스트 색상 지정 함수
    const getAlertTextStyle = (alertType?: string) => {
        if (alertType === 'environmental') {
            return {
                ...styles.emergencyText,
                color: '#006fcf',
            };
        }
        return styles.emergencyText;
    };

    if (isLoading && emergencyAlerts.length === 0) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>층수 선택</Text>

            {/* 🚨 긴급 알림 영역 */}
            <View style={styles.alertSection}>
                <Text style={styles.sectionTitle}>🚨 긴급 알림</Text>
                {error && <Text style={styles.errorText}>{error}</Text>}

                {emergencyAlerts.length === 0 ? (
                    <View style={styles.noAlertsCard}>
                        <Text style={styles.noAlertsText}>현재 긴급 알림이 없습니다.</Text>
                    </View>
                ) : (
                    emergencyAlerts.map((alert) => (
                        <View key={alert.id} style={getAlertCardStyle(alert.type)}>
                            <Text style={getAlertTextStyle(alert.type)}>{alert.message}</Text>
                            {alert.createdAt && (
                                <Text style={styles.timeText}>{new Date(alert.createdAt).toLocaleString('ko-KR')}</Text>
                            )}
                            <View style={styles.buttonWrapper}>
                                <TouchableOpacity
                                    style={styles.confirmButton}
                                    onPress={() => router.push(`/room/${encodeURIComponent(alert.roomId)}`)}
                                >
                                    <Text style={styles.confirmText}>이동</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </View>

            {/* 구분선 */}
            <View style={styles.separator} />

            {/* 층수 리스트 */}
            {floors.map((floor) => (
                <TouchableOpacity
                    key={floor.id}
                    style={styles.floorButton}
                    onPress={() => router.push(`/floor/${encodeURIComponent(floor.name)}`)}
                >
                    <Text style={styles.floorText}>{floor.name}</Text>
                </TouchableOpacity>
            ))}

            <Text style={styles.updatedAt}>마지막 업데이트: {lastUpdated || '-'}</Text>

            <View style={styles.featuresContainer}>
                {/* 건물 정보 기능 추가 */}
                <View style={styles.feature}>
                    <TouchableOpacity
                        style={[styles.featureButton, { backgroundColor: '#4682B4' }]}
                        onPress={() => {
                            try {
                                // @ts-ignore - 일시적으로 타입 에러 무시
                                router.push('/building');
                            } catch (error) {
                                console.error('Navigation error:', error);
                            }
                        }}
                    >
                        <Ionicons name="business-outline" size={32} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.featureText}>병동 정보</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 100,
        backgroundColor: '#f9fafb',
    },
    centered: {
        flex: 1,
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
        marginBottom: 10,
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
    noAlertsCard: {
        backgroundColor: '#f3f4f6',
        padding: 16,
        borderRadius: 10,
        marginBottom: 15,
        borderLeftWidth: 6,
        borderLeftColor: '#9ca3af',
    },
    noAlertsText: {
        fontSize: 16,
        color: '#4b5563',
        textAlign: 'center',
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
    timeText: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 10,
    },
    featuresContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    },
    feature: {
        alignItems: 'center',
    },
    featureButton: {
        padding: 10,
        borderRadius: 10,
    },
    featureText: {
        marginTop: 5,
        fontSize: 14,
        color: '#6b7280',
    },
});
