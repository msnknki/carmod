import React, {useState, useEffect} from 'react';
import {Modal, View, StyleSheet, Platform} from 'react-native';
import PressableScale from './ui/PressableScale';
import {useNavigationState} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, shadows} from '../theme';
import {useAIAssistant} from '../context/AIAssistantContext';
import AppIcon from './ui/AppIcon';
import AIChatAssistant from './AIChatAssistant';

const TAB_BAR_OFFSET = Platform.OS === 'ios' ? 88 : 72;

const FloatingAIAssistant = () => {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const {registerOpen} = useAIAssistant();

  useEffect(() => {
    registerOpen(() => setOpen(true));
  }, [registerOpen]);

  const activeTab = useNavigationState(
    state => state?.routes[state.index]?.name,
  );
  const hiddenOnCustomization = activeTab === 'Customization';

  return (
    <>
      {!hiddenOnCustomization && (
      <PressableScale
        style={[
          styles.fab,
          {
            bottom: TAB_BAR_OFFSET + Math.max(insets.bottom, 8),
            alignSelf: 'auto',
          },
        ]}
        onPress={() => setOpen(true)}
        accessibilityLabel="Open AI assistant">
        <AppIcon name="robot-outline" size={28} color="#0B0B0B" />
      </PressableScale>
      )}

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

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 28,
    width: 56,
    height: 56,
    zIndex: 100,
    elevation: 8,
    ...shadows.glow,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 8 : 0,
  },
});

export default FloatingAIAssistant;
