import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import API from '../../api';
import { Ionicons } from '@expo/vector-icons';
import SafeArea from '../../components/common/SafeArea';

// 화면 너비 가져오기
const { width } = Dimensions.get('window');

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

// 상태별 스타일과 아이콘 정의
const statusConfig = {
    정상: {
        backgroundColor: '#EBF4FF',
        borderColor: '#1E6091',
        textColor: '#1E6091',
        icon: 'checkmark-circle' as const,
    },
    주의: {
        backgroundColor: '#FEF9C3',
        borderColor: '#CA8A04',
        textColor: '#854D0E',
        icon: 'alert-circle' as const,
    },
    경고: {
        backgroundColor: '#FEE2E2',
        borderColor: '#DC2626',
        textColor: '#B91C1C',
        icon: 'warning' as const,
    },
    normal: {
        backgroundColor: '#EBF4FF',
        borderColor: '#1E6091',
        textColor: '#1E6091',
        icon: 'checkmark-circle' as const,
    },
    caution: {
        backgroundColor: '#FEF9C3',
        borderColor: '#CA8A04',
        textColor: '#854D0E',
        icon: 'alert-circle' as const,
    },
    warning: {
        backgroundColor: '#FEE2E2',
        borderColor: '#DC2626',
        textColor: '#B91C1C',
        icon: 'warning' as const,
    },
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
        const key = status as keyof typeof statusConfig;
        return statusConfig[key] || statusConfig.normal;
    };

    // 아이콘 가져오기
    const getStatusIcon = (status: string) => {
        const key = status as keyof typeof statusConfig;
        return statusConfig[key]?.icon || statusConfig.normal.icon;
    };

    // 텍스트 색상 가져오기
    const getTextColor = (status: string) => {
        const key = status as keyof typeof statusConfig;
        return statusConfig[key]?.textColor || statusConfig.normal.textColor;
    };

    if (isLoading) {
        return (
            <SafeArea>
                <Stack.Screen
                    options={{
                        headerShown: false,
                    }}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1E6091" />
                    <Text style={styles.loadingText}>병실 정보를 불러오는 중...</Text>
                </View>
            </SafeArea>
        );
    }

    if (error && rooms.length === 0) {
        return (
            <SafeArea>
                <Stack.Screen
                    options={{
                        headerShown: false,
                    }}
                />
                <View style={styles.errorContainer}>
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
            <View style={styles.headerContainer}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#1E6091" />
                </TouchableOpacity>
                <Text style={styles.title}>{floor} 병실</Text>
                <View style={styles.placeholder} />
            </View>

            {isDummy && (
                <View style={styles.dummyBanner}>
                    <Ionicons name="information-circle" size={18} color="#854D0E" />
                    <Text style={styles.dummyText}>현재 더미 데이터가 표시되고 있습니다</Text>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.container}>
                {rooms.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="bed-outline" size={64} color="#94A3B8" />
                        <Text style={styles.noDataText}>이 층에 등록된 병실이 없습니다.</Text>
                    </View>
                ) : (
                    <View style={styles.roomList}>
                        {rooms.map((room) => {
                            const statusStyle = getStatusStyle(room.status);
                            const textColor = getTextColor(room.status);

                            return (
                                <TouchableOpacity
                                    key={room.id}
                                    style={styles.roomCard}
                                    onPress={() => router.push(`/room/${room.name}`)}
                                >
                                    <View style={styles.roomCardHeader}>
                                        <Text style={styles.roomNumber}>{room.name}</Text>
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                { backgroundColor: getStatusBgColor(room.status) },
                                            ]}
                                        >
                                            <Text style={[styles.statusText, { color: getStatusColor(room.status) }]}>
                                                {room.status}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.roomCardContent}>
                                        <View style={styles.infoItem}>
                                            <Ionicons name="thermometer-outline" size={18} color="#FF9500" />
                                            <Text style={styles.infoText}>{room.temperature || '-- '}°C</Text>
                                        </View>

                                        <View style={styles.infoItem}>
                                            <Ionicons name="water-outline" size={18} color="#0A84FF" />
                                            <Text style={styles.infoText}>{room.humidity || '-- '}%</Text>
                                        </View>

                                        <View style={styles.infoItem}>
                                            <Ionicons name="bed-outline" size={18} color="#64748B" />
                                            <Text style={styles.infoText}>
                                                {Array.isArray(room.patients)
                                                    ? `${room.patients.length}/4`
                                                    : `${room.patient_count || 0}/4`}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </SafeArea>
    );
}

// 상태에 따른 색상 반환 함수
const getStatusColor = (status: string) => {
    switch (status) {
        case '정상':
            return '#2C9E3F';
        case '주의':
            return '#CA8A04';
        case '경고':
            return '#DC2626';
        default:
            return '#2C9E3F';
    }
};

// 상태에 따른 배경색 반환 함수
const getStatusBgColor = (status: string) => {
    switch (status) {
        case '정상':
            return '#ECFDF5';
        case '주의':
            return '#FEF9C3';
        case '경고':
            return '#FEE2E2';
        default:
            return '#ECFDF5';
    }
};

const styles = StyleSheet.create({
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
    placeholder: {
        width: 40,
    },
    container: {
        flexGrow: 1,
        backgroundColor: '#F8FAFC',
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    loadingText: {
        marginTop: 10,
        color: '#1E6091',
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 20,
    },
    errorText: {
        color: '#E11D48',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
    },
    noDataText: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E6091',
        textAlign: 'center',
    },
    roomList: {
        width: '100%',
    },
    roomCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    roomCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    roomNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    roomCardContent: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 10,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 24,
    },
    infoText: {
        fontSize: 16,
        marginLeft: 6,
        color: '#4B5563',
        fontWeight: '500',
    },
    dummyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF9C3',
        padding: 8,
        borderRadius: 8,
        margin: 16,
        marginTop: 0,
        borderWidth: 1,
        borderColor: '#CA8A04',
    },
    dummyText: {
        fontSize: 14,
        color: '#854D0E',
        marginLeft: 8,
    },
});
