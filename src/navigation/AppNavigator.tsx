import React from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import DIYScreen from '../screens/DIYScreen';
import CustomizationScreen from '../screens/CustomizationScreen';
import AIScreen from '../screens/AIScreen';
import AppIcon from '../components/ui/AppIcon';
import PressableScale from '../components/ui/PressableScale';
import {colors, fontSize, radius, shadows} from '../theme';
import type {RootTabParamList} from '../types';

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_META: Record<
  keyof RootTabParamList,
  {icon: string; label: string}
> = {
  Home: {icon: 'home-variant', label: 'Home'},
  DIY: {icon: 'wrench', label: 'Repair'},
  Customization: {icon: 'tune-variant', label: 'Mods'},
  AI: {icon: 'robot-outline', label: 'AI'},
};

const PremiumTabBar = ({state, descriptors, navigation}: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarOuter, {paddingBottom: Math.max(insets.bottom, 8)}]}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const meta = TAB_META[route.name as keyof RootTabParamList];
          const {options} = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? String(options.tabBarLabel)
              : options.title ?? meta.label;

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
              style={styles.tabItem}
              scaleTo={0.92}>
              <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
                <AppIcon
                  name={meta.icon}
                  size={22}
                  color={focused ? '#0B0B0B' : colors.textMuted}
                />
              </View>
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                {label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
};

const AppNavigator = () => {
  return (
    <Tab.Navigator
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
        name="Home"
        component={HomeScreen}
        options={{headerShown: false}}
      />
      <Tab.Screen
        name="DIY"
        component={DIYScreen}
        options={{headerShown: false}}
      />
      <Tab.Screen
        name="Customization"
        component={CustomizationScreen}
        options={{headerShown: false}}
      />
      <Tab.Screen
        name="AI"
        component={AIScreen}
        options={{title: 'AI Assistant', headerShown: false}}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarOuter: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 4,
    ...shadows.card,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabIconWrap: {
    width: 44,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: colors.primary,
    ...shadows.glow,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});

export default AppNavigator;
