import { useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
    const [isAuth, setIsAuth] = useState<boolean | null>(null);
    const router = useRouter();
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        const handleAppStateChange = async (nextAppState: AppStateStatus) => {
            console.log('앱 상태 변경:', appState.current, '->', nextAppState);

            if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
                console.log('앱이 종료되거나 백그라운드로 전환됩니다.');
                try {
                    await AsyncStorage.removeItem('userToken');
                    console.log('토큰이 삭제되었습니다.');
                } catch (error) {
                    console.error('토큰 삭제 실패:', error);
                }
            }

            appState.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, []);

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                console.log('인증 상태 확인 시작...');

                // 앱 시작 시 토큰 삭제
                await AsyncStorage.removeItem('userToken');
                console.log('앱 시작: 토큰이 삭제되었습니다.');

                const userToken = await AsyncStorage.getItem('userToken');
                console.log('저장된 토큰:', userToken);

                // 토큰이 없거나 유효하지 않은 경우
                if (!userToken) {
                    console.log('토큰이 없어 로그인 페이지로 이동합니다.');
                    setIsAuth(false);
                    router.replace('/auth/login');
                    return;
                }

                // 토큰이 있는 경우
                console.log('토큰이 있어 메인 페이지로 이동합니다.');
                setIsAuth(true);
                router.replace('/(tabs)');
            } catch (error) {
                console.error('인증 상태 확인 오류:', error);
                setIsAuth(false);
                router.replace('/auth/login');
            }
        };

        checkAuthStatus();
    }, [router]);

    // 로딩 중일 때는 로딩 화면 표시
    if (isAuth === null) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>로딩 중...</Text>
            </View>
        );
    }

    // 인증되지 않은 경우 로그인 화면으로 리다이렉트
    if (!isAuth) {
        router.replace('/auth/login');
        return null;
    }

    // 인증된 경우 메인 화면으로 리다이렉트
    router.replace('/(tabs)');
    return null;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        fontSize: 18,
        color: '#666',
        marginBottom: 20,
    },
});
