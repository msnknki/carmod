import React, {useState} from 'react';
import {
  Text,
  TextInput,
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
import AppIcon from '../components/ui/AppIcon';
import PressableScale from '../components/ui/PressableScale';
import PrimaryButton from '../components/ui/PrimaryButton';

const QUICK_SYMPTOMS = [
  {label: 'Strange Noise', value: 'My car is making a strange noise', icon: 'volume-high'},
  {label: 'Engine Issue', value: 'My car has an engine problem', icon: 'engine'},
  {label: 'Warning Light', value: 'A warning light appeared on my dashboard', icon: 'car-light-alert'},
  {label: 'Vibration', value: 'My car vibrates when driving', icon: 'vibrate'},
  {label: 'Brake Problem', value: 'My brakes feel off', icon: 'car-brake-alert'},
  {label: 'AC Not Working', value: 'My air conditioning is not working', icon: 'snowflake'},
] as const;

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

const CardHeader = ({
  icon,
  title,
}: {
  icon: string;
  title: string;
}) => (
  <View style={styles.cardTitleRow}>
    <AppIcon name={icon} size={20} color={colors.primary} />
    <Text style={styles.cardTitle}>{title}</Text>
  </View>
);

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
      case 'easy':
        return colors.accent;
      case 'moderate':
        return colors.warning;
      case 'hard':
      case 'professional':
        return colors.danger;
      default:
        return colors.textMuted;
    }
  };

  const hasQuestions =
    result?.clarifyingQuestions && result.clarifyingQuestions.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          {selectedCar && (
            <View style={styles.carBanner}>
              <AppIcon name="car-sports" size={20} color={colors.primary} />
              <Text style={styles.carBannerText}>
                {selectedCar.year} {selectedCar.make} {selectedCar.model}
              </Text>
            </View>
          )}

          <Text style={styles.sectionLabel}>Diagnostics</Text>
          <Text style={styles.heading}>Describe your problem</Text>

          <View style={styles.problemCard}>
            <TextInput
              style={styles.textArea}
              placeholder="e.g. Clicking noise when turning the steering wheel..."
              placeholderTextColor={colors.textMuted}
              value={symptom}
              onChangeText={setSymptom}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!result}
            />
          </View>

          {!result && (
            <PrimaryButton
              label={loading ? 'Analyzing...' : 'Diagnose Problem'}
              onPress={() => diagnose()}
              disabled={!symptom.trim() || loading}
              loading={loading}
              style={styles.diagnoseButton}
            />
          )}

          {!result && !loading && (
            <View style={styles.quickSection}>
              <Text style={styles.quickTitle}>Common issues</Text>
              <View style={styles.quickGrid}>
                {QUICK_SYMPTOMS.map(item => (
                  <PressableScale
                    key={item.value}
                    style={styles.quickChip}
                    onPress={() => diagnose(item.value)}>
                    <AppIcon name={item.icon} size={20} color={colors.primary} />
                    <Text style={styles.quickChipText}>{item.label}</Text>
                  </PressableScale>
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
                  <AppIcon name="alert-circle" size={22} color={colors.danger} />
                  <Text style={styles.workshopText}>
                    Workshop recommended: {result.workshopReason}
                  </Text>
                </View>
              )}

              <View style={styles.card}>
                <CardHeader icon="magnify-scan" title="Diagnosis" />
                <Text style={styles.cardContent}>{result.diagnosis}</Text>
                {result.difficulty && result.difficulty !== 'unknown' && (
                  <View style={styles.metaRow}>
                    <View
                      style={[
                        styles.badge,
                        {backgroundColor: getDifficultyColor(result.difficulty)},
                      ]}>
                      <Text style={styles.badgeText}>{result.difficulty}</Text>
                    </View>
                    {!!result.estimatedTime && (
                      <Text style={styles.metaText}>{result.estimatedTime}</Text>
                    )}
                    <Text style={styles.metaText}>
                      Confidence: {result.confidence}
                    </Text>
                  </View>
                )}
              </View>

              {result.safetyWarnings.length > 0 && (
                <View style={[styles.card, styles.warningCard]}>
                  <CardHeader icon="shield-alert" title="Safety warnings" />
                  {result.safetyWarnings.map((w, i) => (
                    <Text key={i} style={styles.warningItem}>
                      • {w}
                    </Text>
                  ))}
                </View>
              )}

              {result.tools.length > 0 && (
                <View style={styles.card}>
                  <CardHeader icon="toolbox-outline" title="Tools needed" />
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
                  <CardHeader icon="format-list-numbered" title="Step-by-step guide" />
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
                  <CardHeader icon="cash" title="Estimated cost" />
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Parts</Text>
                    <Text style={styles.costValue}>
                      {result.estimatedCost.parts}
                    </Text>
                  </View>
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Labor</Text>
                    <Text style={styles.costValue}>
                      {result.estimatedCost.labor}
                    </Text>
                  </View>
                </View>
              )}

              {hasQuestions && (
                <View style={styles.followUpCard}>
                  <CardHeader icon="help-circle-outline" title="Help narrow it down" />
                  {result.clarifyingQuestions!.map((q, i) => (
                    <Text key={i} style={styles.followUpQuestion}>
                      • {q}
                    </Text>
                  ))}
                  <TextInput
                    style={styles.followUpInput}
                    placeholder="Type your answers here..."
                    placeholderTextColor={colors.textMuted}
                    value={followUpAnswer}
                    onChangeText={setFollowUpAnswer}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  <PrimaryButton
                    label="Refine diagnosis"
                    onPress={submitFollowUp}
                    disabled={!followUpAnswer.trim()}
                  />
                </View>
              )}

              <PrimaryButton
                label="New diagnosis"
                variant="outline"
                onPress={reset}
                style={styles.newButton}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default DIYScreen;
