import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { Alert, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/useColorScheme';
import { registerForPushNotifications, setupNotifications } from '../firebase/messaging';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const [loaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });
    const [isAuth, setIsAuth] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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

    // 푸시 알림 설정
    useEffect(() => {
        if (loaded && isAuth) {
            // 푸시 알림 등록
            const registerPush = async () => {
                try {
                    const token = await registerForPushNotifications();
                    if (token) {
                        Alert.alert('알림', `FCM 토큰이 정상적으로 등록되었습니다: ${token.substring(0, 10)}...`);
                    } else {
                        Alert.alert('알림', 'FCM 토큰 등록에 실패했습니다.');
                    }
                } catch (error: any) {
                    Alert.alert('알림', `FCM 토큰 등록 중 오류가 발생했습니다: ${error.message}`);
                }
            };

            registerPush();

            // 알림 핸들러 설정
            const unsubscribe = setupNotifications();

            return () => {
                // 컴포넌트 언마운트 시 정리
                if (unsubscribe) unsubscribe();
            };
        }
    }, [loaded, isAuth]);

    if (!loaded || isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>로딩 중...</Text>
            </View>
        );
    }

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="auth" options={{ headerShown: false }} />
                {isAuth && <Stack.Screen name="(tabs)" options={{ headerShown: false }} />}
                <Stack.Screen name="+not-found" options={{ title: '페이지를 찾을 수 없음' }} />
            </Stack>
            <StatusBar style="auto" />
        </ThemeProvider>
    );
}
