import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function PatientDetail() {
    const { name } = useLocalSearchParams();

    const patientInfo = {
        name: name || '김환자',
        age: 65,
        gender: '여성',
        admitDate: '2025-04-15',
        doctor: '이의사',
        diagnosis: '폐렴',
        guardian: '김보호(아들)',
        heartRate: 120,
        bp: '145/90',
        temp: '37.2°C',
        spo2: '96%',
        urine: '80 ml/h',
        lastInjection: '13:45',
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{patientInfo.name} 상세정보</Text>

            <View style={styles.section}>
                <Text style={styles.label}>이름:</Text>
                <Text style={styles.value}>{patientInfo.name}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>나이:</Text>
                <Text style={styles.value}>{patientInfo.age}세</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>성별:</Text>
                <Text style={styles.value}>{patientInfo.gender}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>입원일:</Text>
                <Text style={styles.value}>{patientInfo.admitDate}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>담당의:</Text>
                <Text style={styles.value}>{patientInfo.doctor}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>진단명:</Text>
                <Text style={styles.value}>{patientInfo.diagnosis}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>보호자:</Text>
                <Text style={styles.value}>{patientInfo.guardian}</Text>
            </View>

            <View style={styles.vitalSection}>
                <Text style={styles.vitalTitle}>바이탈 사인</Text>
                <Text style={[styles.vitalItem, { color: '#dc2626' }]}>심박수: {patientInfo.heartRate} bpm</Text>
                <Text style={styles.vitalItem}>혈압: {patientInfo.bp}</Text>
                <Text style={styles.vitalItem}>체온: {patientInfo.temp}</Text>
                <Text style={styles.vitalItem}>산소포화도: {patientInfo.spo2}</Text>
                <Text style={styles.vitalItem}>수액 주입률: {patientInfo.urine}</Text>
                <Text style={styles.vitalItem}>최근 투약: {patientInfo.lastInjection}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f3f4f6',
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#1f2937',
    },
    section: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    label: {
        width: 80,
        fontWeight: 'bold',
        color: '#374151',
    },
    value: {
        color: '#111827',
    },
    vitalSection: {
        marginTop: 30,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 10,
        elevation: 2,
    },
    vitalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    vitalItem: {
        fontSize: 16,
        marginBottom: 8,
    },
});
