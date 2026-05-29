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
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface Job {
  id: string;
  companyName: string;
  jobTitle: string;
  jobDescription?: string;
  link?: string;
}

interface AnalysisResult {
  matchPercentage: number;
  experienceMatch: { required: string; yours: string; gap: string };
  locationMatch: { jobLocation: string; compatible: boolean; note: string };
  skillsAnalysis: { matched: string[]; missing: string[]; bonus: string[] };
  requirementsAnalysis: { met: string[]; notMet: string[]; partial: string[] };
  strengths: string[];
  suggestions: string[];
  summary: string;
}

type InputMode = 'select' | 'url' | 'text';

export default function AnalysisScreen() {
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const [inputMode, setInputMode] = useState<InputMode>('select');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [jobUrl, setJobUrl] = useState('');
  const [jobText, setJobText] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (isFocused && user) {
      fetchJobs();
    }
  }, [isFocused]);

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const response = await api.get(`/jobs/${user!.uid}`);
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleAnalyze = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    // Validate input based on mode
    if (inputMode === 'select' && !selectedJobId) {
      Alert.alert('שגיאה', 'בחר משרה מהרשימה');
      return;
    }
    if (inputMode === 'url' && !jobUrl.trim()) {
      Alert.alert('שגיאה', 'הדבק URL של משרה');
      return;
    }
    if (inputMode === 'text' && !jobText.trim()) {
      Alert.alert('שגיאה', 'הדבק תיאור/דרישות המשרה');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {};

      if (inputMode === 'select') {
        const selectedJob = jobs.find(j => j.id === selectedJobId);
        if (selectedJob) {
          // Send jobId so server can use cached jobFullDescription
          payload.jobId = selectedJob.id;
          // If job has a link, send it as fallback for scraping
          if (selectedJob.link) {
            payload.jobDescriptionUrl = selectedJob.link;
          }
          // Always send the stored description as fallback
          payload.jobDescriptionText = selectedJob.jobDescription || `${selectedJob.jobTitle} at ${selectedJob.companyName}`;
          payload.jobTitle = selectedJob.jobTitle;
        }
      } else if (inputMode === 'url') {
        payload.jobDescriptionUrl = jobUrl;
      } else {
        payload.jobDescriptionText = jobText;
      }

      if (jobTitle.trim() && inputMode !== 'select') {
        payload.jobTitle = jobTitle;
      }

      const response = await api.post(`/jobs/${user.uid}/analyze-cv`, payload);
      setResult(response.data.analysis);
    } catch (error: any) {
      console.error('Analysis error:', error);
      const message = error.response?.data?.error || 'הניתוח נכשל. ודא שהעלית CV בדף הפרופיל.';
      Alert.alert('שגיאה', message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (pct: number) => {
    if (pct >= 75) return '#10b981';
    if (pct >= 50) return '#f59e0b';
    return '#ef4444';
  };

  if (result) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Score Header */}
        <View style={styles.scoreHeader}>
          <View style={[styles.scoreCircle, { borderColor: getScoreColor(result.matchPercentage) }]}>
            <Text style={[styles.scoreText, { color: getScoreColor(result.matchPercentage) }]}>
              {result.matchPercentage}%
            </Text>
          </View>
          <Text style={styles.scoreLabel}>התאמה כללית</Text>
          <Text style={styles.summaryText}>{result.summary}</Text>
        </View>

        {/* Experience Match */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 ניסיון</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>נדרש:</Text>
            <Text style={styles.rowValue}>{result.experienceMatch.required}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>שלך:</Text>
            <Text style={styles.rowValue}>{result.experienceMatch.yours}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>פער:</Text>
            <Text style={[styles.rowValue, { color: result.experienceMatch.gap === 'Meets requirement' ? '#10b981' : '#f59e0b' }]}>
              {result.experienceMatch.gap}
            </Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 מיקום</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>מיקום המשרה:</Text>
            <Text style={styles.rowValue}>{result.locationMatch.jobLocation}</Text>
          </View>
        </View>

        {/* Skills Analysis */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🛠 כישורים</Text>
          {result.skillsAnalysis.matched.length > 0 && (
            <View style={styles.tagSection}>
              <Text style={styles.tagLabel}>✓ יש לך:</Text>
              <View style={styles.tagRow}>
                {result.skillsAnalysis.matched.map((skill, i) => (
                  <View key={i} style={[styles.tag, styles.tagGreen]}>
                    <Text style={styles.tagTextGreen}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {result.skillsAnalysis.missing.length > 0 && (
            <View style={styles.tagSection}>
              <Text style={styles.tagLabel}>✗ חסר:</Text>
              <View style={styles.tagRow}>
                {result.skillsAnalysis.missing.map((skill, i) => (
                  <View key={i} style={[styles.tag, styles.tagRed]}>
                    <Text style={styles.tagTextRed}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {result.skillsAnalysis.bonus.length > 0 && (
            <View style={styles.tagSection}>
              <Text style={styles.tagLabel}>⭐ בונוס:</Text>
              <View style={styles.tagRow}>
                {result.skillsAnalysis.bonus.map((skill, i) => (
                  <View key={i} style={[styles.tag, styles.tagBlue]}>
                    <Text style={styles.tagTextBlue}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Requirements */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 דרישות</Text>
          {result.requirementsAnalysis.met.length > 0 && (
            <View style={styles.listSection}>
              <Text style={styles.listLabel}>✓ עומד בדרישות:</Text>
              {result.requirementsAnalysis.met.map((req, i) => (
                <Text key={i} style={styles.listItemGreen}>• {req}</Text>
              ))}
            </View>
          )}
          {result.requirementsAnalysis.notMet.length > 0 && (
            <View style={styles.listSection}>
              <Text style={styles.listLabel}>✗ לא עומד:</Text>
              {result.requirementsAnalysis.notMet.map((req, i) => (
                <Text key={i} style={styles.listItemRed}>• {req}</Text>
              ))}
            </View>
          )}
          {result.requirementsAnalysis.partial.length > 0 && (
            <View style={styles.listSection}>
              <Text style={styles.listLabel}>~ חלקי:</Text>
              {result.requirementsAnalysis.partial.map((req, i) => (
                <Text key={i} style={styles.listItemOrange}>• {req}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Strengths */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💪 נקודות חוזק</Text>
          {result.strengths.map((s, i) => (
            <Text key={i} style={styles.bulletItem}>• {s}</Text>
          ))}
        </View>

        {/* Suggestions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💡 המלצות לשיפור</Text>
          {result.suggestions.map((s, i) => (
            <Text key={i} style={styles.bulletItem}>• {s}</Text>
          ))}
        </View>

        {/* New Analysis Button */}
        <TouchableOpacity style={styles.resetButton} onPress={() => setResult(null)}>
          <Text style={styles.resetButtonText}>← ניתוח חדש</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>ניתוח התאמה למשרה</Text>
      <Text style={styles.subtitle}>בחר מקור משרה וקבל ניתוח מפורט מול קורות החיים שלך</Text>

      {/* Mode Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeBtn, inputMode === 'select' && styles.modeBtnActive]}
          onPress={() => setInputMode('select')}
        >
          <Text style={[styles.modeBtnText, inputMode === 'select' && styles.modeBtnTextActive]}>מהרשימה</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, inputMode === 'url' && styles.modeBtnActive]}
          onPress={() => setInputMode('url')}
        >
          <Text style={[styles.modeBtnText, inputMode === 'url' && styles.modeBtnTextActive]}>URL</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, inputMode === 'text' && styles.modeBtnActive]}
          onPress={() => setInputMode('text')}
        >
          <Text style={[styles.modeBtnText, inputMode === 'text' && styles.modeBtnTextActive]}>טקסט</Text>
        </TouchableOpacity>
      </View>

      {/* Input Section */}
      <View style={styles.inputSection}>
        {inputMode === 'select' && (
          <>
            <Text style={styles.label}>בחר משרה מהרשימה שלך:</Text>
            {loadingJobs ? (
              <ActivityIndicator color="#0066cc" />
            ) : jobs.length === 0 ? (
              <Text style={styles.emptyText}>אין משרות. הוסף משרה קודם.</Text>
            ) : (
              <View style={styles.jobList}>
                {jobs.map((job) => (
                  <TouchableOpacity
                    key={job.id}
                    style={[styles.jobOption, selectedJobId === job.id && styles.jobOptionSelected]}
                    onPress={() => setSelectedJobId(job.id)}
                  >
                    <Text style={[styles.jobOptionTitle, selectedJobId === job.id && { color: '#fff' }]}>
                      {job.jobTitle}
                    </Text>
                    <Text style={[styles.jobOptionCompany, selectedJobId === job.id && { color: '#ddd' }]}>
                      {job.companyName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {inputMode === 'url' && (
          <>
            <Text style={styles.label}>URL של משרה:</Text>
            <TextInput
              style={styles.input}
              placeholder="https://www.linkedin.com/jobs/..."
              value={jobUrl}
              onChangeText={setJobUrl}
              autoCapitalize="none"
              keyboardType="url"
              placeholderTextColor="#999"
            />
            <Text style={styles.label}>שם התפקיד (אופציונלי):</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Senior Developer"
              value={jobTitle}
              onChangeText={setJobTitle}
              placeholderTextColor="#999"
            />
          </>
        )}

        {inputMode === 'text' && (
          <>
            <Text style={styles.label}>דרישות / תיאור המשרה:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="הדבק כאן את דרישות המשרה..."
              value={jobText}
              onChangeText={setJobText}
              multiline
              placeholderTextColor="#999"
            />
            <Text style={styles.label}>שם התפקיד (אופציונלי):</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Senior Developer"
              value={jobTitle}
              onChangeText={setJobTitle}
              placeholderTextColor="#999"
            />
          </>
        )}
      </View>

      {/* Analyze Button */}
      <TouchableOpacity
        style={[styles.analyzeButton, loading && { opacity: 0.6 }]}
        onPress={handleAnalyze}
        disabled={loading}
      >
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.analyzeButtonText}>  מנתח...</Text>
          </View>
        ) : (
          <Text style={styles.analyzeButtonText}>🔍 נתח התאמה</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'right', marginBottom: 8, color: '#1a1a1a' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'right', marginBottom: 20 },

  // Mode Toggle
  modeToggle: { flexDirection: 'row-reverse', backgroundColor: '#fff', borderRadius: 10, padding: 4, marginBottom: 20 },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  modeBtnActive: { backgroundColor: '#0066cc' },
  modeBtnText: { fontSize: 14, fontWeight: '600', color: '#666' },
  modeBtnTextActive: { color: '#fff' },

  // Input
  inputSection: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, textAlign: 'right' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 14, color: '#1a1a1a', marginBottom: 12 },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 10 },

  // Job List
  jobList: { gap: 8 },
  jobOption: { backgroundColor: '#fff', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  jobOptionSelected: { backgroundColor: '#0066cc', borderColor: '#0066cc' },
  jobOptionTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', textAlign: 'right' },
  jobOptionCompany: { fontSize: 13, color: '#666', textAlign: 'right', marginTop: 2 },

  // Analyze Button
  analyzeButton: { backgroundColor: '#0066cc', padding: 16, borderRadius: 12, alignItems: 'center' },
  analyzeButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },

  // Results - Score
  scoreHeader: { alignItems: 'center', marginBottom: 20, paddingVertical: 20 },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 5, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', marginBottom: 12 },
  scoreText: { fontSize: 36, fontWeight: '800' },
  scoreLabel: { fontSize: 16, fontWeight: '600', color: '#666', marginBottom: 8 },
  summaryText: { fontSize: 14, color: '#444', textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 },

  // Cards
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#1a1a1a' },

  // Rows
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontSize: 14, color: '#666' },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  noteText: { fontSize: 13, color: '#888', marginTop: 4, fontStyle: 'italic' },

  // Tags
  tagSection: { marginBottom: 12 },
  tagLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  tagRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  tagGreen: { backgroundColor: '#d1fae5' },
  tagRed: { backgroundColor: '#fee2e2' },
  tagBlue: { backgroundColor: '#dbeafe' },
  tagTextGreen: { color: '#065f46', fontSize: 12, fontWeight: '600' },
  tagTextRed: { color: '#991b1b', fontSize: 12, fontWeight: '600' },
  tagTextBlue: { color: '#1e40af', fontSize: 12, fontWeight: '600' },

  // Lists
  listSection: { marginBottom: 10 },
  listLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 4 },
  listItemGreen: { fontSize: 13, color: '#065f46', marginBottom: 3, textAlign: 'right' },
  listItemRed: { fontSize: 13, color: '#991b1b', marginBottom: 3, textAlign: 'right' },
  listItemOrange: { fontSize: 13, color: '#92400e', marginBottom: 3, textAlign: 'right' },

  // Bullets
  bulletItem: { fontSize: 14, color: '#333', marginBottom: 8, lineHeight: 20, textAlign: 'right' },

  // Reset
  resetButton: { backgroundColor: '#f0f0f0', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  resetButtonText: { color: '#666', fontSize: 15, fontWeight: '600' },
});
