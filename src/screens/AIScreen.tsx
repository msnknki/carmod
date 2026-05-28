import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import AIChatAssistant from '../components/AIChatAssistant';

/** @deprecated Use FloatingAIAssistant + AIChatAssistant instead */
const AIScreen = () => (
  <SafeAreaView style={{flex: 1}} edges={['top', 'bottom']}>
    <AIChatAssistant embedded />
  </SafeAreaView>
);

export default AIScreen;
