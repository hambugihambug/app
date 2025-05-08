import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// 알림 응답 처리 설정
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

// 푸시 알림 토큰 가져오기
export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        // Android 13 이상에서는 알림 권한 필요
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('알림 권한을 획득하지 못했습니다!');
            return;
        }

        token = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        console.log('Expo 푸시 토큰:', token);
    } else {
        console.log('실제 기기에서만 푸시 알림을 사용할 수 있습니다');
    }

    return token;
}

// 로컬 알림 보내기
export async function sendLocalNotification(title: string, body: string, data = {}) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data,
            sound: true,
        },
        trigger: null, // 즉시 발송
    });
}

// 알림 리스너 설정 (알림 도착 및 응답 처리)
export function setNotificationListeners(
    notificationListener: (notification: Notifications.Notification) => void,
    responseListener: (response: Notifications.NotificationResponse) => void
) {
    const notificationReceivedListener = Notifications.addNotificationReceivedListener(notificationListener);

    const notificationResponseListener = Notifications.addNotificationResponseReceivedListener(responseListener);

    return { notificationReceivedListener, notificationResponseListener };
}

// 알림 리스너 해제
export function removeNotificationListeners(listeners: any) {
    if (listeners?.notificationReceivedListener) {
        Notifications.removeNotificationSubscription(listeners.notificationReceivedListener);
    }

    if (listeners?.notificationResponseListener) {
        Notifications.removeNotificationSubscription(listeners.notificationResponseListener);
    }
}
