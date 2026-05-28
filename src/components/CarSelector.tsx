import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import {useCar} from '../context/CarContext';
import type {Car} from '../types';
import AppIcon from './ui/AppIcon';
import PressableScale from './ui/PressableScale';
import {colors, fontSize, radius, spacing} from '../theme';

type Props = {
  style?: object;
};

const carLabel = (car: Car) =>
  `${car.year} ${car.make} ${car.model}`;

const CarSelector = ({style}: Props) => {
  const {cars, selectedCar, selectCar} = useCar();
  const [open, setOpen] = useState(false);

  if (cars.length === 0) {
    return (
      <View style={[styles.banner, styles.bannerMuted, style]}>
        <AppIcon name="garage-open" size={20} color={colors.textMuted} />
        <Text style={styles.bannerMutedText}>
          No vehicle in garage — add one on Home
        </Text>
      </View>
    );
  }

  const active = selectedCar ?? cars[0];

  const onPick = (car: Car) => {
    selectCar(car);
    setOpen(false);
  };

  return (
    <>
      <PressableScale
        style={[styles.banner, style]}
        onPress={() => setOpen(true)}
        centerContent={false}>
        {active.imageUri ? (
          <Image source={{uri: active.imageUri}} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <AppIcon name="car-sports" size={22} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.bannerTextWrap}>
          <Text style={styles.bannerLabel}>Active vehicle</Text>
          <Text style={styles.bannerText} numberOfLines={1}>
            {carLabel(active)}
          </Text>
        </View>
        <AppIcon name="chevron-down" size={22} color={colors.primary} />
      </PressableScale>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Select from garage</Text>
            <FlatList
              data={cars}
              keyExtractor={item => item.id}
              renderItem={({item}) => {
                const isActive = active.id === item.id;
                return (
                  <PressableScale
                    style={[styles.option, isActive && styles.optionActive]}
                    onPress={() => onPick(item)}
                    centerContent={false}>
                    {item.imageUri ? (
                      <Image source={{uri: item.imageUri}} style={styles.optionThumb} />
                    ) : (
                      <View style={[styles.optionThumb, styles.thumbPlaceholder]}>
                        <AppIcon name="car" size={24} color={colors.textMuted} />
                      </View>
                    )}
                    <Text style={styles.optionText} numberOfLines={2}>
                      {carLabel(item)}
                    </Text>
                    {isActive && (
                      <AppIcon name="check" size={22} color={colors.primary} />
                    )}
                  </PressableScale>
                );
              }}
            />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setOpen(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  banner: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerMuted: {
    backgroundColor: colors.surface,
  },
  bannerMutedText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
  },
  thumbPlaceholder: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextWrap: {flex: 1},
  bannerLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  bannerText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.cardElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  optionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.cardElevated,
  },
  optionThumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
  },
  optionText: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  closeBtn: {
    marginTop: spacing.sm,
    padding: spacing.md,
    alignItems: 'center',
  },
  closeBtnText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});

export default CarSelector;
