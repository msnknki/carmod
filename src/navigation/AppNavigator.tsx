import React from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import DIYScreen from '../screens/DIYScreen';
import CustomizationScreen from '../screens/CustomizationScreen';
import FloatingAIAssistant from '../components/FloatingAIAssistant';
import AppIcon from '../components/ui/AppIcon';
import PressableScale from '../components/ui/PressableScale';
import {colors, fontSize, shadows} from '../theme';
import type {RootTabParamList} from '../types';

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_META: Record<
  keyof RootTabParamList,
  {icon: string; label: string}
> = {
  DIY: {icon: 'wrench', label: 'Repair'},
  Home: {icon: 'home-variant', label: 'Home'},
  Customization: {icon: 'tune-variant', label: 'Mods'},
};

/** Visual order: Repair | Home (center) | Mods */
const TAB_ORDER: (keyof RootTabParamList)[] = ['DIY', 'Home', 'Customization'];

const PremiumTabBar = ({state, descriptors, navigation}: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBarOuter,
        {paddingBottom: Math.max(insets.bottom, 6)},
      ]}>
      <View style={styles.tabBar}>
        {TAB_ORDER.map(tabName => {
          const route = state.routes.find(r => r.name === tabName);
          if (!route) {
            return null;
          }

          const index = state.routes.findIndex(r => r.key === route.key);
          const focused = state.index === index;
          const meta = TAB_META[tabName];
          const {options} = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? String(options.tabBarLabel)
              : options.title ?? meta.label;
          const isHome = tabName === 'Home';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <PressableScale
              key={route.key}
              onPress={onPress}
              style={[styles.tabItem, isHome && styles.tabItemHome]}
              scaleTo={0.94}>
              <View
                style={[
                  styles.tabInner,
                  isHome && styles.tabInnerHome,
                ]}>
                <View
                  style={[
                    styles.tabIconWrap,
                    focused && styles.tabIconWrapActive,
                    isHome && styles.tabIconWrapHome,
                    isHome && focused && styles.tabIconWrapHomeActive,
                  ]}>
                  <AppIcon
                    name={meta.icon}
                    size={isHome ? 26 : 22}
                    color={focused ? '#0B0B0B' : colors.textMuted}
                  />
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    focused && styles.tabLabelActive,
                    isHome && styles.tabLabelHome,
                  ]}>
                  {label}
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
};

const AppNavigator = () => {
  return (
    <View style={styles.root}>
      <Tab.Navigator
        initialRouteName="Home"
        tabBar={props => <PremiumTabBar {...props} />}
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.backgroundSecondary,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: fontSize.xl,
            letterSpacing: -0.2,
          },
          headerShadowVisible: false,
        }}>
        <Tab.Screen
          name="DIY"
          component={DIYScreen}
          options={{headerShown: false}}
        />
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{headerShown: false}}
        />
        <Tab.Screen
          name="Customization"
          component={CustomizationScreen}
          options={{headerShown: false}}
        />
      </Tab.Navigator>
      <FloatingAIAssistant />
    </View>
  );
};

const ARC_RADIUS = 36;

const styles = StyleSheet.create({
  root: {flex: 1},
  tabBarOuter: {
    backgroundColor: colors.background,
    paddingTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.card,
    borderTopLeftRadius: ARC_RADIUS,
    borderTopRightRadius: ARC_RADIUS,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    paddingTop: 10,
    paddingBottom: 6,
    paddingHorizontal: 6,
    minHeight: 68,
    ...shadows.card,
  },
  tabItem: {
    flex: 1,
    minHeight: 58,
    justifyContent: 'center',
  },
  tabItemHome: {
    marginTop: -14,
  },
  tabInner: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  tabInnerHome: {
    paddingVertical: 4,
  },
  tabIconWrap: {
    width: 40,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: colors.primary,
    ...shadows.glow,
  },
  tabIconWrapHome: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabIconWrapHomeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  tabLabelHome: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AppNavigator;
