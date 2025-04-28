import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import firebaseConfig from '../firebase/config.js';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';

export const screenOptions = {
    headerShown: false,
};

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    // Firebase 초기화
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('오류', '이메일과 비밀번호를 모두 입력해주세요.');
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('로그인 성공:', user.email);

            // Firebase ID 토큰 가져오기
            const idToken = await user.getIdToken();
            console.log('ID Token:', idToken);

            // Express 서버에 토큰 보내기
            // 네트워크 주소 변경 필요
            const response = await fetch('http://172.30.1.58:3000/profile', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();
            console.log('서버 응답:', result);

            if (response.ok) {
                router.replace('/(tabs)');
            } else {
                Alert.alert('서버 오류', result?.error || '알 수 없는 오류');
            }
        } catch (error) {
            if (error instanceof Error) {
                Alert.alert('로그인 실패', error.message);
            } else {
                Alert.alert('로그인 실패', '알 수 없는 오류가 발생했습니다.');
            }
        }
    };

    const navigateToSignup = () => {
        router.push('./SignUp');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>로그인</Text>
            <TextInput
                style={styles.input}
                placeholder="이메일"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                placeholder="비밀번호"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>로그인</Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
                <Text style={styles.signupText}>아이디가 없으신가요? </Text>
                <TouchableOpacity onPress={navigateToSignup}>
                    <Text style={styles.signupLink}>회원가입</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        height: 50,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 15,
        paddingHorizontal: 10,
        borderRadius: 5,
    },
    loginButton: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
    },
    loginButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 15,
    },
    signupText: {
        color: '#666',
    },
    signupLink: {
        color: '#007bff',
        fontWeight: 'bold',
    },
});
