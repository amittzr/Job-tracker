import { StyleSheet, FlatList, ActivityIndicator, Pressable, RefreshControl, TextInput } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getJobs } from '../../services/api';
import { Link } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons'; // הוספת אייקון

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
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]); // רשימה מסוננת
  const [searchQuery, setSearchQuery] = useState(''); // טקסט החיפוש
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserJobs = async () => {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        const data = await getJobs(user.id);
        setJobs(data);
        setFilteredJobs(data); // עדכון גם של הרשימה המוצגת
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

  // לוגיקת החיפוש
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
    setSearchQuery(''); // איפוס חיפוש בזמן רענון
    fetchUserJobs();
  }, []);

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

      {/* שורת חיפוש חדשה */}
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
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={['#2f95dc']} 
              tintColor="#2f95dc"
            />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  
  // סגנון לשורת החיפוש
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
});