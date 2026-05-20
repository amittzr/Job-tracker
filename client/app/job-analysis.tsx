import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface JobAnalysisResult {
  matchPercentage: number;
  strengths: string[];
  gaps: string[];
  suggestions: string[];
  summary: string;
}

type InputMode = 'url' | 'text';

export default function JobAnalysisScreen() {
  const { user } = useAuth();
  const [inputMode, setInputMode] = useState<InputMode>('url');
  const [jobUrl, setJobUrl] = useState('');
  const [jobText, setJobText] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JobAnalysisResult | null>(null);

  // Validate and submit for analysis
  const handleAnalyze = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (inputMode === 'url' && !jobUrl.trim()) {
      Alert.alert('Validation', 'Please enter a job posting URL');
      return;
    }

    if (inputMode === 'text' && !jobText.trim()) {
      Alert.alert('Validation', 'Please paste a job description');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {};

      if (inputMode === 'url') {
        payload.jobDescriptionUrl = jobUrl;
      } else {
        payload.jobDescriptionText = jobText;
      }

      if (jobTitle.trim()) {
        payload.jobTitle = jobTitle;
      }

      const response = await api.post(`/jobs/${user.uid}/analyze-cv`, payload);

      setResult(response.data.analysis);
      setJobUrl('');
      setJobText('');
    } catch (error: any) {
      console.error('Analysis error:', error);
      const message =
        error.response?.data?.error ||
        'Failed to analyze CV against job description. Please ensure your CV is uploaded.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  // Render match score with color coding
  const getScoreColor = (percentage: number): string => {
    if (percentage >= 80) return '#10b981'; // Green
    if (percentage >= 60) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Job Match Analysis</Text>
        <Text style={styles.subtitle}>
          Analyze how well your CV matches a job description
        </Text>
      </View>

      {/* Input Mode Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, inputMode === 'url' && styles.modeButtonActive]}
          onPress={() => setInputMode('url')}
        >
          <Text
            style={[styles.modeButtonText, inputMode === 'url' && styles.modeButtonTextActive]}
          >
            URL
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, inputMode === 'text' && styles.modeButtonActive]}
          onPress={() => setInputMode('text')}
        >
          <Text
            style={[styles.modeButtonText, inputMode === 'text' && styles.modeButtonTextActive]}
          >
            Paste Text
          </Text>
        </TouchableOpacity>
      </View>

      {/* Job Input Section */}
      <View style={styles.inputSection}>
        {inputMode === 'url' ? (
          <>
            <Text style={styles.label}>Job Posting URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://careers.example.com/jobs/123"
              value={jobUrl}
              onChangeText={setJobUrl}
              placeholderTextColor="#999"
              editable={!loading}
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>Job Description</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Paste the complete job description here..."
              value={jobText}
              onChangeText={setJobText}
              multiline
              placeholderTextColor="#999"
              editable={!loading}
            />
          </>
        )}

        <Text style={styles.label}>Job Title (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Senior Software Engineer"
          value={jobTitle}
          onChangeText={setJobTitle}
          placeholderTextColor="#999"
          editable={!loading}
        />
      </View>

      {/* Analyze Button */}
      <TouchableOpacity
        style={[styles.analyzeButton, loading && styles.buttonDisabled]}
        onPress={handleAnalyze}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.analyzeButtonText}>🔍 Analyze Match</Text>
        )}
      </TouchableOpacity>

      {/* Results Section */}
      {result && (
        <View style={styles.resultsContainer}>
          {/* Match Percentage Score */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreCircle}>
              <Text
                style={[
                  styles.scoreText,
                  { color: getScoreColor(result.matchPercentage) },
                ]}
              >
                {result.matchPercentage}%
              </Text>
            </View>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreLabel}>Match Score</Text>
              <Text style={styles.scoreDescription}>
                {result.matchPercentage >= 80
                  ? 'Excellent fit!'
                  : result.matchPercentage >= 60
                  ? 'Good match'
                  : 'Consider skill development'}
              </Text>
            </View>
          </View>

          {/* Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.summary}>{result.summary}</Text>
          </View>

          {/* Strengths */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.strengthsTitle]}>
              ✅ Your Strengths
            </Text>
            {result.strengths.map((strength, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.checkmark} />
                <Text style={styles.listText}>{strength}</Text>
              </View>
            ))}
          </View>

          {/* Gaps */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.gapsTitle]}>
              ⚠️ Skill Gaps
            </Text>
            {result.gaps.map((gap, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.warning} />
                <Text style={styles.listText}>{gap}</Text>
              </View>
            ))}
          </View>

          {/* Suggestions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.suggestionsTitle]}>
              💡 Actionable Tips
            </Text>
            {result.suggestions.map((suggestion, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.bulb} />
                <Text style={styles.listText}>{suggestion}</Text>
              </View>
            ))}
          </View>

          {/* Reset Button */}
          <TouchableOpacity style={styles.resetButton} onPress={() => setResult(null)}>
            <Text style={styles.resetButtonText}>← New Analysis</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  header: {
    marginBottom: 24,
    marginTop: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modeToggle: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#0066cc',
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  multilineInput: {
    minHeight: 120,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  analyzeButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    marginTop: 20,
  },
  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0066cc',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '700',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  scoreDescription: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  strengthsTitle: {
    color: '#10b981',
  },
  gapsTitle: {
    color: '#f59e0b',
  },
  suggestionsTitle: {
    color: '#0066cc',
  },
  summary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontWeight: '500',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 10,
  },
  listText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    lineHeight: 18,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    marginTop: 2,
  },
  warning: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f59e0b',
    marginTop: 2,
  },
  bulb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0066cc',
    marginTop: 2,
  },
  resetButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  resetButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  spacer: {
    height: 40,
  },
});
