import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function BuildingLayout() {
    return (
        <>
            <StatusBar style="dark" />
            <Stack>
                <Stack.Screen
                    name="index"
                    options={{
                        title: '건물 정보',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                    }}
                />
                <Stack.Screen
                    name="floor/[id]"
                    options={{
                        title: '층 정보',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                    }}
                />
                <Stack.Screen
                    name="room/[id]"
                    options={{
                        title: '병실 정보',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                    }}
                />
            </Stack>
        </>
    );
}
