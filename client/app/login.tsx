import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import api from '../services/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email) {
      Alert.alert('שגיאה', 'נא להזין כתובת אימייל');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/users/signup', { email });
      const userData = response.data;

      // שמירה מקומית כדי שלא נצטרך לעשות לוגין כל פעם
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // מעבר למסך הראשי (הטאבים)
      router.replace('/(tabs)');
    } catch (error) {
      console.error(error);
      Alert.alert('שגיאה', 'לא הצלחנו להתחבר לשרת. וודא שה-IP מעודכן והשרת רץ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Job Tracker</Text>
      <Text style={styles.subtitle}>הזן אימייל כדי להתחיל</Text>
      
      <TextInput
        style={styles.input}
        placeholder="email@example.com"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity 
        style={[styles.button, loading && { opacity: 0.5 }]} 
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'מתחבר...' : 'כניסה'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, marginBottom: 30, opacity: 0.7 },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    color: '#000', // הערה: ב-Dark mode תצטרך להתאים עם Themed components
  },
  button: {
    backgroundColor: '#2f95dc',
    width: '100%',
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});