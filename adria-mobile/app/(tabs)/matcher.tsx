import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MatcherScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Clothing Matcher</Text>
            <Text style={styles.subtitle}>Snap a photo of your wardrobe to discover complementary styles.</Text>
            {/* TODO: Add Expo Camera */}
            <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>Camera integration coming here!</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        padding: 24,
        paddingTop: 60,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
        marginBottom: 24,
    },
    placeholder: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EAEAEA',
        borderStyle: 'dashed',
    },
    placeholderText: {
        color: '#A0A0A0',
        fontSize: 16,
    }
});
