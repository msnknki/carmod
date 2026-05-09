import {StyleSheet} from 'react-native';
import {colors, fontSize, spacing} from '../../theme';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backBtn: {
    marginBottom: spacing.md,
  },
  backBtnText: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  screenTitle: {
    fontSize: fontSize.title,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  screenSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: fontSize.lg,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  inputError: {
    borderColor: colors.danger,
  },
  specializationRow: {
    gap: spacing.sm,
  },
  specCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: spacing.sm,
  },
  specCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '18',
  },
  specIcon: {
    fontSize: 22,
    width: 28,
    textAlign: 'center',
  },
  specLabel: {
    flex: 1,
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  specLabelSelected: {
    color: colors.text,
    fontWeight: '700',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  brandGroup: {
    marginBottom: spacing.md,
  },
  brandCategory: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  registerBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  registerBtnText: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  bottomPad: {
    height: spacing.xl,
  },
});
