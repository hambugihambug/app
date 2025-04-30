import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';

// API 서버 주소 설정
let API_URL;
if (Platform.OS === 'ios') {
    // iOS 시뮬레이터는 localhost를 사용하거나 실제 IP 주소를 사용
    API_URL = 'http://10.32.31.235:3000';
} else if (Platform.OS === 'android') {
    // 안드로이드 에뮬레이터는 10.0.2.2를 사용하여 호스트 머신에 접근
    API_URL = 'http://10.32.31.235:3000';
} else {
    // 기타 플랫폼
    API_URL = 'http://10.32.31.235:3000';
}

// 실제 DB 서버 IP 주소 (네트워크 환경에 따라 다를 수 있음)
const DB_SERVER_URL = 'http://10.32.31.235:3000';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // 유효성 검사 에러 상태 추가
    const [emailError, setEmailError] = useState('');
    const [nameError, setNameError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

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

    // 이름 유효성 검사
    const validateName = (text: string) => {
        setName(text);
        if (!text) {
            setNameError('이름을 입력해주세요');
        } else if (text.length < 2) {
            setNameError('이름은 최소 2자 이상이어야 합니다');
        } else {
            setNameError('');
        }
    };

    // 비밀번호 유효성 검사
    const validatePassword = (text: string) => {
        setPassword(text);

        // 비밀번호 규칙: 최소 8자, 최소 하나의 문자, 하나의 숫자, 하나의 특수 문자
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

        if (!text) {
            setPasswordError('비밀번호를 입력해주세요');
        } else if (text.length < 8) {
            setPasswordError('비밀번호는 최소 8자 이상이어야 합니다');
        } else if (!passwordRegex.test(text)) {
            setPasswordError('비밀번호는 문자, 숫자, 특수문자를 모두 포함해야 합니다');
        } else {
            setPasswordError('');
        }

        // 비밀번호가 변경되면 확인 비밀번호도 검증
        if (confirmPassword) {
            validateConfirmPassword(confirmPassword);
        }
    };

    // 비밀번호 확인 유효성 검사
    const validateConfirmPassword = (text: string) => {
        setConfirmPassword(text);
        if (!text) {
            setConfirmPasswordError('비밀번호 확인을 입력해주세요');
        } else if (text !== password) {
            setConfirmPasswordError('비밀번호가 일치하지 않습니다');
        } else {
            setConfirmPasswordError('');
        }
    };

    const handleSignup = async () => {
        // 폼 전체 유효성 검사
        let isValid = true;

        // 이메일 검사
        if (!email) {
            setEmailError('이메일을 입력해주세요');
            isValid = false;
        }

        // 이름 검사
        if (!name) {
            setNameError('이름을 입력해주세요');
            isValid = false;
        }

        // 비밀번호 검사
        if (!password) {
            setPasswordError('비밀번호를 입력해주세요');
            isValid = false;
        }

        // 비밀번호 확인 검사
        if (!confirmPassword) {
            setConfirmPasswordError('비밀번호 확인을 입력해주세요');
            isValid = false;
        } else if (password !== confirmPassword) {
            setConfirmPasswordError('비밀번호가 일치하지 않습니다');
            isValid = false;
        }

        // 유효성 검사 실패 시 진행하지 않음
        if (!isValid || emailError || nameError || passwordError || confirmPasswordError) {
            Alert.alert('오류', '모든 필드를 올바르게 입력해주세요.');
            return;
        }

        try {
            console.log('회원가입 요청 시작:', { name, email });

            // DB의 user 테이블에 새 사용자 추가
            const response = await axios.post(
                `${DB_SERVER_URL}/api/auth/signup`,
                {
                    user_name: name,
                    user_email: email,
                    user_pw: password,
                    user_role: 'user', // 기본 역할 설정
                },
                {
                    timeout: 10000, // 10초 타임아웃 설정
                }
            );

            console.log('회원가입 응답:', response.status, response.data);

            if (response.status === 201) {
                console.log('회원가입 성공:', response.data);
                Alert.alert('성공', '회원가입이 완료되었습니다.');
                // 로그인 페이지로 돌아가기
                router.back();
            } else {
                Alert.alert('회원가입 실패', response.data?.message || '알 수 없는 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('회원가입 요청 오류:', error);
            if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
                Alert.alert('회원가입 실패', '서버 연결 시간이 초과되었습니다. 나중에 다시 시도해주세요.');
            } else if (axios.isAxiosError(error) && error.response) {
                Alert.alert('회원가입 실패', error.response.data?.message || '서버 오류가 발생했습니다.');
            } else {
                Alert.alert('회원가입 실패', '서버 연결에 문제가 있습니다. 네트워크 연결을 확인해주세요.');
            }
        }
    };

    const navigateToLogin = () => {
        router.back();
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <Text style={styles.title}>회원가입</Text>

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
                    style={[styles.input, nameError ? styles.inputError : null]}
                    placeholder="이름"
                    value={name}
                    onChangeText={validateName}
                    autoCapitalize="none"
                />
                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

                <TextInput
                    style={[styles.input, passwordError ? styles.inputError : null]}
                    placeholder="비밀번호 (최소 8자, 문자, 숫자, 특수문자 포함)"
                    value={password}
                    onChangeText={validatePassword}
                    secureTextEntry
                    textContentType="oneTimeCode"
                />
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                <TextInput
                    style={[styles.input, confirmPasswordError ? styles.inputError : null]}
                    placeholder="비밀번호 확인"
                    value={confirmPassword}
                    onChangeText={validateConfirmPassword}
                    secureTextEntry
                    textContentType="oneTimeCode"
                />
                {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}

                <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
                    <Text style={styles.signupButtonText}>회원가입</Text>
                </TouchableOpacity>

                <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>이미 계정이 있으신가요? </Text>
                    <TouchableOpacity onPress={navigateToLogin}>
                        <Text style={styles.loginLink}>로그인</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
    },
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
    signupButton: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    signupButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 15,
    },
    loginText: {
        color: '#666',
    },
    loginLink: {
        color: '#007bff',
        fontWeight: 'bold',
    },
});
