import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

interface SafeAreaProps {
    children: ReactNode;
    style?: ViewStyle;
    edges?: Edge[];
}

export default function SafeArea({ children, style, edges }: SafeAreaProps) {
    return (
        <SafeAreaView style={[styles.container, style]} edges={edges || ['top', 'left', 'right']}>
            {children}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC', // 병원 앱 스타일에 맞는 배경색
    },
});
