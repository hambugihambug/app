import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import axios from 'axios';
import config from '../config';
import SafeArea from '../../components/common/SafeArea';
import { Ionicons } from '@expo/vector-icons';

interface Patient {
    patient_id: number;
    patient_name: string;
    patient_birth: string;
    patient_sex: string;
    patient_height: number;
    patient_weight: number;
    patient_blood: string;
    patient_img: string;
    patient_memo: string;
    patient_status: string;
    patient_in: string;
    patient_out: string;
    bed_id: number;
    guardian_id: number;
    patient_tel: string;
    age: number;
    bed_num: string;
    room_name: string;
    guardian_tel: string;
}

export default function PatientDetail() {
    const { name } = useLocalSearchParams<{ name: string }>();
    const router = useRouter();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (name) {
            fetchPatientDetail();
        }
    }, [name]);

    const fetchPatientDetail = async () => {
        try {
            // URL에서 환자 ID 추출 (예: /patient/123 -> 123)
            const patientId = name.split('/').pop();
            if (!patientId || isNaN(parseInt(patientId))) {
                setError('잘못된 환자 ID입니다.');
                return;
            }

            console.log('Fetching patient detail for ID:', patientId);
            const response = await axios.get(`${config.API_URL}/patients/${patientId}`);
            console.log('API Response:', response.data);

            if (response.data.code === 0) {
                setPatient(response.data.data);
            } else {
                setError('환자 정보를 불러오는데 실패했습니다.');
            }
        } catch (err) {
            console.error('환자 상세 정보 조회 오류:', err);
            if (axios.isAxiosError(err)) {
                console.error('Error details:', {
                    status: err.response?.status,
                    data: err.response?.data,
                    config: err.config,
                });
            }
            setError('서버 연결에 문제가 있습니다.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date
            .toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            })
            .replace(/\./g, '-');
    };

    if (loading) {
        return (
            <SafeArea>
                <Stack.Screen
                    options={{
                        headerShown: false,
                    }}
                />
                <View style={[styles.container, styles.loadingContainer]}>
                    <ActivityIndicator size="large" color="#1E6091" />
                    <Text style={styles.loadingText}>환자 정보를 불러오는 중...</Text>
                </View>
            </SafeArea>
        );
    }

    if (error) {
        return (
            <SafeArea>
                <Stack.Screen
                    options={{
                        headerShown: false,
                    }}
                />
                <View style={[styles.container, styles.errorContainer]}>
                    <Ionicons name="alert-circle" size={50} color="#E11D48" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            </SafeArea>
        );
    }

    if (!patient) {
        return (
            <SafeArea>
                <Stack.Screen
                    options={{
                        headerShown: false,
                    }}
                />
                <View style={[styles.container, styles.errorContainer]}>
                    <Ionicons name="person-outline" size={50} color="#64748B" />
                    <Text style={styles.errorText}>환자 정보를 찾을 수 없습니다.</Text>
                </View>
            </SafeArea>
        );
    }

    return (
        <SafeArea>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            {/* 헤더 */}
            <View style={styles.headerContainer}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#1E6091" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>환자 상세정보</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                {/* 환자 프로필 */}
                <View style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        <View style={styles.imageContainer}>
                            {patient.patient_img ? (
                                <Image
                                    source={{ uri: `${config.API_URL}${patient.patient_img}` }}
                                    style={styles.patientImage}
                                />
                            ) : (
                                <View style={styles.placeholderImage}>
                                    <Ionicons name="person" size={40} color="#94A3B8" />
                                </View>
                            )}
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={styles.name}>{patient.patient_name}</Text>
                            <View style={styles.patientMetaInfo}>
                                <View style={styles.metaItem}>
                                    <Ionicons name="calendar-outline" size={16} color="#64748B" />
                                    <Text style={styles.metaText}>{patient.age}세</Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <Ionicons name="person-outline" size={16} color="#64748B" />
                                    <Text style={styles.metaText}>{patient.patient_sex}</Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <Ionicons name="water-outline" size={16} color="#DC2626" />
                                    <Text style={styles.metaText}>{patient.patient_blood}형</Text>
                                </View>
                            </View>
                            <View style={styles.locationInfo}>
                                <Ionicons name="bed-outline" size={16} color="#1E6091" />
                                <Text style={styles.locationText}>
                                    {patient.room_name} 병실 {patient.bed_num}번 침대
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.statusContainer}>
                        <View style={[styles.statusBadge, getStatusStyle(patient.patient_status)]}>
                            <Text style={[styles.statusText, { color: getStatusColor(patient.patient_status) }]}>
                                {patient.patient_status || '입원중'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 기본 정보 */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="information-circle-outline" size={22} color="#1E6091" />
                        <Text style={styles.sectionTitle}>기본 정보</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>생년월일</Text>
                        <Text style={styles.value}>{formatDate(patient.patient_birth)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>키</Text>
                        <Text style={styles.value}>{patient.patient_height}cm</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>체중</Text>
                        <Text style={styles.value}>{patient.patient_weight}kg</Text>
                    </View>
                    {patient.patient_tel && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>연락처</Text>
                            <Text style={styles.value}>{patient.patient_tel}</Text>
                        </View>
                    )}
                </View>

                {/* 입원 정보 */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="calendar-outline" size={22} color="#1E6091" />
                        <Text style={styles.sectionTitle}>입원 정보</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>입원일</Text>
                        <Text style={styles.value}>{formatDate(patient.patient_in)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>퇴원일</Text>
                        <Text style={[styles.value, !patient.patient_out && styles.highlightValue]}>
                            {patient.patient_out ? formatDate(patient.patient_out) : '입원 중'}
                        </Text>
                    </View>
                </View>

                {/* 보호자 정보 */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="call-outline" size={22} color="#1E6091" />
                        <Text style={styles.sectionTitle}>보호자 정보</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>연락처</Text>
                        <Text style={styles.value}>{patient.guardian_tel || '등록된 연락처 없음'}</Text>
                    </View>
                </View>

                {/* 메모 */}
                {patient.patient_memo && (
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="document-text-outline" size={22} color="#1E6091" />
                            <Text style={styles.sectionTitle}>메모</Text>
                        </View>
                        <Text style={styles.memo}>{patient.patient_memo}</Text>
                    </View>
                )}
            </ScrollView>
        </SafeArea>
    );
}

// 환자 상태에 따른 스타일 함수
const getStatusStyle = (status: string) => {
    switch (status) {
        case '중증':
            return { backgroundColor: '#FEE2E2' };
        case '안정':
            return { backgroundColor: '#ECFDF5' };
        case '관찰중':
            return { backgroundColor: '#FEF9C3' };
        default:
            return { backgroundColor: '#EBF4FF' };
    }
};

// 환자 상태에 따른 텍스트 색상 함수
const getStatusColor = (status: string) => {
    switch (status) {
        case '중증':
            return '#DC2626';
        case '안정':
            return '#059669';
        case '관찰중':
            return '#CA8A04';
        default:
            return '#1E6091';
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E6091',
        textAlign: 'center',
    },
    placeholder: {
        width: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#1E6091',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F8FAFC',
    },
    errorText: {
        color: '#E11D48',
        textAlign: 'center',
        fontSize: 16,
        marginTop: 16,
        fontWeight: '500',
    },
    profileCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    profileHeader: {
        padding: 16,
        flexDirection: 'row',
    },
    imageContainer: {
        width: 80,
        height: 80,
        marginRight: 16,
    },
    patientImage: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    headerInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 8,
    },
    patientMetaInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    metaText: {
        fontSize: 14,
        color: '#64748B',
        marginLeft: 4,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 14,
        color: '#1E6091',
        fontWeight: '500',
        marginLeft: 4,
    },
    statusContainer: {
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        padding: 12,
        alignItems: 'flex-start',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    sectionCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
        marginLeft: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    label: {
        fontSize: 16,
        color: '#64748B',
    },
    value: {
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '500',
    },
    highlightValue: {
        color: '#1E6091',
        fontWeight: '600',
    },
    memo: {
        fontSize: 16,
        color: '#1E293B',
        lineHeight: 24,
        padding: 16,
    },
});
