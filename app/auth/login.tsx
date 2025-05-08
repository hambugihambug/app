import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '../config';
import { Ionicons } from '@expo/vector-icons';
import SafeArea from '../../components/common/SafeArea';

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

                // 마이페이지에서 사용할 추가 정보 저장
                await AsyncStorage.setItem('userEmail', email);
                await AsyncStorage.setItem('userName', response.data.user_name || email.split('@')[0]);

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
        <SafeArea>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.container}>
                        <View style={styles.logoContainer}>
                            <Ionicons name="medical" size={50} color="#1E6091" />
                            <Text style={styles.logoText}>병원 모니터링 시스템</Text>
                        </View>

                        <View style={styles.formCard}>
                            <Text style={styles.title}>로그인</Text>

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
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={22}
                                    color="#64748B"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={[styles.input, passwordError ? styles.inputError : null]}
                                    placeholder="비밀번호"
                                    value={password}
                                    onChangeText={validatePassword}
                                    secureTextEntry
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
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
    loginButton: {
        backgroundColor: '#1E6091',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 16,
    },
    loginButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 8,
    },
    signupText: {
        color: '#64748B',
    },
    signupLink: {
        color: '#1E6091',
        fontWeight: 'bold',
    },
});
