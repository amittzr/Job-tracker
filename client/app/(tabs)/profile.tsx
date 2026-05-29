import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { auth } from '../../config/firebase';

interface UserProfileData {
  id: string;
  userId: string;
  fullName?: string;
  professionalTitle?: string;
  contactInfo?: string;
  skills?: string;
  cvFileName?: string;
  cvFilePath?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProfileTab() {
  const isFocused = useIsFocused();
  const { user: firebaseUser } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [fullName, setFullName] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [skillsInput, setSkillsInput] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isFocused) {
      loadProfile();
    }
  }, [isFocused]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      if (!firebaseUser) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const defaultName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '';
      setFullName(defaultName);

      try {
        const response = await api.get(`/users/${firebaseUser.uid}/profile`);
        setProfile(response.data);
        setFullName(response.data.fullName || defaultName);
        setProfessionalTitle(response.data.professionalTitle || '');
        setContactInfo(response.data.contactInfo || '');

        if (response.data.skills) {
          const skills =
            typeof response.data.skills === 'string'
              ? JSON.parse(response.data.skills)
              : response.data.skills;
          setSkillsInput(Array.isArray(skills) ? skills.join(', ') : '');
        }
      } catch (error: any) {
        if (error.response?.status !== 404) {
          console.error('Error fetching profile:', error);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!firebaseUser?.uid) return Alert.alert('Error', 'User not authenticated');
    if (!fullName.trim()) return Alert.alert('Validation', 'Please enter your name');

    setSaving(true);
    try {
      const skillsArray = skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await api.patch(`/users/${firebaseUser.uid}/profile`, {
        fullName: fullName.trim(),
        professionalTitle: professionalTitle.trim(),
        contactInfo: contactInfo.trim(),
        skills: skillsArray,
      });

      Alert.alert('Success', 'Profile updated successfully');
      loadProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // ─── Upload CV ──────────────────────────────────────────────────────────────
  const handleUploadCV = async () => {
    if (!firebaseUser?.uid) return Alert.alert('Error', 'User not authenticated');

    try {
      setUploading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ],
        copyToCacheDirectory: true,
      });

      if ('canceled' in result) {
        if (result.canceled || !result.assets?.length) {
          setUploading(false);
          return;
        }
      }

      const asset = (result as any).assets?.[0] || result;
      const fileUri = asset.uri;
      const fileName = asset.name || 'cv_file';
      const mimeType = asset.mimeType ?? 'application/octet-stream';

      console.log('[Upload] File selected:', { fileUri, fileName, mimeType });

      const formData = new FormData();

      if (Platform.OS === 'web') {
        // Web: fetch the blob URI and create a real File object
        const response = await fetch(fileUri);
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: mimeType });
        formData.append('cv', file);
      } else {
        // Mobile: use the React Native format
        formData.append('cv', {
          uri: fileUri,
          type: mimeType,
          name: fileName,
        } as any);
      }

      const uploadResponse = await api.post(`/users/${firebaseUser.uid}/cv/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60_000,
      });

      console.log('[Upload] Success:', uploadResponse.data);
      Alert.alert('✅ Success', `CV uploaded!\n${fileName}`);
      await loadProfile();
    } catch (error: any) {
      console.error('[Upload] Error:', error);

      let msg = 'Failed to upload CV';
      if (error.response) {
        msg = error.response.data?.error || `Server error ${error.response.status}`;
      } else if (error.request) {
        msg = 'No response from server. Check that the backend is running.';
      } else {
        msg = error.message;
      }
      Alert.alert('Upload Failed', msg);
    } finally {
      setUploading(false);
    }
  };

  // ─── Helper: get MIME type from filename ────────────────────────────────────
  const getMimeType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'doc': return 'application/msword';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'txt': return 'text/plain';
      default: return 'application/octet-stream';
    }
  };

  // ─── Helper: get UTI for iOS Quick Look ─────────────────────────────────────
  const getUTI = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'com.adobe.pdf';
      case 'doc': return 'com.microsoft.word.doc';
      case 'docx': return 'org.openxmlformats.wordprocessingml.document';
      case 'txt': return 'public.plain-text';
      default: return 'public.data';
    }
  };

  // ─── View / Download CV ─────────────────────────────────────────────────────
  const handleViewCV = async () => {
    if (!firebaseUser?.uid || !profile?.cvFileName) {
      return Alert.alert('Info', 'No CV uploaded yet');
    }

    setDownloading(true);
    try {
      if (Platform.OS === 'web') {
        // Web: download via API with token, then open as blob URL
        const response = await api.get(`/users/${firebaseUser.uid}/cv/download`, {
          responseType: 'blob',
        });
        const blob = response.data;
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        // Mobile: download file with auth token using new expo-file-system API
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          return Alert.alert('Error', 'Not authenticated');
        }

        const downloadUrl = `${api.defaults.baseURL}/users/${firebaseUser.uid}/cv/download`;
        const fileName = profile.cvFileName || 'CV';
        const destination = new File(Paths.cache, fileName);

        // Delete existing cached file if it exists
        if (destination.exists) {
          destination.delete();
        }

        // Download using File.downloadFileAsync with auth headers
        const downloadedFile = await File.downloadFileAsync(downloadUrl, destination, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Open the file using the system share sheet / Quick Look
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadedFile.uri, {
            mimeType: getMimeType(fileName),
            UTI: getUTI(fileName),
          });
        } else {
          Alert.alert('Error', 'Sharing is not available on this device');
        }
      }
    } catch (error) {
      console.error('Error opening CV:', error);
      Alert.alert('Error', 'Failed to open CV');
    } finally {
      setDownloading(false);
    }
  };

  // ─── Delete CV ──────────────────────────────────────────────────────────────
  const handleDeleteCV = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('האם אתה בטוח שברצונך למחוק את קובץ ה-CV?');
      if (!confirmed) return;
    } else {
      // On mobile, use Alert with callback
      return new Promise<void>((resolve) => {
        Alert.alert('מחיקת CV', 'האם אתה בטוח שברצונך למחוק את קובץ ה-CV?', [
          { text: 'ביטול', style: 'cancel', onPress: () => resolve() },
          {
            text: 'מחק',
            style: 'destructive',
            onPress: async () => {
              await performDeleteCV();
              resolve();
            },
          },
        ]);
      });
    }

    await performDeleteCV();
  };

  const performDeleteCV = async () => {
    try {
      await api.delete(`/users/${firebaseUser!.uid}/cv`);
      Alert.alert('✅', 'CV deleted successfully');
      await loadProfile();
    } catch (error) {
      console.error('Error deleting CV:', error);
      Alert.alert('Error', 'Failed to delete CV');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadProfile} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <FontAwesome name="user-circle" size={60} color="#0066cc" />
        <Text style={styles.userName}>{fullName}</Text>
        <Text style={styles.userEmail}>{firebaseUser?.email}</Text>
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
            placeholderTextColor="#ccc"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Professional Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Senior Developer"
            value={professionalTitle}
            onChangeText={setProfessionalTitle}
            placeholderTextColor="#ccc"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Contact Info</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., +1234567890 or LinkedIn URL"
            value={contactInfo}
            onChangeText={setContactInfo}
            placeholderTextColor="#ccc"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Skills</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Enter skills separated by commas (e.g., JavaScript, React, Node.js)"
            value={skillsInput}
            onChangeText={setSkillsInput}
            multiline
            numberOfLines={3}
            placeholderTextColor="#ccc"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton, saving && styles.disabledButton]}
          onPress={handleSaveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <FontAwesome name="save" size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Save Profile</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* CV Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CV Management</Text>

        {profile?.cvFileName && (
          <View style={styles.cvCard}>
            <FontAwesome name="file-pdf-o" size={32} color="#0066cc" />
            <View style={styles.cvInfo}>
              <Text style={styles.cvFileName}>{profile.cvFileName}</Text>
              <Text style={styles.cvDate}>
                Updated: {new Date(profile.updatedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, uploading && styles.disabledButton]}
          onPress={handleUploadCV}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#0066cc" />
          ) : (
            <>
              <FontAwesome name="cloud-upload" size={16} color="#0066cc" style={{ marginRight: 8 }} />
              <Text style={styles.buttonTextSecondary}>
                {profile?.cvFileName ? 'Update CV' : 'Upload CV'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {profile?.cvFileName && (
          <TouchableOpacity
            style={[styles.button, styles.outlineButton, downloading && styles.disabledButton]}
            onPress={handleViewCV}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator color="#0066cc" />
            ) : (
              <>
                <FontAwesome name="download" size={16} color="#0066cc" style={{ marginRight: 8 }} />
                <Text style={styles.buttonTextSecondary}>View / Download CV</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {profile?.cvFileName && (
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDeleteCV}
          >
            <FontAwesome name="trash" size={16} color="#FF3B30" style={{ marginRight: 8 }} />
            <Text style={styles.deleteButtonText}>Delete CV</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.helperText}>
          📄 Supported formats: PDF, Word (.docx), Text (.txt){'\n'}
          📦 Max file size: 10 MB
        </Text>
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <FontAwesome name="info-circle" size={16} color="#666" />
        <Text style={styles.infoText}>
          Your CV is securely stored and will be used for AI-powered job matching and analysis.
        </Text>
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#fff',
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  userName: { fontSize: 24, fontWeight: '700', marginTop: 12, color: '#1a1a1a' },
  userEmail: { fontSize: 14, color: '#666', marginTop: 4 },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15, color: '#1a1a1a' },
  formGroup: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  multilineInput: { textAlignVertical: 'top', minHeight: 80 },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginVertical: 8,
  },
  primaryButton: { backgroundColor: '#0066cc', marginTop: 15 },
  secondaryButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#0066cc' },
  outlineButton: { backgroundColor: '#f0f7ff', borderWidth: 1, borderColor: '#0066cc' },
  deleteButton: { backgroundColor: '#fff0f0', borderWidth: 1, borderColor: '#FF3B30' },
  disabledButton: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonTextSecondary: { color: '#0066cc', fontSize: 16, fontWeight: '600' },
  deleteButtonText: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
  cvCard: {
    flexDirection: 'row',
    backgroundColor: '#f0f7ff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#0066cc',
  },
  cvInfo: { marginLeft: 12, flex: 1 },
  cvFileName: { fontSize: 14, fontWeight: '600', color: '#0066cc' },
  cvDate: { fontSize: 12, color: '#666', marginTop: 4 },
  helperText: { fontSize: 12, color: '#666', marginTop: 12, lineHeight: 18 },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, marginLeft: 10, fontSize: 13, color: '#2e7d32', lineHeight: 18 },
});
