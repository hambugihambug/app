import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase 구성
const firebaseConfig = {
    apiKey: 'AIzaSyA_sQF2Vov1f9Y54c9RH-mQvKSEty8OfBI',
    authDomain: 'hamburger-9d630.firebaseapp.com',
    projectId: 'hamburger-9d630',
    storageBucket: 'hamburger-9d630.firebasestorage.app',
    messagingSenderId: '527168226905',
    appId: '1:527168226905:ios:a770fcee8ecd5ec2bc5348',
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Auth 초기화 with AsyncStorage 지속성
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});

export { auth };

export default firebaseConfig;
