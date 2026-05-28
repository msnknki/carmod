import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';
import {colors, fontSize, radius, spacing} from '../../theme';
import AppIcon from './AppIcon';
import PressableScale from './PressableScale';

type Props<T extends string | number> = {
  label: string;
  value: T | '';
  options: T[];
  onSelect: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
};

function DropdownPicker<T extends string | number>({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select…',
  disabled = false,
}: Props<T>) {
  const [open, setOpen] = useState(false);

  const display =
    value !== '' && value !== undefined ? String(value) : placeholder;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <PressableScale
        style={[styles.trigger, disabled && styles.triggerDisabled]}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        centerContent={false}>
        <View style={styles.triggerRow}>
          <Text
            style={[
              styles.triggerText,
              (value === '' || value === undefined) && styles.placeholder,
            ]}
            numberOfLines={1}>
            {display}
          </Text>
          <AppIcon name="chevron-down" size={20} color={colors.textMuted} />
        </View>
      </PressableScale>

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={item => String(item)}
              keyboardShouldPersistTaps="handled"
              renderItem={({item}) => {
                const selected = item === value;
                return (
                  <TouchableOpacity
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => {
                      onSelect(item);
                      setOpen(false);
                    }}>
                    <Text
                      style={[
                        styles.optionText,
                        selected && styles.optionTextSelected,
                      ]}>
                      {String(item)}
                    </Text>
                    {selected && (
                      <AppIcon name="check" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setOpen(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {marginBottom: spacing.md},
  label: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: 6,
  },
  trigger: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 52,
    justifyContent: 'center',
  },
  triggerRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerDisabled: {opacity: 0.5},
  triggerText: {
    color: colors.text,
    fontSize: fontSize.md,
    flex: 1,
    marginRight: spacing.sm,
  },
  placeholder: {color: colors.textMuted},
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '70%',
    paddingBottom: spacing.lg,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionSelected: {backgroundColor: 'rgba(255, 214, 10, 0.08)'},
  optionText: {color: colors.text, fontSize: fontSize.md},
  optionTextSelected: {color: colors.primary, fontWeight: '700'},
  cancelBtn: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  cancelText: {color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '600'},
});

export default DropdownPicker;
