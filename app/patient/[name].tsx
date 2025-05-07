import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import config from '../config';

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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    if (!patient) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>환자 정보를 찾을 수 없습니다.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.imageContainer}>
                    {patient.patient_img ? (
                        <Image
                            source={{ uri: `${config.API_URL}${patient.patient_img}` }}
                            style={styles.patientImage}
                        />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Text style={styles.placeholderText}>No Image</Text>
                        </View>
                    )}
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.name}>{patient.patient_name}</Text>
                    <Text style={styles.details}>
                        {patient.age}세 | {patient.patient_sex} | {patient.patient_blood}형
                    </Text>
                    <Text style={styles.details}>
                        {patient.room_name} {patient.bed_num}호
                    </Text>
                    <Text style={styles.status}>{patient.patient_status}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>기본 정보</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>생년월일</Text>
                    <Text style={styles.value}>{patient.patient_birth}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>키</Text>
                    <Text style={styles.value}>{patient.patient_height}cm</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>체중</Text>
                    <Text style={styles.value}>{patient.patient_weight}kg</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>입원 정보</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>입원일</Text>
                    <Text style={styles.value}>{patient.patient_in}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>퇴원일</Text>
                    <Text style={styles.value}>{patient.patient_out || '입원 중'}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>보호자 정보</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>연락처</Text>
                    <Text style={styles.value}>{patient.guardian_tel || '등록된 연락처 없음'}</Text>
                </View>
            </View>

            {patient.patient_memo && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>메모</Text>
                    <Text style={styles.memo}>{patient.patient_memo}</Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
    },
    header: {
        backgroundColor: 'white',
        padding: 20,
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    imageContainer: {
        width: 100,
        height: 100,
        marginRight: 20,
    },
    patientImage: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#666',
        fontSize: 12,
    },
    headerInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    details: {
        fontSize: 16,
        color: '#666',
        marginBottom: 2,
    },
    status: {
        fontSize: 16,
        color: '#007AFF',
        marginTop: 4,
    },
    section: {
        backgroundColor: 'white',
        marginTop: 20,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    label: {
        fontSize: 16,
        color: '#666',
    },
    value: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    memo: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
    },
});
