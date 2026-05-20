import { useLocalSearchParams, Stack, router } from 'expo-router';
import { StyleSheet, ActivityIndicator, TouchableOpacity, Alert, ScrollView, Linking, TextInput } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useEffect, useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import api from '../../services/api';

const STATUS_OPTIONS = ['נשלח', 'ראיון', 'הצעה', 'נדחה'];

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editExperience, setEditExperience] = useState('');
  const [editLocation, setEditLocation] = useState('');

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const response = await api.get(`/jobs/detail/${id}`);
      setJob(response.data);
    } catch (error) {
      Alert.alert('שגיאה', 'לא הצלחנו לטעון את הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const openLink = () => {
    if (job?.link) {
      Linking.openURL(job.link).catch(() => Alert.alert('שגיאה', 'לא ניתן לפתוח את הקישור'));
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      await api.patch(`/jobs/${id}/status`, { status: newStatus });
      setJob({ ...job, status: newStatus });
      setIsEditingStatus(false);
    } catch (error) {
      Alert.alert('שגיאה', 'עדכון הסטטוס נכשל');
    }
  };

  const saveDetails = async () => {
    try {
      await api.patch(`/jobs/${id}/details`, {
        requiredExperience: editExperience.trim() || null,
        location: editLocation.trim() || null,
      });
      setJob({ ...job, requiredExperience: editExperience.trim(), location: editLocation.trim() });
      setIsEditingDetails(false);
    } catch (error) {
      Alert.alert('שגיאה', 'השמירה נכשלה');
    }
  };

  const handleDelete = async () => {
    Alert.alert('מחיקה', 'למחוק את המשרה?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחק', style: 'destructive', onPress: async () => {
          await api.delete(`/jobs/${id}`);
          router.back();
      }}
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: job?.companyName }} />
      
      <View style={styles.card}>
        {/* פרטי חברה ותפקיד */}
        <View style={styles.infoSection}>
          <Text style={styles.label}>חברה</Text>
          <Text style={styles.value}>{job?.companyName}</Text>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.label}>תפקיד</Text>
          <Text style={styles.value}>{job?.jobTitle}</Text>
        </View>

        {/* קישור למשרה - מוצג ככפתור נקי */}
        {job?.link && (
          <View style={styles.infoSection}>
            <Text style={styles.label}>קישור למשרה</Text>
            <TouchableOpacity style={styles.linkRow} onPress={openLink}>
              <FontAwesome name="external-link" size={14} color="#2f95dc" />
              <Text style={styles.linkText}>צפייה במשרה</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* תיאור משרה והערות */}
        {job?.jobDescription && (
          <View style={styles.infoSection}>
            <Text style={styles.label}>תיאור המשרה</Text>
            <Text style={styles.descriptionText}>{job.jobDescription}</Text>
          </View>
        )}

        {/* שנות ניסיון + מיקום — עם אפשרות עריכה */}
        <View style={styles.editableSection}>
          <View style={styles.editableHeader}>
            <Text style={styles.editableSectionTitle}>פרטים נוספים</Text>
            <TouchableOpacity
              style={styles.editIcon}
              onPress={() => {
                if (!isEditingDetails) {
                  setEditExperience(job?.requiredExperience || '');
                  setEditLocation(job?.location || '');
                }
                setIsEditingDetails(!isEditingDetails);
              }}
            >
              <FontAwesome name={isEditingDetails ? "check" : "pencil"} size={16} color="#2f95dc" />
            </TouchableOpacity>
          </View>

          {isEditingDetails ? (
            <View>
              <Text style={styles.label}>דרישת שנות ניסיון</Text>
              <TextInput
                style={styles.editInput}
                value={editExperience}
                onChangeText={setEditExperience}
                placeholder="למשל: 5+ years"
                textAlign="right"
              />
              <Text style={styles.label}>מיקום המשרה</Text>
              <TextInput
                style={styles.editInput}
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder="למשל: Tel Aviv, Hybrid"
                textAlign="right"
              />
              <TouchableOpacity style={styles.saveDetailsBtn} onPress={saveDetails}>
                <Text style={styles.saveDetailsBtnText}>שמור</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>שנות ניסיון:</Text>
                <Text style={styles.detailValue}>{job?.requiredExperience || 'לא צוין'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>מיקום:</Text>
                <Text style={styles.detailValue}>{job?.location || 'לא צוין'}</Text>
              </View>
            </View>
          )}
        </View>

        {job?.notes && (
          <View style={styles.infoSection}>
            <Text style={styles.label}>הערות אישיות</Text>
            <Text style={styles.descriptionText}>{job.notes}</Text>
          </View>
        )}

        {/* סטטוס משרה */}
        <View style={styles.statusContainer}>
          <View>
            <Text style={styles.label}>סטטוס נוכחי</Text>
            <View style={styles.statusBadge}>
               <Text style={styles.statusText}>{job?.status}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.editIcon} 
            onPress={() => setIsEditingStatus(!isEditingStatus)}
          >
            <FontAwesome name="pencil" size={18} color="#2f95dc" />
          </TouchableOpacity>
        </View>

        {isEditingStatus && (
          <View style={styles.editPanel}>
            <Text style={styles.editTitle}>בחר סטטוס חדש:</Text>
            <View style={styles.optionsGrid}>
              {STATUS_OPTIONS.map((option) => (
                <TouchableOpacity 
                  key={option} 
                  style={[styles.optionButton, job?.status === option && styles.activeOption]}
                  onPress={() => updateStatus(option)}
                >
                  <Text style={[styles.optionText, job?.status === option && styles.activeOptionText]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* כפתור ניתוח התאמה */}
        {job?.jobDescription && (
          <View style={styles.analyzeSection}>
            <TouchableOpacity 
              style={styles.analyzeButton} 
              onPress={() => router.push('/job-analysis')}
            >
              <FontAwesome name="flask" size={16} color="#fff" />
              <Text style={styles.analyzeText}>נתח התאמה למשרה</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* כפתור מחיקה */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <FontAwesome name="trash" size={16} color="#FF3B30" />
            <Text style={styles.deleteText}>מחק משרה</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
  card: { 
    padding: 24, 
    borderRadius: 20, 
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5
  },
  infoSection: { marginBottom: 20 },
  label: { fontSize: 13, color: '#999', marginBottom: 4, fontWeight: '600', textAlign: 'right' },
  value: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', textAlign: 'right' },
  linkRow: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    gap: 8,
    marginTop: 4 
  },
  linkText: { color: '#2f95dc', fontSize: 15, fontWeight: '600' },
  descriptionText: { 
    fontSize: 15, 
    color: '#444', 
    lineHeight: 22, 
    textAlign: 'right',
    marginTop: 4 
  },
  statusContainer: { 
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end',
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  statusBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start'
  },
  statusText: { color: '#2f95dc', fontWeight: 'bold', fontSize: 14 },
  editIcon: {
    padding: 10,
    backgroundColor: '#f0f7ff',
    borderRadius: 50
  },
  editPanel: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee'
  },
  editTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12, color: '#444', textAlign: 'right' },
  optionsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff'
  },
  activeOption: { backgroundColor: '#2f95dc', borderColor: '#2f95dc' },
  optionText: { fontSize: 13, color: '#666' },
  activeOptionText: { color: '#fff', fontWeight: 'bold' },
  footer: { marginTop: 40, alignItems: 'center' },
  editableSection: { marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  editableHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  editableSectionTitle: { fontSize: 15, fontWeight: '700', color: '#333' },
  detailRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { fontSize: 14, color: '#666' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  editInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: '#f9f9f9', marginBottom: 10, textAlign: 'right' },
  saveDetailsBtn: { backgroundColor: '#2f95dc', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  saveDetailsBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  analyzeSection: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  analyzeButton: { backgroundColor: '#0066cc', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
  analyzeText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  deleteButton: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  deleteText: { color: '#FF3B30', fontWeight: '600', fontSize: 14 }
});