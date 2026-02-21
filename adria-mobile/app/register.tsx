import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../utils/api';

export default function RegisterScreen() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const login = useAuthStore((state) => state.login);

    const handleRegister = async () => {
        if (!username || !email || !password) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await apiClient.post('/register', {
                username,
                email,
                password,
                displayName: displayName || username,
                tosAcceptedAt: new Date().toISOString()
            });

            if (response.data.success) {
                login(response.data.user, response.data.token);
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            const message = error.response?.data?.error || 'Failed to communicate with the server.';
            Alert.alert('Registration Failed', message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Image source={require('../assets/images/logo-v2.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up for Adria Cross Edit.</Text>

            <View style={styles.form}>
                <Text style={styles.label}>Username *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Choose a username"
                    placeholderTextColor="#A0A0A0"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                <Text style={styles.label}>Email *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your email address"
                    placeholderTextColor="#A0A0A0"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                <Text style={styles.label}>Full Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your display name"
                    placeholderTextColor="#A0A0A0"
                    value={displayName}
                    onChangeText={setDisplayName}
                />

                <Text style={styles.label}>Password *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Create a password (min 6 chars)"
                    placeholderTextColor="#A0A0A0"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleRegister}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.buttonText}>Sign Up</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
                    <Text style={styles.loginLinkText}>Already have an account? Log in</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 24,
        justifyContent: 'center',
    },
    logo: {
        width: 100,
        height: 100,
        alignSelf: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 8,
        fontFamily: 'System',
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
        marginBottom: 32,
    },
    form: {
        gap: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 4,
    },
    input: {
        backgroundColor: '#F5F5F5',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        fontSize: 16,
        color: '#000000',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    button: {
        backgroundColor: '#D4A574',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    loginLink: {
        marginTop: 16,
        alignItems: 'center',
    },
    loginLinkText: {
        color: '#D4A574',
        fontSize: 14,
        fontWeight: '600',
    },
});
