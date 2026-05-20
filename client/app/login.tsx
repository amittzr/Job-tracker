import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { router } from 'expo-router';
import { GoogleAuthProvider, signInWithPopup, signInWithCredential } from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

export default function LoginScreen() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  // expo-auth-session for mobile (Expo Go)
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  // Handle mobile Google auth response
  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.authentication?.idToken;
      if (idToken) {
        handleFirebaseSignIn(idToken);
      }
    }
  }, [response]);

  // If user is already logged in, redirect
  useEffect(() => {
    if (user && !authLoading) {
      router.replace('/(tabs)');
    }
  }, [user, authLoading]);

  // Web: use Firebase signInWithPopup directly
  const handleWebGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const firebaseToken = await firebaseUser.getIdToken();

      // Sync with backend
      await api.post('/users/signup', {
        email: firebaseUser.email,
        firebaseUid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
      }, {
        headers: { Authorization: `Bearer ${firebaseToken}` }
      });

      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Web Google sign-in error:', error);
      if (error.code !== 'auth/popup-closed-by-user') {
        Alert.alert('שגיאה', 'ההתחברות נכשלה. נסה שוב.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Mobile: use credential from expo-auth-session
  const handleFirebaseSignIn = async (idToken: string) => {
    setLoading(true);
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;
      const firebaseToken = await firebaseUser.getIdToken();

      // Sync with backend
      await api.post('/users/signup', {
        email: firebaseUser.email,
        firebaseUid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
      }, {
        headers: { Authorization: `Bearer ${firebaseToken}` }
      });

      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Mobile Google sign-in error:', error);
      Alert.alert('שגיאה', 'ההתחברות נכשלה. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  // Choose the right sign-in method based on platform
  const handleSignIn = () => {
    if (Platform.OS === 'web') {
      handleWebGoogleSignIn();
    } else {
      promptAsync();
    }
  };

  if (authLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2f95dc" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Job Tracker AI</Text>
      <Text style={styles.subtitle}>מעקב חכם אחרי המשרות שלך</Text>

      <View style={styles.logoContainer}>
        <Text style={styles.logoEmoji}>🎯</Text>
      </View>

      <TouchableOpacity
        style={[styles.googleButton, (loading || (!request && Platform.OS !== 'web')) && { opacity: 0.6 }]}
        onPress={handleSignIn}
        disabled={loading || (!request && Platform.OS !== 'web')}
      >
        {loading ? (
          <ActivityIndicator color="#333" />
        ) : (
          <>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleButtonText}>התחבר עם Google</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.footerText}>
        ההתחברות מאובטחת באמצעות Google SSO
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 20,
    backgroundColor: '#f8f9fa'
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    marginBottom: 8,
    color: '#1a1a1a'
  },
  subtitle: { 
    fontSize: 16, 
    marginBottom: 40, 
    opacity: 0.7,
    color: '#666'
  },
  logoContainer: {
    marginBottom: 50,
  },
  logoEmoji: {
    fontSize: 80,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    width: '100%',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  googleIcon: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4285F4',
    marginRight: 12,
  },
  googleButtonText: { 
    color: '#333', 
    fontSize: 17, 
    fontWeight: '600' 
  },
  footerText: {
    marginTop: 30,
    fontSize: 12,
    color: '#999',
  },
});
