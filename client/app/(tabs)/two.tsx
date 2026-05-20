import { StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useEffect, useState, useCallback } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface Stat {
  status: string;
  _count: { _all: number };
}

export default function DashboardScreen() {
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stat[]>([]);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      if (user) {
        const statsRes = await api.get(`/jobs/stats/${user.uid}`);
        setStats(statsRes.data.stats);
        setTotal(statsRes.data.totalJobs);

        const jobsRes = await api.get(`/jobs/${user.uid}`);
        setAllJobs(jobsRes.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) fetchData();
  }, [isFocused]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'נשלח': return '#2f95dc';
      case 'ראיון': return '#5856D6';
      case 'הצעה': return '#4CD964';
      case 'נדחה': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  // סינון המשרות להצגה
  const filteredJobs = allJobs.filter(job => job.status === selectedStatus);

  if (loading && !refreshing) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>תמונת מצב</Text>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>סה"כ הגשות</Text>
        <Text style={styles.totalValue}>{total}</Text>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((item) => (
          <TouchableOpacity 
            key={item.status} 
            style={[
                styles.statBox, 
                { borderRightColor: getStatusColor(item.status) },
                selectedStatus === item.status && styles.activeStatBox
            ]}
            onPress={() => setSelectedStatus(selectedStatus === item.status ? null : item.status)}
          >
            <Text style={styles.statCount}>{item._count._all}</Text>
            <Text style={styles.statLabel}>{item.status}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* רשימה דינמית שנפתחת בלחיצה */}
      {selectedStatus && (
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
             <Text style={[styles.sectionTitle, { color: getStatusColor(selectedStatus) }]}>
               משרות בסטטוס: {selectedStatus}
             </Text>
             <TouchableOpacity onPress={() => setSelectedStatus(null)}>
                <Text style={styles.closeText}>סגור</Text>
             </TouchableOpacity>
          </View>
          
          {filteredJobs.map((job) => (
            <TouchableOpacity 
              key={job.id} 
              style={styles.jobListItem}
              onPress={() => router.push(`/job/${job.id}`)}
            >
              <FontAwesome name="chevron-left" size={12} color="#ccc" />
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.jobListCompany}>{job.companyName}</Text>
                <Text style={styles.jobListTitle}>{job.jobTitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {total === 0 && (
        <Text style={styles.emptyText}>אין עדיין נתונים להצגה. הוסף משרה כדי להתחיל!</Text>
      )}

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 25, textAlign: 'right' },
  totalCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  totalLabel: { fontSize: 16, color: '#666', fontWeight: '600' },
  totalValue: { fontSize: 48, fontWeight: '800', color: '#1a1a1a' },
  statsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 15 },
  statBox: {
    backgroundColor: '#fff',
    width: '46.5%',
    padding: 20,
    borderRadius: 15,
    borderRightWidth: 5,
    elevation: 2,
    alignItems: 'center'
  },
  activeStatBox: {
    backgroundColor: '#f0f7ff',
    borderColor: '#2f95dc',
    borderWidth: 1,
  },
  statCount: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 14, color: '#888', marginTop: 5 },
  listSection: { marginTop: 30 },
  listHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  closeText: { color: '#999', fontSize: 14 },
  jobListItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee'
  },
  jobListCompany: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  jobListTitle: { color: '#666', fontSize: 13 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#999' },
  manageSection: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  manageSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'right',
  },
  manageButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'right',
    marginHorizontal: 10,
  },
});