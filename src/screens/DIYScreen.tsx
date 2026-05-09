import React, {useState} from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors} from '../theme';
import styles from './styles/DIYScreen.styles';
import {useCar} from '../context/CarContext';
import {api} from '../services/api';

const QUICK_SYMPTOMS = [
  {label: '🔊 Strange Noise', value: 'My car is making a strange noise'},
  {label: '🔧 Engine Issue', value: 'My car has an engine problem'},
  {label: '💡 Warning Light', value: 'A warning light appeared on my dashboard'},
  {label: '📳 Vibration', value: 'My car vibrates when driving'},
  {label: '🛞 Brake Problem', value: 'My brakes feel off'},
  {label: '❄️ AC Not Working', value: 'My air conditioning is not working'},
];

type DiagnosisResult = {
  diagnosis: string;
  confidence: string;
  difficulty: string;
  estimatedTime: string;
  tools: string[];
  steps: string[];
  safetyWarnings: string[];
  workshopRecommended: boolean;
  workshopReason: string;
  estimatedCost: {parts: string; labor: string};
  clarifyingQuestions?: string[];
};

const DIYScreen = () => {
  const {selectedCar} = useCar();
  const [symptom, setSymptom] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [savedSymptom, setSavedSymptom] = useState('');

  const diagnose = async (text?: string, additionalContext?: string) => {
    const input = text || symptom.trim();
    if (!input || loading) {
      return;
    }

    setLoading(true);
    setResult(null);
    setFollowUpAnswer('');

    if (!additionalContext) {
      setSymptom(input);
      setSavedSymptom(input);
    }

    try {
      const res = await api.post('/diy', {
        symptom: input,
        carId: selectedCar?.id,
        ...(additionalContext ? {additionalContext} : {}),
      });
      setResult(res);
    } catch (err: any) {
      const msg =
        err.message?.includes('busy') ||
        err.message?.includes('quota') ||
        err.message?.includes('429')
          ? 'AI service is busy — please wait a moment and try again.'
          : err.message || 'Failed to get diagnosis. Make sure the backend is running.';
      setResult({
        diagnosis: msg,
        confidence: 'low',
        difficulty: 'unknown',
        estimatedTime: '',
        tools: [],
        steps: [],
        safetyWarnings: [],
        workshopRecommended: false,
        workshopReason: '',
        estimatedCost: {parts: '', labor: ''},
        clarifyingQuestions: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const submitFollowUp = () => {
    if (!followUpAnswer.trim()) {
      return;
    }
    diagnose(savedSymptom, followUpAnswer.trim());
  };

  const reset = () => {
    setResult(null);
    setSymptom('');
    setFollowUpAnswer('');
    setSavedSymptom('');
  };

  const getDifficultyColor = (d: string) => {
    switch (d) {
      case 'easy': return colors.accent;
      case 'moderate': return colors.warning;
      case 'hard': return colors.danger;
      case 'professional': return colors.danger;
      default: return colors.textSecondary;
    }
  };

  const hasQuestions =
    result?.clarifyingQuestions && result.clarifyingQuestions.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {selectedCar && (
            <View style={styles.carBanner}>
              <Text style={styles.carBannerText}>
                🚗 {selectedCar.year} {selectedCar.make} {selectedCar.model}
              </Text>
            </View>
          )}

          <Text style={styles.heading}>Describe Your Problem</Text>

          <TextInput
            style={styles.textArea}
            placeholder="e.g. My car makes a clicking noise when I turn the steering wheel..."
            placeholderTextColor={colors.textSecondary}
            value={symptom}
            onChangeText={setSymptom}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!result}
          />

          {!result && (
            <TouchableOpacity
              style={[styles.diagnoseButton, (!symptom.trim() || loading) && styles.disabled]}
              onPress={() => diagnose()}
              disabled={!symptom.trim() || loading}>
              <Text style={styles.diagnoseButtonText}>
                {loading ? 'Analyzing...' : '🔍 Diagnose Problem'}
              </Text>
            </TouchableOpacity>
          )}

          {!result && !loading && (
            <View style={styles.quickSection}>
              <Text style={styles.quickTitle}>Or select a common issue:</Text>
              <View style={styles.quickGrid}>
                {QUICK_SYMPTOMS.map(item => (
                  <TouchableOpacity
                    key={item.value}
                    style={styles.quickButton}
                    onPress={() => diagnose(item.value)}>
                    <Text style={styles.quickButtonText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Analyzing symptoms...</Text>
            </View>
          )}

          {result && !loading && (
            <View style={styles.results}>
              {result.workshopRecommended && (
                <View style={styles.workshopWarning}>
                  <Text style={styles.workshopIcon}>⚠️</Text>
                  <Text style={styles.workshopText}>
                    Workshop Recommended: {result.workshopReason}
                  </Text>
                </View>
              )}

              <View style={styles.card}>
                <Text style={styles.cardTitle}>🔍 Diagnosis</Text>
                <Text style={styles.cardContent}>{result.diagnosis}</Text>
                {result.difficulty && result.difficulty !== 'unknown' && (
                  <View style={styles.metaRow}>
                    <View style={[styles.badge, {backgroundColor: getDifficultyColor(result.difficulty)}]}>
                      <Text style={styles.badgeText}>{result.difficulty}</Text>
                    </View>
                    {!!result.estimatedTime && (
                      <Text style={styles.metaText}>⏱ {result.estimatedTime}</Text>
                    )}
                    <Text style={styles.metaText}>Confidence: {result.confidence}</Text>
                  </View>
                )}
              </View>

              {result.safetyWarnings.length > 0 && (
                <View style={[styles.card, styles.warningCard]}>
                  <Text style={styles.cardTitle}>⚠️ Safety Warnings</Text>
                  {result.safetyWarnings.map((w, i) => (
                    <Text key={i} style={styles.warningItem}>• {w}</Text>
                  ))}
                </View>
              )}

              {result.tools.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>🛠️ Tools Needed</Text>
                  <View style={styles.toolsGrid}>
                    {result.tools.map((t, i) => (
                      <View key={i} style={styles.toolChip}>
                        <Text style={styles.toolChipText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {result.steps.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>📋 Step-by-Step Guide</Text>
                  {result.steps.map((s, i) => (
                    <View key={i} style={styles.stepRow}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{i + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}

              {(result.estimatedCost.parts || result.estimatedCost.labor) && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>💰 Estimated Cost</Text>
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Parts:</Text>
                    <Text style={styles.costValue}>{result.estimatedCost.parts}</Text>
                  </View>
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Labor:</Text>
                    <Text style={styles.costValue}>{result.estimatedCost.labor}</Text>
                  </View>
                </View>
              )}

              {/* Follow-up questions */}
              {hasQuestions && (
                <View style={styles.followUpCard}>
                  <Text style={styles.followUpTitle}>
                    🤔 Help me narrow it down further:
                  </Text>
                  {result.clarifyingQuestions!.map((q, i) => (
                    <Text key={i} style={styles.followUpQuestion}>
                      • {q}
                    </Text>
                  ))}
                  <TextInput
                    style={styles.followUpInput}
                    placeholder="Type your answers here..."
                    placeholderTextColor={colors.textSecondary}
                    value={followUpAnswer}
                    onChangeText={setFollowUpAnswer}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  <TouchableOpacity
                    style={[
                      styles.followUpButton,
                      !followUpAnswer.trim() && styles.disabled,
                    ]}
                    onPress={submitFollowUp}
                    disabled={!followUpAnswer.trim()}>
                    <Text style={styles.followUpButtonText}>
                      🔍 Get More Specific Diagnosis
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={styles.newButton} onPress={reset}>
                <Text style={styles.newButtonText}>🔄 New Diagnosis</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


export default DIYScreen;
