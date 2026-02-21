import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../utils/api';

export default function LoginScreen() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const login = useAuthStore((state) => state.login);

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Please enter your username and password.');
            return;
        }

        setIsLoading(true);

        try {
            // Send login request to the Node.js backend
            // Note: apiClient already points to http://localhost:3000/api
            const response = await apiClient.post('/login', {
                username: username,
                password: password,
            });

            if (response.data.success) {
                // Store the user and token in Zustand state manager
                login(response.data.user, response.data.token);

                // Redirect safely into the member portion of the app!
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            const message = error.response?.data?.error || 'Failed to communicate with the server. Are you running `node server.js`?';
            Alert.alert('Login Failed', message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Image source={require('../assets/images/logo-v2.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to Adria Cross Edit.</Text>

            <View style={styles.form}>
                <Text style={styles.label}>Username or Email</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your username"
                    placeholderTextColor="#A0A0A0"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                <Text style={styles.label}>Password</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#A0A0A0"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.buttonText}>Log In</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.signupLink} onPress={() => router.push('/register')}>
                    <Text style={styles.signupLinkText}>Don't have an account? Sign up</Text>
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
        width: 250,
        height: 250,
        alignSelf: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 8,
        fontFamily: 'System', // This will map to San Francisco on iOS, Roboto on Android
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
        marginBottom: 48,
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
        backgroundColor: '#D4A574', // Match existing Adria Cross Edit branding colors
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
    signupLink: {
        marginTop: 16,
        alignItems: 'center',
    },
    signupLinkText: {
        color: '#D4A574',
        fontSize: 14,
        fontWeight: '600',
    },
});
