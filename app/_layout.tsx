import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import 'react-native-reanimated';
import { Alert, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';
import { registerForPushNotificationsAsync } from '../utils/notifications';

// 알림 응답 처리 설정
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const [loaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });
    const [isAuth, setIsAuth] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expoPushToken, setExpoPushToken] = useState<string>();
    const notificationListener = useRef<any>();
    const responseListener = useRef<any>();

    useEffect(() => {
        // AsyncStorage를 사용한 인증 상태 확인
        const checkAuthStatus = async () => {
            try {
                const userToken = await AsyncStorage.getItem('userToken');
                setIsAuth(!!userToken);
            } catch (error) {
                console.error('인증 상태 확인 오류:', error);
                setIsAuth(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    // Expo 푸시 알림 설정
    useEffect(() => {
        if (loaded) {
            // 푸시 알림 등록
            registerForPushNotificationsAsync().then((token) => {
                if (token) {
                    setExpoPushToken(token.data);
                    console.log('Expo 푸시 토큰:', token.data);
                }
            });

            // 알림 수신 리스너
            notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
                console.log('알림 수신:', notification);
            });

            // 알림 응답 리스너
            responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
                console.log('알림 응답:', response);
                const data = response.notification.request.content.data as any;
                if (data && data.roomId) {
                    // 알림을 탭했을 때 해당 병실로 이동하는 로직
                    // (추후 라우팅 로직 구현 필요)
                }
            });

            return () => {
                // 컴포넌트 언마운트 시 리스너 정리
                Notifications.removeNotificationSubscription(notificationListener.current);
                Notifications.removeNotificationSubscription(responseListener.current);
            };
        }
    }, [loaded]);

    if (!loaded || isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>로딩 중...</Text>
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <StatusBar style="dark" />
                <Stack>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="auth" options={{ headerShown: false }} />
                    {isAuth && <Stack.Screen name="(tabs)" options={{ headerShown: false }} />}
                    <Stack.Screen name="+not-found" options={{ title: '페이지를 찾을 수 없음' }} />
                </Stack>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
