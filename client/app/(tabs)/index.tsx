import { StyleSheet, FlatList, ActivityIndicator, Pressable, RefreshControl, TextInput, Modal, Alert, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getJobs, autoAddJob } from '../../services/api'; // וודא שהוספת את autoAddJob ל-api.ts
import { Link } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';

interface Job {
  id: string;
  companyName: string;
  jobTitle: string;
  status: string;
  userId: string;
  createdAt: string;
}

export default function TabOneScreen() {
  const isFocused = useIsFocused();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // States חדשים עבור ה-AI Agent
  const [modalVisible, setModalVisible] = useState(false);
  const [jobUrl, setJobUrl] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const fetchUserJobs = async () => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        const data = await getJobs(user.id);
        setJobs(data);
        setFilteredJobs(data);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchUserJobs();
    }
  }, [isFocused]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredJobs(jobs);
    } else {
      const filtered = jobs.filter((job) =>
        job.companyName.toLowerCase().includes(text.toLowerCase()) ||
        job.jobTitle.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredJobs(filtered);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setSearchQuery('');
    fetchUserJobs();
  }, []);

  // Function to add job using AI analysis of URL
  const handleAiAdd = async () => {
    // Validate URL format
    if (!jobUrl || (!jobUrl.startsWith('http://') && !jobUrl.startsWith('https://'))) {
      Alert.alert('Error', 'Please enter a valid URL (starting with http:// or https://)');
      return;
    }

    setIsAiLoading(true);
    try {
      // Retrieve user ID from local storage
      const userString = await AsyncStorage.getItem('user');
      if (!userString) {
        Alert.alert('Error', 'User not found. Please log in again.');
        setIsAiLoading(false);
        return;
      }

      const user = JSON.parse(userString);
      console.log('Auto-add job with userId:', user.id);

      // Call API to analyze and create job
      await autoAddJob(jobUrl, user.id);

      Alert.alert('Success!', 'Job has been added to your list');
      setModalVisible(false);
      setJobUrl('');
      
      // Refresh the job list to show the newly added job
      fetchUserJobs();
    } catch (error: any) {
      console.error('handleAiAdd error:', error.message);
      
      // Provide user-friendly error messages
      let errorMessage = 'Could not analyze the URL. Please try another link or add manually.';
      if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try a simpler URL or try again later.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid URL or user ID. Please check and try again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Server endpoint not found. Please check your network connection.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2f95dc" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>המשרות שלי</Text>

      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={16} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="חפש חברה או תפקיד..."
          value={searchQuery}
          onChangeText={handleSearch}
          textAlign="right"
        />
      </View>

      {filteredJobs.length === 0 ? (
        <Text style={styles.emptyText}>
          {searchQuery ? 'לא נמצאו תוצאות לחיפוש...' : 'עדיין לא הוספת משרות...'}
        </Text>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item.id}
          style={{ width: '100%' }}
          contentContainerStyle={{ paddingBottom: 100 }} // מניעת הסתרה ע"י הכפתור הצף
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2f95dc" />
          }
          renderItem={({ item }) => (
            <Link href={`/job/${item.id}`} asChild>
              <Pressable style={styles.jobCard}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
                <View style={{ backgroundColor: 'transparent', alignItems: 'flex-end' }}>
                  <Text style={styles.jobTitle}>{item.jobTitle}</Text>
                  <Text style={styles.companyName}>{item.companyName}</Text>
                </View>
              </Pressable>
            </Link>
          )}
        />
      )}

      {/* מודאל AI Agent */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.aiHeader}>
              <FontAwesome name="magic" size={20} color="#2f95dc" />
              <Text style={styles.modalTitle}>הוספה חכמה עם AI</Text>
            </View>
            
            <Text style={styles.modalSubtitle}>הדבק קישור למשרה וניתן ל-AI למלא את השאר</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="https://www.linkedin.com/jobs/..."
              value={jobUrl}
              onChangeText={setJobUrl}
              autoCapitalize="none"
              keyboardType="url"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.aiButton, isAiLoading && { opacity: 0.7 }]} 
                onPress={handleAiAdd}
                disabled={isAiLoading}
              >
                {isAiLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>נתח והוסף</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => {
                  setModalVisible(false);
                  setJobUrl('');
                }}
              >
                <Text style={styles.cancelButtonText}>ביטול</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* כפתור FAB - הוספה חכמה */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <FontAwesome name="magic" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    width: '100%',
    height: 45,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: { marginLeft: 10 },
  searchInput: { flex: 1, fontSize: 15 },
  emptyText: { marginTop: 50, opacity: 0.5 },
  jobCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  jobTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'right' },
  companyName: { fontSize: 14, color: '#666', marginTop: 4, textAlign: 'right' },
  statusBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: { color: '#2f95dc', fontWeight: 'bold', fontSize: 12 },
  
  // עיצובים חדשים ל-AI ול-FAB
  fab: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    backgroundColor: '#2f95dc',
    width: 65,
    height: 65,
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 10,
  },
  aiHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'transparent'
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginRight: 10, color: '#333' },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  modalInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    color: '#000',
    textAlign: 'left'
  },
  modalButtons: { width: '100%' },
  aiButton: {
    backgroundColor: '#2f95dc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelButton: { padding: 10, alignItems: 'center' },
  cancelButtonText: { color: '#999', fontSize: 14 },
});