import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function MatcherScreen() {
    const [image, setImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            analyzeImage();
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            analyzeImage();
        }
    };

    const analyzeImage = () => {
        setIsAnalyzing(true);
        // Simulate network request to matching algorithm
        setTimeout(() => {
            setIsAnalyzing(false);
            Alert.alert('Match Found!', 'Your item pairs perfectly with a Navy Blazer and White Chinos.');
        }, 2500);
    };

    const resetMatcher = () => {
        setImage(null);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Clothing Matcher</Text>
            <Text style={styles.subtitle}>Upload an item from your wardrobe to discover complementary styles.</Text>

            {!image ? (
                <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>Choose an option to get started</Text>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
                            <Text style={styles.actionIcon}>📷</Text>
                            <Text style={styles.actionText}>Take Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
                            <Text style={styles.actionIcon}>🖼️</Text>
                            <Text style={styles.actionText}>Library</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={styles.previewContainer}>
                    <Image source={{ uri: image }} style={styles.previewImage} />

                    {isAnalyzing ? (
                        <View style={styles.analyzingOverlay}>
                            <ActivityIndicator size="large" color="#D4A574" />
                            <Text style={styles.analyzingText}>Analyzing colors and patterns...</Text>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.resetButton} onPress={resetMatcher}>
                            <Text style={styles.resetButtonText}>Match Another Item</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
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
        borderRadius: 16,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EAEAEA',
        borderStyle: 'dashed',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    placeholderText: {
        color: '#666666',
        fontSize: 16,
        marginBottom: 32,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 16,
        width: '100%',
        justifyContent: 'center',
    },
    actionButton: {
        backgroundColor: '#F7EFE5',
        paddingVertical: 24,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
        minWidth: 120,
    },
    actionIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    actionText: {
        color: '#D4A574',
        fontWeight: '600',
        fontSize: 16,
    },
    previewContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EAEAEA',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    analyzingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    analyzingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
    },
    resetButton: {
        position: 'absolute',
        bottom: 24,
        alignSelf: 'center',
        backgroundColor: '#D4A574',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    resetButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
