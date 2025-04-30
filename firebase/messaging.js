import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { auth } from './config.js';

// Expo 푸시 알림 권한 요청 및 토큰 가져오기
export async function registerForPushNotifications() {
    let token;

    if (Device.isDevice) {
        // 권한 확인
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // 권한이 없으면 요청
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        // 권한이 없으면 알림
        if (finalStatus !== 'granted') {
            console.log('푸시 알림 권한이 없습니다!');
            return;
        }

        // Expo 토큰 가져오기
        token = (
            await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig.extra.eas.projectId,
            })
        ).data;

        // 토큰을 서버에 저장
        await saveTokenToServer(token);
    } else {
        console.log('실제 기기에서만 푸시 알림을 사용할 수 있습니다');
    }

    // Android 채널 설정
    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: '기본 알림',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    return token;
}

// 토큰 서버에 저장
export async function saveTokenToServer(token) {
    try {
        // 현재 로그인한 환자 정보 가져오기
        const patientInfo = await AsyncStorage.getItem('patientInfo');
        console.log('환자 정보 확인:', patientInfo);

        const patientId = patientInfo ? JSON.parse(patientInfo).patient_id : null;

        if (!patientId) {
            console.error('환자 정보가 없습니다. 로그인이 필요합니다.');
            return false;
        }

        console.log(`환자 ID ${patientId}에 대한 토큰 저장 시도`);

        // API를 통해 서버에 토큰 저장
        const response = await API.device.register(token, 'expo', patientId);

        console.log('서버 응답:', JSON.stringify(response));
        console.log('토큰이 서버에 저장되었습니다:', token.substring(0, 10) + '...');
        return true;
    } catch (error) {
        console.error('토큰 저장 실패:', error);
        console.error('에러 상세 정보:', error.message);

        if (error.response) {
            // 서버가 응답을 반환한 경우
            console.error('서버 응답 상태:', error.response.status);
            console.error('서버 응답 데이터:', error.response.data);
        } else if (error.request) {
            // 요청은 전송되었지만 응답을 받지 못한 경우
            console.error('서버로부터 응답 없음:', error.request);
        }

        return false;
    }
}

// 알림 처리 핸들러 설정
export function setupNotifications() {
    // 포그라운드 알림 핸들러
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });

    // 알림 응답 리스너
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('알림 응답:', response);
        // 알림 클릭 시 처리할 내용 (예: 특정 화면으로 이동)
    });

    // 메모리 누수 방지를 위한 클린업 함수 반환
    return () => {
        Notifications.removeNotificationSubscription(responseListener);
    };
}

// 수동으로 알림 가져오기
export async function fetchNotifications() {
    try {
        const alerts = await API.alerts.getEmergency();
        return alerts;
    } catch (error) {
        console.error('알림 가져오기 실패:', error);
        return [];
    }
}
