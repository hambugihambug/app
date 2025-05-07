import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// 알림 핸들러 설정
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// 알림 권한 요청 함수
async function requestNotificationPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
    }

    return true;
}

// 로컬 알림 전송 함수
async function sendLocalNotification(title, body, data = {}) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // 즉시 전송
    });
}

// 테스트 알림 전송
async function testNotifications() {
    try {
        // 권한 요청
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
            console.log('알림 권한이 없습니다.');
            return;
        }

        // 테스트 알림 전송
        await sendLocalNotification('테스트 알림', '이것은 테스트 알림입니다.', { type: 'test' });

        console.log('알림이 전송되었습니다.');
    } catch (error) {
        console.error('알림 전송 실패:', error);
    }
}

// 알림 수신 리스너 설정
function setupNotificationListeners() {
    // 포그라운드 알림 수신
    const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
        console.log('포그라운드 알림 수신:', notification);
    });

    // 알림 응답 처리
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('알림 응답:', response);
    });

    return () => {
        foregroundSubscription.remove();
        responseSubscription.remove();
    };
}

// 테스트 실행
export async function runNotificationTest() {
    // 리스너 설정
    const cleanup = setupNotificationListeners();

    // 테스트 알림 전송
    await testNotifications();

    // 5초 후 리스너 정리
    setTimeout(() => {
        cleanup();
    }, 5000);
}

// 직접 실행 시 테스트 실행
if (require.main === module) {
    runNotificationTest();
}
