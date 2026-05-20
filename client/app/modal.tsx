import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AddJobModal() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    companyName: '',
    jobTitle: '',
    link: '',
    jobDescription: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleAddJob = async () => {
    if (!form.companyName || !form.jobTitle) {
      Alert.alert('שגיאה', 'חברה ותפקיד הם שדות חובה');
      return;
    }

    setLoading(true);
    try {
      await api.post('/jobs', {
        ...form,
        userId: user?.uid
      });

      Alert.alert('הצלחה', 'המשרה נוספה בהצלחה');
      router.back();
    } catch (error) {
      Alert.alert('שגיאה', 'לא הצלחנו להוסיף את המשרה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>הוספת משרה חדשה</Text>
        
        <Text style={styles.label}>חברה *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="למשל: Google" 
          value={form.companyName}
          onChangeText={(t) => setForm({...form, companyName: t})}
        />
        
        <Text style={styles.label}>תפקיד *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="למשל: Fullstack Developer" 
          value={form.jobTitle}
          onChangeText={(t) => setForm({...form, jobTitle: t})}
        />

        <Text style={styles.label}>לינק למשרה</Text>
        <TextInput 
          style={styles.input} 
          placeholder="https://..." 
          keyboardType="url"
          autoCapitalize="none"
          value={form.link}
          onChangeText={(t) => setForm({...form, link: t})}
        />

        <Text style={styles.label}>תיאור משרה</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="מה דרישות התפקיד?" 
          multiline
          value={form.jobDescription}
          onChangeText={(t) => setForm({...form, jobDescription: t})}
        />

        <Text style={styles.label}>הערות אישיות</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="דברים שחשוב לזכור..." 
          multiline
          value={form.notes}
          onChangeText={(t) => setForm({...form, notes: t})}
        />

        <TouchableOpacity 
          style={[styles.button, loading && { opacity: 0.5 }]} 
          onPress={handleAddJob}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'שומר...' : 'שמור משרה'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 25, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#555', textAlign: 'right' },
  input: {
    borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 10,
    marginBottom: 15, fontSize: 16, backgroundColor: '#f9f9f9', textAlign: 'right'
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  button: {
    backgroundColor: '#2f95dc', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});