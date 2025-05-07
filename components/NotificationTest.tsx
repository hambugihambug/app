import React from 'react';
import { View, Button, StyleSheet } from 'react-native';
import { runNotificationTest } from '../test_notifications';

export default function NotificationTest() {
    return (
        <View style={styles.container}>
            <Button title="알림 테스트" onPress={runNotificationTest} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
});
