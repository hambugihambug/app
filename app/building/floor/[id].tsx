import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Platform,
    Button,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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

interface Room {
    room_id: number;
    room_name: string;
    room_type: string;
    room_capacity: number;
    total_beds: number;
    patient_count: number;
    occupied_beds: number;
}

interface Floor {
    floor_id: number;
    floor_number: number;
    floor_name: string;
}

export default function FloorScreen() {
    const { id } = useLocalSearchParams();
    const [floor, setFloor] = useState<Floor | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
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

    // 층 정보 불러오기
    const fetchFloorData = async () => {
        try {
            setLoading(true);
            console.log('층 정보 요청 시작:', `${API_URL}/api/floors/${id}`);

            const response = await fetchApi(`${API_URL}/api/floors/${id}`);
            console.log('응답 수신:', JSON.stringify(response.data));

            if (response.data.code === 0) {
                console.log('데이터 세팅:', response.data.data);
                setFloor(response.data.data.floor);

                // room_type 필드 추가 (없는 경우)
                const roomsWithType = (response.data.data.rooms || []).map((room: Room) => {
                    if (!room.room_type) {
                        // 첫 번째 방은 VIP로, 나머지는 일반으로 설정 (예시)
                        const roomNumber = parseInt(room.room_name.substr(-2));
                        room.room_type = roomNumber === 1 ? 'vip' : 'normal';
                    }
                    return room;
                });

                setRooms(roomsWithType);
            } else {
                console.log('서버 응답 오류:', response.data);
                Alert.alert('오류', '층 정보를 불러오는데 실패했습니다.');
            }
        } catch (error: any) {
            console.error('층 정보 조회 오류:', error);
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
        fetchFloorData();
    }, [id]);

    // 수동 새로고침
    const onRefresh = () => {
        setRefreshing(true);
        fetchFloorData();
    };

    // 호실 선택 시 해당 호실 상세 페이지로 이동
    const handleRoomPress = (room: Room) => {
        router.push({
            pathname: '/building/room/[id]',
            params: { id: room.room_id },
        });
    };

    // 더미 데이터 설정 (서버 연결 안 될 경우)
    const renderDummyData = () => {
        const floorNumber = Number(id);
        const dummyFloor: Floor = {
            floor_id: floorNumber,
            floor_number: floorNumber,
            floor_name: `${floorNumber}층`,
        };

        const dummyRooms: Room[] = [];
        const roomCount = Math.floor(Math.random() * 5) + 2; // 2~6개 병실

        for (let i = 1; i <= roomCount; i++) {
            const roomCapacity = i === 1 ? 1 : 2; // 첫 번째 방은 1인실, 나머지는 2인실
            const patientCount = Math.floor(Math.random() * (roomCapacity + 1)); // 0~최대 수용 인원

            dummyRooms.push({
                room_id: i,
                room_name: `${floorNumber}0${i}호`,
                room_type: i === 1 ? 'vip' : 'normal',
                room_capacity: roomCapacity,
                total_beds: roomCapacity,
                patient_count: patientCount,
                occupied_beds: patientCount,
            });
        }

        setFloor(dummyFloor);
        setRooms(dummyRooms);
    };

    // 각 호실 정보 렌더링
    const renderRoomItem = ({ item }: { item: Room }) => (
        <TouchableOpacity style={styles.roomCard} onPress={() => handleRoomPress(item)}>
            <View style={styles.roomHeader}>
                <Text style={styles.roomName}>{item.room_name}</Text>
                <View style={[styles.roomTypeBadge, item.room_type === 'vip' ? styles.vipBadge : styles.normalBadge]}>
                    <Text style={styles.roomTypeText}>{item.room_type === 'vip' ? 'VIP' : '일반'}</Text>
                </View>
            </View>

            <View style={styles.roomInfo}>
                <View style={styles.infoItem}>
                    <Ionicons name="bed-outline" size={20} color="#555" />
                    <Text style={styles.infoText}>
                        {item.patient_count}/{item.total_beds}명
                    </Text>
                </View>
                <View style={styles.occupancyBar}>
                    <View
                        style={[styles.occupancyFill, { width: `${(item.patient_count / item.total_beds) * 100}%` }]}
                    />
                </View>
            </View>
        </TouchableOpacity>
    );

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

            {floor && (
                <View style={styles.floorHeader}>
                    <Text style={styles.floorTitle}>{floor.floor_name}</Text>
                    <Text style={styles.floorSubtitle}>
                        총 {rooms.length}개 병실, {rooms.reduce((sum, room) => sum + room.patient_count, 0)}명 환자
                    </Text>
                </View>
            )}

            <FlatList
                data={rooms}
                renderItem={renderRoomItem}
                keyExtractor={(item) => item.room_id.toString()}
                contentContainerStyle={styles.listContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="alert-circle-outline" size={48} color="#999" />
                        <Text style={styles.emptyText}>병실 정보가 없습니다.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    floorHeader: {
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    floorTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    floorSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    listContainer: {
        padding: 16,
        paddingTop: 8,
    },
    roomCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    roomHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    roomName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    roomTypeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    vipBadge: {
        backgroundColor: '#FFE4B5',
    },
    normalBadge: {
        backgroundColor: '#E6F3FF',
    },
    roomTypeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    roomInfo: {
        marginTop: 8,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        marginLeft: 6,
        fontSize: 15,
        color: '#555',
    },
    occupancyBar: {
        height: 8,
        backgroundColor: '#E6E6E6',
        borderRadius: 4,
        overflow: 'hidden',
    },
    occupancyFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 4,
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
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        color: '#999',
    },
    debugContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    statusText: {
        fontSize: 14,
        color: '#666',
    },
});
