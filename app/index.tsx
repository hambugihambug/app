import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
    const [isAuth, setIsAuth] = useState<boolean | null>(null);
    const router = useRouter();

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                // AsyncStorage에서 사용자 토큰 확인
                const userToken = await AsyncStorage.getItem('userToken');
                setIsAuth(!!userToken);

                // 인증 상태에 따라 적절한 화면으로 네비게이션
                if (userToken) {
                    // 인증된 사용자는 탭 화면으로 이동
                    router.replace('/(tabs)');
                } else {
                    // 인증되지 않은 사용자는 로그인 화면으로 이동
                    router.replace('/auth/login');
                }
            } catch (error) {
                console.error('인증 상태 확인 오류:', error);
                setIsAuth(false);
                // 오류 발생 시에도 로그인 화면으로 이동
                router.replace('/auth/login');
            }
        };

        checkAuthStatus();
    }, [router]);

    // 로딩 화면 표시
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>로딩 중...</Text>
        </View>
    );
}
