import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform, TextInput } from 'react-native';
import { Text, View } from '@/components/Themed';
import { router } from 'expo-router';
import { GoogleAuthProvider, signInWithPopup, signInWithCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

export default function LoginScreen() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

  // Mobile: not supported in Expo Go (requires development build)
  const handleMobileGoogleSignIn = () => {
    Alert.alert(
      'לא זמין',
      'התחברות Google במובייל דורשת development build.\nנסה דרך Web (לחץ w בטרמינל של Expo).'
    );
  };

  // Email/Password login (for development purposes)
  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('שגיאה', 'נא למלא אימייל וסיסמה');
      return;
    }

    setLoading(true);
    try {
      let userCredential;
      try {
        // Try to sign in
        userCredential = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      } catch (signInError: any) {
        if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
          // User doesn't exist — create account
          userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
        } else {
          throw signInError;
        }
      }

      const firebaseUser = userCredential.user;
      const firebaseToken = await firebaseUser.getIdToken();

      // Sync with backend
      await api.post('/users/signup', {
        email: firebaseUser.email,
        firebaseUid: firebaseUser.uid,
        displayName: firebaseUser.email?.split('@')[0],
      }, {
        headers: { Authorization: `Bearer ${firebaseToken}` }
      });

      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Email login error:', error);
      let msg = 'ההתחברות נכשלה';
      if (error.code === 'auth/wrong-password') msg = 'סיסמה שגויה';
      if (error.code === 'auth/invalid-email') msg = 'אימייל לא תקין';
      if (error.code === 'auth/weak-password') msg = 'סיסמה חייבת להיות לפחות 6 תווים';
      Alert.alert('שגיאה', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    if (Platform.OS === 'web') {
      handleWebGoogleSignIn();
    } else {
      handleMobileGoogleSignIn();
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
        style={[styles.googleButton, loading && { opacity: 0.6 }]}
        onPress={handleSignIn}
        disabled={loading}
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

      {/* Email login - for development */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>או</Text>
        <View style={styles.dividerLine} />
      </View>

      <TextInput
        style={styles.input}
        placeholder="אימייל"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#999"
      />
      <TextInput
        style={styles.input}
        placeholder="סיסמה (מינימום 6 תווים)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#999"
      />
      <TouchableOpacity
        style={[styles.emailButton, loading && { opacity: 0.6 }]}
        onPress={handleEmailLogin}
        disabled={loading}
      >
        <Text style={styles.emailButtonText}>כניסה עם אימייל</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        ההתחברות מאובטחת באמצעות Firebase Auth
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 13,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 12,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#1a1a1a',
  },
  emailButton: {
    backgroundColor: '#2f95dc',
    width: '100%',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
