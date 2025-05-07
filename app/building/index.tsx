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
    Button,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import config from '../config';

// API 서버 주소 설정
const API_URL = config.API_URL;
// 모바일 기기에서는 직접 IP 주소 사용 (localhost는 에뮬레이터/시뮬레이터에서만 유효)
// const API_URL = Platform.OS === 'ios' ? 'http://localhost:3000' : 'http://10.0.2.2:3000';

// axios 기본 설정
axios.defaults.timeout = config.API_CONFIG.timeout;
axios.defaults.headers.common['Content-Type'] = config.API_CONFIG.headers['Content-Type'];

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

interface Floor {
    floor_id: number;
    floor_number: number;
    floor_name: string;
    room_count: number;
    patient_count: number;
}

export default function BuildingScreen() {
    const [floors, setFloors] = useState<Floor[]>([]);
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

    // 층수 정보 불러오기
    const fetchFloors = async () => {
        try {
            setLoading(true);
            console.log('층수 정보 요청 시작:', `${API_URL}/api/floors`);

            const response = await fetchApi(`${API_URL}/api/floors`);
            console.log('응답 수신:', JSON.stringify(response.data));

            if (response.data.code === 0) {
                console.log('데이터 세팅:', response.data.data);
                setFloors(response.data.data || []);
            } else {
                console.log('서버 응답 오류:', response.data);
                Alert.alert('오류', '층수 정보를 불러오는데 실패했습니다.');
            }
        } catch (error: any) {
            console.error('층수 정보 조회 오류:', error);
            if (axios.isAxiosError(error)) {
                console.log('상세 에러:', error.response?.data || error.message);
            }
            Alert.alert('오류', '서버 연결에 문제가 있습니다: ' + error.message);
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
        fetchFloors();
    }, []);

    // 수동 새로고침
    const onRefresh = () => {
        setRefreshing(true);
        fetchFloors();
    };

    // 층 선택 시 해당 층 상세 페이지로 이동
    const handleFloorPress = (floor: Floor) => {
        router.push({
            pathname: '/building/floor/[id]',
            params: { id: floor.floor_id },
        });
    };

    // 층수 정보가 없을 경우 더미 데이터 사용
    const renderDummyData = () => {
        const dummyFloors: Floor[] = [
            { floor_id: 1, floor_number: 1, floor_name: '1층', room_count: 3, patient_count: 5 },
            { floor_id: 2, floor_number: 2, floor_name: '2층', room_count: 5, patient_count: 8 },
            { floor_id: 3, floor_number: 3, floor_name: '3층', room_count: 4, patient_count: 7 },
            { floor_id: 4, floor_number: 4, floor_name: '4층', room_count: 2, patient_count: 3 },
            { floor_id: 5, floor_number: 5, floor_name: '5층', room_count: 1, patient_count: 1 },
        ];
        setFloors(dummyFloors);
        setLoading(false);
    };

    // 더미 데이터로 전환 (실제 서버 연결 안 될 경우)
    useEffect(() => {
        if (floors.length === 0 && !loading) {
            renderDummyData();
        }
    }, [floors, loading]);

    // 각 층 정보 렌더링
    const renderFloorItem = ({ item }: { item: Floor }) => (
        <TouchableOpacity style={styles.floorCard} onPress={() => handleFloorPress(item)}>
            <View style={styles.floorHeader}>
                <Text style={styles.floorName}>{item.floor_name}</Text>
                <Ionicons name="chevron-forward" size={24} color="#007AFF" />
            </View>

            <View style={styles.floorInfo}>
                <View style={styles.infoItem}>
                    <Ionicons name="bed-outline" size={20} color="#555" />
                    <Text style={styles.infoText}>병실 {item.room_count}개</Text>
                </View>
                <View style={styles.infoItem}>
                    <Ionicons name="people-outline" size={20} color="#555" />
                    <Text style={styles.infoText}>환자 {item.patient_count}명</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>층수 정보를 불러오는 중...</Text>
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
            <FlatList
                data={floors}
                renderItem={renderFloorItem}
                keyExtractor={(item) => item.floor_id.toString()}
                contentContainerStyle={styles.listContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="alert-circle-outline" size={48} color="#999" />
                        <Text style={styles.emptyText}>층수 정보가 없습니다.</Text>
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
    listContainer: {
        padding: 16,
    },
    floorCard: {
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
    floorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    floorName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    floorInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        marginLeft: 6,
        fontSize: 15,
        color: '#555',
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
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    statusText: {
        marginTop: 8,
        fontSize: 12,
        color: '#666',
    },
});
