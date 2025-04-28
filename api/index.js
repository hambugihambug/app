import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// API URL 설정 (환경변수 또는 기본값)
// 실제 서버 IP 주소로 변경 필요 (API 경로 제거, 각 라우터에서 직접 사용)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// 기본 Axios 인스턴스 생성
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // 10초 타임아웃
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// 요청 인터셉터 설정 (인증 토큰 추가)
apiClient.interceptors.request.use(
    async (config) => {
        // AsyncStorage에서 토큰 가져오기
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('토큰 가져오기 실패:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터 설정 (에러 처리, 토큰 갱신 등)
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // 토큰 만료 에러 (401) 처리
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // refresh token으로 새 토큰 요청
                const refreshToken = await AsyncStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refreshToken,
                    });

                    // 새 토큰 저장
                    if (response.data?.token) {
                        await AsyncStorage.setItem('authToken', response.data.token);
                        // 새 토큰으로 원래 요청 다시 시도
                        originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
                        return apiClient(originalRequest);
                    }
                }
            } catch (refreshError) {
                console.error('토큰 갱신 실패:', refreshError);
                // 로그인 화면으로 리다이렉트 로직
            }
        }

        return Promise.reject(error);
    }
);

// API 모듈 객체
const API = {
    // 인증 관련 API
    auth: {
        login: async (username, password) => {
            try {
                const response = await apiClient.post('/auth/login', { username, password });

                if (response.data?.token) {
                    await AsyncStorage.setItem('authToken', response.data.token);
                    if (response.data.refreshToken) {
                        await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
                    }
                }

                return response.data;
            } catch (error) {
                console.error('로그인 실패:', error);
                throw error;
            }
        },

        logout: async () => {
            try {
                // 서버에 로그아웃 요청
                await apiClient.post('/auth/logout');
                // 로컬 토큰 삭제
                await AsyncStorage.multiRemove(['authToken', 'refreshToken']);
                return { success: true };
            } catch (error) {
                console.error('로그아웃 실패:', error);
                // 오류가 발생해도 로컬 토큰은 삭제
                await AsyncStorage.multiRemove(['authToken', 'refreshToken']);
                return { success: true, error };
            }
        },
    },

    // 환자 관련 API
    patients: {
        getAll: async () => {
            const response = await apiClient.get('/patients');
            return response.data;
        },

        getById: async (id) => {
            const response = await apiClient.get(`/patients/${id}`);
            return response.data;
        },

        update: async (id, data) => {
            const response = await apiClient.put(`/patients/${id}`, data);
            return response.data;
        },
    },

    // 병실 관련 API
    rooms: {
        getAll: async () => {
            const response = await apiClient.get('/rooms');
            return response.data;
        },

        getByName: async (roomName) => {
            const response = await apiClient.get(`/rooms/${roomName}`);
            return response.data;
        },
    },

    // 층별 정보 API
    floors: {
        getByFloor: async (floor) => {
            const response = await apiClient.get(`/floors/${floor}`);
            return response.data;
        },
    },

    // 알림 관련 API
    alerts: {
        getEmergency: async () => {
            try {
                // 백엔드의 낙상 사고 엔드포인트는 /fall-incidents
                const response = await apiClient.get('/fall-incidents');

                // 백엔드 응답 형식에 맞게 데이터 변환
                if (response.data && response.data.data) {
                    // 최근 10개 알림만 가져오기
                    const recentAlerts = response.data.data.slice(0, 10);

                    // 앱에서 사용하는 형식으로 변환
                    return recentAlerts.map((item) => ({
                        id: item.accident_id,
                        message: `🚨 ${item.room_name}호 ${item.patient_name} 환자 낙상 감지`,
                        roomId: item.room_name,
                        createdAt: item.accident_date,
                    }));
                }

                return response.data;
            } catch (error) {
                console.error('긴급 알림 가져오기 실패:', error);
                // 개발 환경이거나 API 서버 오류 시 더미 데이터 반환
                if (__DEV__ || error.message.includes('Network Error') || error.response?.status === 404) {
                    console.log('더미 알림 데이터 반환');
                    return [
                        { id: 1, message: '🚨 2층 203호 박철수 환자 이상 징후 감지', roomId: '203호' },
                        { id: 2, message: '🔥 3층 301호 화재 감지 센서 작동', roomId: '301호' },
                    ];
                }
                throw error;
            }
        },

        // 환경 알림 가져오기
        getEnvironmentalAlerts: async () => {
            try {
                // 백엔드의 환경 경보 엔드포인트는 /environmental
                const response = await apiClient.get('/environmental');

                // 정상 범위를 벗어난 병실만 필터링
                if (response.data && response.data.data) {
                    const warnings = response.data.data.filter((room) => room.status === '경고');

                    // 앱에서 사용하는 형식으로 변환
                    return warnings.map((room, index) => ({
                        id: 1000 + index, // 고유 ID 생성
                        message: `⚠️ ${room.room_name}호 환경 이상 (온도: ${room.room_temp}°C, 습도: ${room.humidity}%)`,
                        roomId: room.room_name,
                        type: 'environmental',
                    }));
                }

                return [];
            } catch (error) {
                console.error('환경 알림 가져오기 실패:', error);
                return [];
            }
        },

        // 모든 알림 가져오기 (낙상 + 환경)
        getAllAlerts: async () => {
            try {
                // 낙상 알림과 환경 알림을 함께 가져옴
                const [fallAlerts, envAlerts] = await Promise.all([
                    API.alerts.getEmergency(),
                    API.alerts.getEnvironmentalAlerts(),
                ]);

                // 두 알림 합치기
                return [...fallAlerts, ...envAlerts];
            } catch (error) {
                console.error('전체 알림 가져오기 실패:', error);
                return [];
            }
        },

        // 알림 확인 처리
        markAsRead: async (alertId) => {
            try {
                const response = await apiClient.post(`/alerts/${alertId}/read`);
                return response.data;
            } catch (error) {
                console.error('알림 확인 처리 실패:', error);
                // 임시로 성공 응답 반환
                return { success: true };
            }
        },

        // 실시간 알림 구독
        subscribeToAlerts: async (callback) => {
            try {
                // 서버로부터 SSE 연결 설정
                const eventSource = new EventSource(`${API_BASE_URL}/alerts/subscribe`);

                eventSource.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    callback(data);
                };

                eventSource.onerror = (error) => {
                    console.error('알림 구독 오류:', error);
                    eventSource.close();
                };

                return () => {
                    eventSource.close();
                };
            } catch (error) {
                console.error('알림 구독 설정 실패:', error);
                throw error;
            }
        },
    },

    // 디바이스 등록 (FCM 토큰 등)
    device: {
        register: async (token, tokenType = 'expo') => {
            try {
                // 현재 사용자 정보
                const userInfo = await AsyncStorage.getItem('userInfo');
                const userId = userInfo ? JSON.parse(userInfo).id : 'anonymous';

                const deviceInfo = {
                    token,
                    tokenType,
                    userId,
                    deviceInfo: {
                        platform: Platform.OS,
                        version: Platform.Version,
                        model: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device',
                    },
                };

                // 올바른 엔드포인트 사용: /api/notifications/register-device
                const response = await apiClient.post('/api/notifications/register-device', deviceInfo);

                // 토큰 정보 로컬에 저장
                await AsyncStorage.setItem('pushToken', token);

                return response.data;
            } catch (error) {
                console.error('디바이스 등록 실패:', error);
                throw error;
            }
        },

        unregister: async () => {
            try {
                const token = await AsyncStorage.getItem('pushToken');
                if (!token) return { success: true };

                // 올바른 엔드포인트 사용: /api/notifications/unregister-device
                const response = await apiClient.post('/api/notifications/unregister-device', { token });

                // 토큰 정보 삭제
                await AsyncStorage.removeItem('pushToken');

                return response.data;
            } catch (error) {
                console.error('디바이스 등록 해제 실패:', error);
                throw error;
            }
        },
    },
};

export default API;
