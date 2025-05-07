import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '../config';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const router = useRouter();

    // 이메일 유효성 검사
    const validateEmail = (text: string) => {
        setEmail(text);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!text) {
            setEmailError('이메일을 입력해주세요');
        } else if (!emailRegex.test(text)) {
            setEmailError('올바른 이메일 형식이 아닙니다');
        } else {
            setEmailError('');
        }
    };

    // 비밀번호 유효성 검사
    const validatePassword = (text: string) => {
        setPassword(text);
        if (!text) {
            setPasswordError('비밀번호를 입력해주세요');
        } else if (text.length < 6) {
            setPasswordError('비밀번호는 최소 6자 이상이어야 합니다');
        } else {
            setPasswordError('');
        }
    };

    const handleLogin = async () => {
        // 폼 전체 유효성 검사
        let isValid = true;

        if (!email) {
            setEmailError('이메일을 입력해주세요');
            isValid = false;
        }

        if (!password) {
            setPasswordError('비밀번호를 입력해주세요');
            isValid = false;
        }

        if (!isValid || emailError || passwordError) {
            Alert.alert('오류', '모든 필드를 올바르게 입력해주세요.');
            return;
        }

        try {
            // API 엔드포인트 수정
            const response = await axios.post(`${config.API_URL}/users/login`, {
                user_email: email,
                user_pw: password,
            });

            if (response.status === 200 && response.data) {
                console.log('로그인 성공:', response.data);

                // 사용자 정보 저장
                await AsyncStorage.setItem('userToken', response.data.token || 'token');
                await AsyncStorage.setItem('userId', response.data.user_id.toString());
                await AsyncStorage.setItem('userRole', response.data.user_role || 'user');

                // 메인 화면으로 이동
                router.replace('/(tabs)');
            } else {
                Alert.alert('로그인 실패', '아이디 또는 비밀번호가 올바르지 않습니다.');
            }
        } catch (error) {
            console.error('로그인 요청 오류:', error);
            Alert.alert('로그인 실패', '서버 연결에 문제가 있거나 계정 정보가 올바르지 않습니다.');
        }
    };

    const navigateToSignup = () => {
        router.push('./signup');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>로그인</Text>
            <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                placeholder="이메일"
                value={email}
                onChangeText={validateEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            <TextInput
                style={[styles.input, passwordError ? styles.inputError : null]}
                placeholder="비밀번호"
                value={password}
                onChangeText={validatePassword}
                secureTextEntry
            />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

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
        marginBottom: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
    },
    inputError: {
        borderColor: 'red',
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginBottom: 10,
        marginLeft: 5,
    },
    loginButton: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
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
