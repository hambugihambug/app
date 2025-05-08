import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import config from '../config';
import { Ionicons } from '@expo/vector-icons';
import SafeArea from '../../components/common/SafeArea';

// API 서버 주소 설정
let API_URL;
if (Platform.OS === 'ios') {
    // iOS 시뮬레이터는 localhost를 사용하거나 실제 IP 주소를 사용
    API_URL = 'http://192.168.1.112:3000';
} else if (Platform.OS === 'android') {
    // 안드로이드 에뮬레이터는 10.0.2.2를 사용하여 호스트 머신에 접근
    API_URL = 'http://10.32.31.235:3000';
} else {
    // 기타 플랫폼
    API_URL = 'http://10.32.31.235:3000';
}

// 실제 DB 서버 IP 주소 (네트워크 환경에 따라 다를 수 있음)
const DB_SERVER_URL = 'http://192.168.1.114:3000';

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

        if (!email) {
            setEmailError('이메일을 입력해주세요');
            isValid = false;
        }

        if (!password) {
            setPasswordError('비밀번호를 입력해주세요');
            isValid = false;
        }

        if (!confirmPassword) {
            setConfirmPasswordError('비밀번호 확인을 입력해주세요');
            isValid = false;
        }

        if (!name) {
            setNameError('이름을 입력해주세요');
            isValid = false;
        }

        if (!isValid || emailError || passwordError || confirmPasswordError || nameError) {
            Alert.alert('오류', '모든 필드를 올바르게 입력해주세요.');
            return;
        }

        try {
            const response = await axios.post(`${config.API_URL}/users/signup`, {
                user_email: email,
                user_pw: password,
                user_name: name,
                user_role: 'user',
            });

            if (response.status === 201) {
                Alert.alert('회원가입 성공', '회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.', [
                    {
                        text: '확인',
                        onPress: () => {
                            // 입력 필드 초기화
                            setEmail('');
                            setPassword('');
                            setConfirmPassword('');
                            setName('');
                            // 로그인 페이지로 이동
                            router.replace('/auth/login');
                        },
                    },
                ]);
            }
        } catch (error) {
            console.error('회원가입 요청 오류:', error);
            Alert.alert('회원가입 실패', '서버 연결에 문제가 있거나 이미 존재하는 이메일입니다.');
        }
    };

    const navigateToLogin = () => {
        router.back();
    };

    return (
        <SafeArea>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.container}>
                        <View style={styles.logoContainer}>
                            <Ionicons name="medical" size={50} color="#1E6091" />
                            <Text style={styles.logoText}>병원 모니터링 시스템</Text>
                        </View>

                        <View style={styles.formCard}>
                            <Text style={styles.title}>회원가입</Text>

                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={22} color="#64748B" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, emailError ? styles.inputError : null]}
                                    placeholder="이메일"
                                    value={email}
                                    onChangeText={validateEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={22} color="#64748B" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, nameError ? styles.inputError : null]}
                                    placeholder="이름"
                                    value={name}
                                    onChangeText={validateName}
                                    autoCapitalize="none"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

                            <View style={styles.inputContainer}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={22}
                                    color="#64748B"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={[styles.input, passwordError ? styles.inputError : null]}
                                    placeholder="비밀번호 (최소 8자, 문자, 숫자, 특수문자 포함)"
                                    value={password}
                                    onChangeText={validatePassword}
                                    secureTextEntry
                                    textContentType="oneTimeCode"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                            <View style={styles.inputContainer}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={22}
                                    color="#64748B"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={[styles.input, confirmPasswordError ? styles.inputError : null]}
                                    placeholder="비밀번호 확인"
                                    value={confirmPassword}
                                    onChangeText={validateConfirmPassword}
                                    secureTextEntry
                                    textContentType="oneTimeCode"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
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
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeArea>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F8FAFC',
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 30,
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E6091',
        marginTop: 10,
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        marginBottom: 30,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 24,
        color: '#1E293B',
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        marginBottom: 12,
        backgroundColor: '#F8FAFC',
    },
    inputIcon: {
        padding: 10,
    },
    input: {
        flex: 1,
        height: 50,
        paddingHorizontal: 10,
        color: '#0F172A',
    },
    inputError: {
        borderColor: '#E11D48',
    },
    errorText: {
        color: '#E11D48',
        fontSize: 12,
        marginBottom: 10,
        marginLeft: 5,
    },
    signupButton: {
        backgroundColor: '#1E6091',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 16,
    },
    signupButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 8,
    },
    loginText: {
        color: '#64748B',
    },
    loginLink: {
        color: '#1E6091',
        fontWeight: 'bold',
    },
});
