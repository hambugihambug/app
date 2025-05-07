import { Platform } from 'react-native';

// 개발 환경에서의 API 서버 주소 설정
const DEVELOPMENT_API_URL =
    Platform.OS === 'web'
        ? 'http://localhost:3000' // 웹에서 실행 시
        : Platform.OS === 'ios'
        ? 'http://localhost:3000' // iOS 시뮬레이터
        : 'http://10.0.2.2:3000'; // Android 에뮬레이터

// 실제 기기 또는 특정 네트워크에서 접속할 IP 주소
const NETWORK_API_URL = 'http://10.32.31.237:3000';

// 실제 사용할 API URL - 개발 환경에서는 DEVELOPMENT_API_URL 사용
const API_URL = __DEV__ ? DEVELOPMENT_API_URL : NETWORK_API_URL;

// API 기본 설정
const API_CONFIG = {
    timeout: 10000, // 10초 타임아웃
    headers: {
        'Content-Type': 'application/json',
    },
};

// 디버그 모드 여부
const DEBUG_MODE = true;

// 환경 설정 정보 내보내기
export default {
    API_URL,
    API_CONFIG,
    DEBUG_MODE,
};
