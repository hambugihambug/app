import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import config from '../config';

interface Patient {
    id: number;
    name: string;
    birth: string;
    gender: string;
    status: string;
    blood_type: string;
    height: number;
    weight: number;
    admission_date: string;
    discharge_date: string;
    phone: string | null;
    bed_number: string;
}

interface RoomData {
    room_id: number;
    room_name: string;
    room_temp: number;
    room_humi: number;
    room_capacity: number;
    patients: Patient[];
}

export default function PatientList() {
    const [roomData, setRoomData] = useState<RoomData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const params = useLocalSearchParams();
    const roomId = params.roomId as string;

    useEffect(() => {
        if (roomId) {
            fetchRoomData(roomId);
        }
    }, [roomId]);

    const fetchRoomData = async (roomId: string) => {
        try {
            const response = await axios.get(`${config.API_URL}/rooms/${roomId}`);
            if (response.data.code === 0) {
                setRoomData(response.data.data);
            } else {
                setError('병실 정보를 불러오는데 실패했습니다.');
            }
        } catch (err) {
            console.error('병실 정보 조회 오류:', err);
            setError('서버 연결에 문제가 있습니다.');
        } finally {
            setLoading(false);
        }
    };

    const renderPatientCard = ({ item }: { item: Patient }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => {
                router.push(`/patient/${item.id}`);
            }}
        >
            <View style={styles.cardContent}>
                <View style={styles.imageContainer}>
                    <View style={styles.placeholderImage}>
                        <Text style={styles.placeholderText}>No Image</Text>
                    </View>
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.details}>
                        {new Date().getFullYear() - new Date(item.birth).getFullYear()}세 | {item.gender} |{' '}
                        {item.blood_type}형
                    </Text>
                    <Text style={styles.details}>{item.bed_number}호</Text>
                    <Text style={styles.status}>{item.status}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>로딩 중...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    if (!roomData) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>병실 정보를 찾을 수 없습니다.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.roomInfo}>
                <Text style={styles.roomName}>{roomData.room_name}호</Text>
                <Text style={styles.roomDetails}>
                    온도: {roomData.room_temp}°C | 습도: {roomData.room_humi}%
                </Text>
            </View>
            <FlatList
                data={roomData.patients}
                renderItem={renderPatientCard}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    roomInfo: {
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    roomName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    roomDetails: {
        fontSize: 14,
        color: '#666',
    },
    listContainer: {
        padding: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 10,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardContent: {
        flexDirection: 'row',
        padding: 16,
    },
    imageContainer: {
        width: 80,
        height: 80,
        marginRight: 16,
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#666',
        fontSize: 12,
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    details: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    status: {
        fontSize: 14,
        color: '#007AFF',
        marginTop: 4,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
    },
});
