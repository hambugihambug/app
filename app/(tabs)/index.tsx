import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Platform,
    Modal,
    Pressable,
} from 'react-native';
import { useRouter, Tabs } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import API from '../../api';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import {
    registerForPushNotificationsAsync,
    sendLocalNotification,
    setNotificationListeners,
} from '../../utils/notifications';
import SafeArea from '../../components/common/SafeArea';
import { Picker } from '@react-native-picker/picker';

// 알림 타입 정의
interface EmergencyAlert {
    id: number;
    message: string;
    roomId: string;
    type?: 'accident' | 'environmental';
    createdAt?: string;
    room_temp?: string; // 추가: 온도 정보
    humidity?: string; // 추가: 습도 정보
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
    const [selectedFloor, setSelectedFloor] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState('');
    const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
    const notificationListeners = useRef<any>();
    // 마지막으로 처리된 알림 ID를 추적
    const lastProcessedAlertIds = useRef<number[]>([]);
    const [modalVisible, setModalVisible] = useState(false);

    // 알림 캐시 초기화 함수
    const clearAlertCache = () => {
        lastProcessedAlertIds.current = [];
        console.log('알림 캐시가 초기화되었습니다.');
    };

    // Expo Notifications 설정
    useEffect(() => {
        // 푸시 알림 토큰 등록
        registerForPushNotificationsAsync().then((token) => {
            if (token) {
                setExpoPushToken(token.data);
            }
        });

        // 알림 수신 및 응답 리스너 설정
        notificationListeners.current = setNotificationListeners(
            (notification) => {
                console.log('알림 수신:', notification);
            },
            (response) => {
                const data = response.notification.request.content.data as any;
                if (data && data.roomId) {
                    router.push(`/room/${encodeURIComponent(data.roomId)}`);
                }
            }
        );

        // 컴포넌트 언마운트 시 리스너 제거
        return () => {
            if (notificationListeners.current) {
                Notifications.removeNotificationSubscription(
                    notificationListeners.current.notificationReceivedListener
                );
                Notifications.removeNotificationSubscription(
                    notificationListeners.current.notificationResponseListener
                );
            }
        };
    }, []);

    // 층수 데이터 가져오기
    useEffect(() => {
        const fetchFloors = async () => {
            try {
                setIsLoading(true);
                // 층 정보를 가져오는 API 호출
                const response = await API.floors.getAll();

                if (response && response.length > 0) {
                    setFloors(response);
                    setSelectedFloor(response[0].name); // 첫 번째 층을 기본값으로 설정
                } else {
                    // API가 빈 배열을 반환하면 기본 데이터 사용
                    const defaultFloors = [
                        { id: 1, name: '1층' },
                        { id: 2, name: '2층' },
                        { id: 3, name: '3층' },
                        { id: 4, name: '4층' },
                        { id: 5, name: '5층' },
                    ];
                    setFloors(defaultFloors);
                    setSelectedFloor(defaultFloors[0].name); // 첫 번째 층을 기본값으로 설정
                }
            } catch (err) {
                console.error('층 정보 로딩 실패:', err);
                // 백엔드가 없거나 오류 시 기본 층 데이터 사용
                const defaultFloors = [
                    { id: 1, name: '1층' },
                    { id: 2, name: '2층' },
                    { id: 3, name: '3층' },
                    { id: 4, name: '4층' },
                    { id: 5, name: '5층' },
                ];
                setFloors(defaultFloors);
                setSelectedFloor(defaultFloors[0].name); // 첫 번째 층을 기본값으로 설정
            } finally {
                setIsLoading(false);
            }
        };

        fetchFloors();
    }, []);

    // 긴급 알림 데이터 가져오기
    useEffect(() => {
        // 컴포넌트 마운트 시 알림 캐시 초기화
        clearAlertCache();

        const fetchEmergencyAlerts = async () => {
            try {
                setIsLoading(true);
                // getAllAlerts 함수를 사용하여 낙상과 환경 알림 모두 가져오기
                const alertsData = await API.alerts.getAllAlerts();

                if (alertsData) {
                    // 알림을 타입별로 분류하고 각 타입의 최신 알림 하나만 표시
                    const fallAlerts = alertsData.filter((alert) => !alert.type || alert.type !== 'environmental');
                    const environmentalAlerts = alertsData.filter((alert) => alert.type === 'environmental');

                    // 각 타입별로 최신 알림 1개씩만 선택
                    const latestFallAlert =
                        fallAlerts.length > 0
                            ? [
                                  fallAlerts.sort((a, b) => {
                                      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                                      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                                      return dateB - dateA; // 내림차순 (최신순)
                                  })[0],
                              ]
                            : [];

                    const latestEnvironmentalAlert =
                        environmentalAlerts.length > 0
                            ? [
                                  environmentalAlerts.sort((a, b) => {
                                      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                                      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                                      return dateB - dateA; // 내림차순 (최신순)
                                  })[0],
                              ]
                            : [];

                    // 두 타입의 최신 알림만 합쳐서 설정
                    const filteredAlerts = [...latestFallAlert, ...latestEnvironmentalAlert];
                    setEmergencyAlerts(filteredAlerts);

                    // 현재 시간을 마지막 업데이트 시간으로 설정
                    const now = new Date();
                    setLastUpdated(now.toLocaleString('ko-KR'));

                    // 현재 보이는 알림의 ID 목록
                    const currentAlertIds = filteredAlerts.map((alert) => alert.id);

                    // 새 알림 확인 (이전에 처리되지 않은 알림)
                    const newAlerts = filteredAlerts.filter(
                        (alert) => !lastProcessedAlertIds.current.includes(alert.id)
                    );

                    // 새 알림에 대해 푸시 알림 전송
                    newAlerts.forEach((alert) => {
                        sendLocalNotification('긴급 알림', alert.message, {
                            roomId: alert.roomId,
                            alertId: alert.id,
                            type: alert.type,
                        });
                    });

                    // 새로운 알림 ID 목록으로 갱신 (이전 알림 ID는 유지하지 않음)
                    lastProcessedAlertIds.current = currentAlertIds;
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
                backgroundColor: '#E6F4FF',
                borderLeftColor: '#1E6091',
            };
        }
        return styles.emergencyCard;
    };

    // 알림 텍스트 색상 지정 함수
    const getAlertTextStyle = (alertType?: string) => {
        if (alertType === 'environmental') {
            return {
                ...styles.emergencyText,
                color: '#1E6091',
            };
        }
        return styles.emergencyText;
    };

    // 플로어 선택 함수
    const handleSelectFloor = (floorName: string) => {
        setSelectedFloor(floorName);
        setModalVisible(false);
        router.push(`/floor/${encodeURIComponent(floorName)}`);
    };

    if (isLoading && emergencyAlerts.length === 0) {
        return (
            <SafeArea>
                <View style={[styles.container, styles.centered]}>
                    <ActivityIndicator size="large" color="#1E6091" />
                    <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
                </View>
            </SafeArea>
        );
    }

    return (
        <SafeArea>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>병원 모니터링 시스템</Text>

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
                                {alert.type === 'environmental' ? (
                                    <>
                                        <Text style={styles.alertTitle}>{alert.roomId}호 환경 이상</Text>
                                        <Text style={getAlertTextStyle(alert.type)}>
                                            온도: {alert.room_temp || '--'}°C
                                        </Text>
                                        <Text style={getAlertTextStyle(alert.type)}>
                                            습도: {alert.humidity || '--'}%
                                        </Text>
                                    </>
                                ) : (
                                    <Text style={getAlertTextStyle(alert.type)}>{alert.message}</Text>
                                )}
                                {alert.createdAt && (
                                    <Text style={styles.timeText}>
                                        {new Date(alert.createdAt).toLocaleString('ko-KR')}
                                    </Text>
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

                {/* 층수 선택 헤더와 드롭다운 */}
                <View style={styles.floorSelectionHeader}>
                    <Text style={styles.sectionTitle}>병동 층 선택</Text>

                    {Platform.OS === 'ios' ? (
                        <View style={styles.dropdownContainer}>
                            <TouchableOpacity style={styles.customDropdown} onPress={() => setModalVisible(true)}>
                                <Text style={styles.selectedFloorText2}>{selectedFloor}</Text>
                                <Ionicons name="chevron-down" size={16} color="#1E6091" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.dropdownContainer}>
                            <Picker
                                selectedValue={selectedFloor}
                                onValueChange={(itemValue) => handleSelectFloor(itemValue)}
                                style={styles.dropdown}
                                dropdownIconColor="#1E6091"
                            >
                                {floors.map((floor) => (
                                    <Picker.Item key={floor.id} label={floor.name} value={floor.name} color="#1E6091" />
                                ))}
                            </Picker>
                        </View>
                    )}

                    {/* iOS용 모달 선택기 */}
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={modalVisible}
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                            <View style={styles.modalView}>
                                <Text style={styles.modalTitle}>층수 선택</Text>
                                {floors.map((floor) => (
                                    <TouchableOpacity
                                        key={floor.id}
                                        style={[
                                            styles.modalItem,
                                            selectedFloor === floor.name && styles.modalItemSelected,
                                        ]}
                                        onPress={() => handleSelectFloor(floor.name)}
                                    >
                                        <Text
                                            style={[
                                                styles.modalItemText,
                                                selectedFloor === floor.name && styles.modalItemTextSelected,
                                            ]}
                                        >
                                            {floor.name}
                                        </Text>
                                        {selectedFloor === floor.name && (
                                            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Pressable>
                    </Modal>
                </View>

                {/* 층수 리스트 - 그리드 형태로 변경 */}
                <View style={styles.floorGrid}>
                    {floors.map((floor) => (
                        <TouchableOpacity
                            key={floor.id}
                            style={[styles.floorButton, selectedFloor === floor.name && styles.selectedFloorButton]}
                            onPress={() => {
                                setSelectedFloor(floor.name);
                                router.push(`/floor/${encodeURIComponent(floor.name)}`);
                            }}
                        >
                            <Ionicons
                                name="business-outline"
                                size={24}
                                color={selectedFloor === floor.name ? '#FFFFFF' : '#1E6091'}
                            />
                            <Text style={[styles.floorText, selectedFloor === floor.name && styles.selectedFloorText]}>
                                {floor.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.updatedAt}>마지막 업데이트: {lastUpdated || '-'}</Text>
            </ScrollView>
        </SafeArea>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 100,
        backgroundColor: '#F8FAFC', // 깔끔한 밝은 배경색
    },
    centered: {
        flex: 1,
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
        marginBottom: 10,
        fontWeight: '500',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#1E6091', // 병원에서 많이 사용하는 진한 파란색
        textAlign: 'center',
    },
    // 긴급 알림
    alertSection: {
        marginBottom: 30,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E6091', // 병원에서 많이 사용하는 진한 파란색
        marginBottom: 16,
    },
    emergencyCard: {
        backgroundColor: '#FFEFEF',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#E11D48',
        shadowColor: '#E11D48',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    noAlertsCard: {
        backgroundColor: '#F1F5F9',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#64748B',
    },
    noAlertsText: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
    },
    emergencyText: {
        fontSize: 15,
        color: '#B91C1C',
        fontWeight: '500',
        marginBottom: 8,
    },
    buttonWrapper: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    confirmButton: {
        backgroundColor: '#1E6091',
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    confirmText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    // 구분선
    separator: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 16,
    },
    // 층 선택 그리드
    floorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    // 층 버튼
    floorButton: {
        backgroundColor: '#FFFFFF',
        width: '48%', // 한 행에 2개씩
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    floorText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E6091',
        marginTop: 8,
    },
    updatedAt: {
        marginTop: 20,
        fontSize: 13,
        color: '#94A3B8',
        textAlign: 'center',
    },
    timeText: {
        fontSize: 12,
        color: '#94A3B8',
        marginBottom: 8,
    },
    // 층수 선택 헤더
    floorSelectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },

    // 커스텀 드롭다운
    customDropdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 12,
        height: 40,
    },

    selectedFloorText2: {
        color: '#1E6091',
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: 8,
    },

    // 모달 스타일
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },

    modalView: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E6091',
        textAlign: 'center',
        marginBottom: 20,
    },

    modalItem: {
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    modalItemSelected: {
        backgroundColor: '#1E6091',
    },

    modalItemText: {
        fontSize: 16,
        color: '#1E6091',
        fontWeight: '500',
    },

    modalItemTextSelected: {
        color: '#FFFFFF',
    },

    // 수정된 드롭다운 스타일
    dropdownContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        width: 130,
        height: Platform.OS === 'ios' ? 40 : 50,
        justifyContent: 'center',
        overflow: 'hidden',
    },

    dropdown: {
        width: 130,
        height: 50,
        color: '#1E6091',
    },

    // 선택된 층수 버튼 스타일
    selectedFloorButton: {
        backgroundColor: '#1E6091',
        borderColor: '#1E6091',
    },

    // 선택된 층수 텍스트 스타일
    selectedFloorText: {
        color: '#FFFFFF',
    },

    alertTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E6091',
        marginBottom: 8,
    },
});
