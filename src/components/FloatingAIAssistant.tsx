import React, {useState, useEffect, useMemo} from 'react';
import {Modal, View, StyleSheet, Platform} from 'react-native';
import PressableScale from './ui/PressableScale';
import {useNavigationState} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../context/ThemeContext';
import {useAIAssistant} from '../context/AIAssistantContext';
import AppIcon from './ui/AppIcon';
import AIChatAssistant from './AIChatAssistant';

export const AI_FAB_SIZE = 56;
export const AI_FAB_RIGHT = 20;
const TAB_BAR_OFFSET = Platform.OS === 'ios' ? 88 : 72;

const FloatingAIAssistant = () => {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const {colors, shadows} = useTheme();
  const {registerOpen, openCustomizationAssistant} = useAIAssistant();

  useEffect(() => {
    registerOpen(() => setOpen(true));
  }, [registerOpen]);

  const activeTab = useNavigationState(
    state => state?.routes[state.index]?.name,
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        fab: {
          position: 'absolute',
          right: AI_FAB_RIGHT,
          backgroundColor: colors.aiAssistant,
          borderRadius: AI_FAB_SIZE / 2,
          width: AI_FAB_SIZE,
          height: AI_FAB_SIZE,
          zIndex: 100,
          ...shadows.aiGlow,
        },
        modalRoot: {
          flex: 1,
          backgroundColor: colors.background,
          paddingTop: Platform.OS === 'ios' ? 8 : 0,
        },
      }),
    [colors, shadows],
  );

  const handlePress = () => {
    if (activeTab === 'Customization') {
      openCustomizationAssistant();
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <PressableScale
        style={[
          styles.fab,
          {
            bottom: TAB_BAR_OFFSET + Math.max(insets.bottom, 8),
            alignSelf: 'auto',
          },
        ]}
        onPress={handlePress}
        accessibilityLabel="Open AI assistant">
        <AppIcon name="robot-outline" size={28} color={colors.onAiAssistant} />
      </PressableScale>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <AIChatAssistant embedded onClose={() => setOpen(false)} />
        </View>
      </Modal>
    </>
  );
};

export default FloatingAIAssistant;
