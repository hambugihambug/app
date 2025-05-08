import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import config from '../config';
import SafeArea from '../../components/common/SafeArea';

interface UserInfo {
    user_id: number;
    user_name: string;
    user_email: string;
    user_role: string;
    user_img?: string;
}

export default function MyPage() {
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadUserInfo();
    }, []);

    // 사용자 정보 불러오기
    const loadUserInfo = async () => {
        try {
            setLoading(true);

            // AsyncStorage에서 유저 정보 가져오기
            const userId = await AsyncStorage.getItem('userId');
            const userRole = await AsyncStorage.getItem('userRole');
            const userToken = await AsyncStorage.getItem('userToken');

            // 기존 로그인 시 저장된 사용자 정보가 있는지 확인
            let userData: UserInfo | null = null;

            // 1. API 호출 시도
            if (userId && userToken) {
                try {
                    // 백엔드 서버의 실제 사용자 정보 API 경로 - 환자 API와 유사한 형태로 가정
                    const response = await axios.get(`${config.API_URL}/api/users/${userId}`, {
                        headers: {
                            Authorization: `Bearer ${userToken}`,
                        },
                    });

                    if (response.data && response.data.code === 0) {
                        userData = response.data.data;
                    }
                } catch (apiError) {
                    console.log('API 호출 실패, 로컬 데이터 사용:', apiError);
                    // API 호출 실패 시 로컬 저장 데이터 사용
                }
            }

            // 2. 로컬에 저장된 사용자 기본 정보 사용 (API 실패 시 대체)
            if (!userData && userId) {
                const userEmail = (await AsyncStorage.getItem('userEmail')) || '';
                const userName = (await AsyncStorage.getItem('userName')) || '사용자';

                userData = {
                    user_id: parseInt(userId),
                    user_name: userName,
                    user_email: userEmail,
                    user_role: userRole || '사용자',
                };
            }

            if (userData) {
                setUserInfo(userData);
            } else {
                setError('사용자 인증 정보가 없습니다. 다시 로그인해주세요.');
            }
        } catch (error) {
            console.error('사용자 정보 로드 실패:', error);
            setError('데이터를 불러오는데 문제가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 로그아웃 처리
    const handleLogout = async () => {
        Alert.alert(
            '로그아웃',
            '정말 로그아웃 하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '확인',
                    onPress: async () => {
                        try {
                            // 모든 사용자 관련 데이터 삭제
                            const keysToRemove = [
                                'userToken',
                                'userId',
                                'userRole',
                                'userName',
                                'userEmail',
                                'userInfo',
                            ];
                            await AsyncStorage.multiRemove(keysToRemove);
                            router.replace('../auth');
                        } catch (error) {
                            console.error('로그아웃 실패:', error);
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    if (loading) {
        return (
            <SafeArea>
                <View style={[styles.container, styles.loadingContainer]}>
                    <ActivityIndicator size="large" color="#1E6091" />
                    <Text style={styles.loadingText}>사용자 정보를 불러오는 중...</Text>
                </View>
            </SafeArea>
        );
    }

    if (error) {
        return (
            <SafeArea>
                <View style={[styles.container, styles.errorContainer]}>
                    <Ionicons name="alert-circle" size={50} color="#E11D48" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadUserInfo}>
                        <Text style={styles.retryButtonText}>다시 시도</Text>
                    </TouchableOpacity>
                </View>
            </SafeArea>
        );
    }

    if (!userInfo) {
        return (
            <SafeArea>
                <View style={[styles.container, styles.errorContainer]}>
                    <Ionicons name="person-outline" size={50} color="#64748B" />
                    <Text style={styles.errorText}>사용자 정보를 찾을 수 없습니다.</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('../auth')}>
                        <Text style={styles.retryButtonText}>로그인하기</Text>
                    </TouchableOpacity>
                </View>
            </SafeArea>
        );
    }

    // 사용자 역할에 따른 배지 색상 설정
    const getRoleBadgeStyle = () => {
        switch (userInfo.user_role) {
            case '의사':
                return {
                    backgroundColor: '#EBF4FF',
                    borderColor: '#1E6091',
                    textColor: '#1E6091',
                };
            case '간호사':
                return {
                    backgroundColor: '#E8F5E9',
                    borderColor: '#2E7D32',
                    textColor: '#2E7D32',
                };
            case '관리자':
                return {
                    backgroundColor: '#EDE9FE',
                    borderColor: '#6D28D9',
                    textColor: '#6D28D9',
                };
            default:
                return {
                    backgroundColor: '#F3F4F6',
                    borderColor: '#64748B',
                    textColor: '#64748B',
                };
        }
    };

    const roleBadgeStyle = getRoleBadgeStyle();

    return (
        <SafeArea>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <View style={styles.headerContainer}>
                    <Text style={styles.headerTitle}>마이페이지</Text>
                </View>

                <View style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        <View style={styles.imageContainer}>
                            {userInfo.user_img ? (
                                <Image
                                    source={{ uri: `${config.API_URL}${userInfo.user_img}` }}
                                    style={styles.profileImage}
                                />
                            ) : (
                                <View style={styles.placeholderImage}>
                                    <Ionicons name="person" size={40} color="#94A3B8" />
                                </View>
                            )}
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.userName}>{userInfo.user_name}</Text>
                            <View
                                style={[
                                    styles.roleBadge,
                                    {
                                        backgroundColor: roleBadgeStyle.backgroundColor,
                                        borderColor: roleBadgeStyle.borderColor,
                                    },
                                ]}
                            >
                                <Text style={[styles.roleText, { color: roleBadgeStyle.textColor }]}>
                                    {userInfo.user_role}
                                </Text>
                            </View>
                            <Text style={styles.userEmail}>{userInfo.user_email}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="settings-outline" size={20} color="#1E6091" />
                        <Text style={styles.sectionTitle}>계정 설정</Text>
                    </View>
                    <View style={styles.sectionContent}>
                        <TouchableOpacity style={styles.menuItem}>
                            <View style={styles.menuIconContainer}>
                                <Ionicons name="person-outline" size={20} color="#1E6091" />
                            </View>
                            <Text style={styles.menuText}>프로필 정보 수정</Text>
                            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem}>
                            <View style={styles.menuIconContainer}>
                                <Ionicons name="notifications-outline" size={20} color="#1E6091" />
                            </View>
                            <Text style={styles.menuText}>알림 설정</Text>
                            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem}>
                            <View style={styles.menuIconContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#1E6091" />
                            </View>
                            <Text style={styles.menuText}>암호 변경</Text>
                            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="information-circle-outline" size={20} color="#1E6091" />
                        <Text style={styles.sectionTitle}>앱 정보</Text>
                    </View>
                    <View style={styles.sectionContent}>
                        <TouchableOpacity style={styles.menuItem}>
                            <View style={styles.menuIconContainer}>
                                <Ionicons name="code-outline" size={20} color="#1E6091" />
                            </View>
                            <Text style={styles.menuText}>앱 버전</Text>
                            <Text style={styles.versionText}>1.0.0</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem}>
                            <View style={styles.menuIconContainer}>
                                <Ionicons name="help-circle-outline" size={20} color="#1E6091" />
                            </View>
                            <Text style={styles.menuText}>도움말</Text>
                            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem}>
                            <View style={styles.menuIconContainer}>
                                <Ionicons name="shield-outline" size={20} color="#1E6091" />
                            </View>
                            <Text style={styles.menuText}>개인정보 보호정책</Text>
                            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.logoutText}>로그아웃</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeArea>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        paddingBottom: 30,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        color: '#1E6091',
        fontSize: 16,
    },
    errorContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: '#E11D48',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#1E6091',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerContainer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E6091',
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    imageContainer: {
        marginRight: 16,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    placeholderImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 4,
    },
    roleBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
    },
    userEmail: {
        fontSize: 14,
        color: '#64748B',
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E6091',
        marginLeft: 8,
    },
    sectionContent: {
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    menuIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuText: {
        flex: 1,
        fontSize: 15,
        color: '#334155',
    },
    versionText: {
        fontSize: 14,
        color: '#64748B',
        paddingHorizontal: 8,
    },
    logoutButton: {
        backgroundColor: '#1E6091',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 14,
        borderRadius: 10,
        marginHorizontal: 16,
        marginTop: 24,
    },
    logoutText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
