import {StyleSheet} from 'react-native';
import {colors, fontSize, spacing} from '../../theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  carBanner: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  carBannerText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Country selector
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 4,
  },
  locationLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  locationChips: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'nowrap',
  },
  locationChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  locationChipText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  locationChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  // Messages
  emptyState: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    zIndex: -1,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xxl,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  messageList: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  bubble: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: 4,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
  },
  aiBubble: {
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
  },
  roleLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  messageText: {
    color: colors.text,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  // Parts cards
  partsSection: {
    alignSelf: 'stretch',
    marginBottom: spacing.sm,
  },
  partsSectionTitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 2,
  },
  partsScroll: {
    flexDirection: 'row',
  },
  partCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: spacing.sm,
    width: 160,
    borderWidth: 1,
    borderColor: colors.border,
  },
  partCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceLight,
  },
  partImage: {
    width: '100%',
    height: 100,
    backgroundColor: colors.surfaceLight,
  },
  partImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partImagePlaceholderText: {
    fontSize: 36,
  },
  partSource: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginHorizontal: spacing.sm,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  partName: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '600',
    marginHorizontal: spacing.sm,
    marginBottom: 4,
    lineHeight: 18,
  },
  partPrice: {
    fontSize: fontSize.md,
    color: colors.accent,
    fontWeight: 'bold',
    marginHorizontal: spacing.sm,
    marginBottom: 4,
  },
  partCondition: {
    fontSize: 10,
    color: colors.textSecondary,
    marginHorizontal: spacing.sm,
  },
  partViewBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 7,
    alignItems: 'center',
    marginTop: 4,
  },
  partViewBtnText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  // Part detail modal
  detailOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  detailPanel: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  detailImage: {
    width: '100%',
    height: 220,
    backgroundColor: colors.surfaceLight,
  },
  detailImagePlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailImagePlaceholderText: {
    fontSize: 64,
  },
  detailBody: {
    padding: spacing.md,
  },
  detailSourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  detailSource: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailCondition: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  detailName: {
    fontSize: fontSize.xl,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  detailPrice: {
    fontSize: 28,
    color: colors.accent,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  detailBuyBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailBuyBtnText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  detailCloseBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  detailCloseBtnText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  // Loading / input
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: fontSize.md,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: fontSize.md,
  },
});
