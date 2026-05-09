// INTEGRATION STEP 1: Create src/navigation/AuthNavigator.tsx as a Stack navigator:
//
//   import { createNativeStackNavigator } from '@react-navigation/native-stack';
//   import LoginScreen from '../screens/LoginScreen';
//   import MechanicRegisterScreen from '../screens/MechanicRegisterScreen';
//
//   export type AuthStackParamList = { Login: undefined; MechanicRegister: undefined };
//   const Stack = createNativeStackNavigator<AuthStackParamList>();
//
//   export default function AuthNavigator() {
//     return (
//       <Stack.Navigator screenOptions={{ headerShown: false }}>
//         <Stack.Screen name="Login" component={LoginScreen} />
//         <Stack.Screen name="MechanicRegister" component={MechanicRegisterScreen} />
//       </Stack.Navigator>
//     );
//   }
//
// Then follow the STEP 4 comment in App.tsx to switch between AuthNavigator and AppNavigator.

import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text} from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import DIYScreen from '../screens/DIYScreen';
import CustomizationScreen from '../screens/CustomizationScreen';
import AIScreen from '../screens/AIScreen';
import {colors} from '../theme';
import type {RootTabParamList} from '../types';

const Tab = createBottomTabNavigator<RootTabParamList>();

const tabIcons: Record<keyof RootTabParamList, string> = {
  Home: '🏠',
  DIY: '🔧',
  Customization: '🎨',
  AI: '🤖',
};

const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerStyle: {backgroundColor: colors.surface},
        headerTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({focused}) => (
          <Text style={{fontSize: focused ? 24 : 20}}>
            {tabIcons[route.name]}
          </Text>
        ),
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="DIY"
        component={DIYScreen}
        options={{title: 'DIY Repair'}}
      />
      <Tab.Screen name="Customization" component={CustomizationScreen} />
      <Tab.Screen
        name="AI"
        component={AIScreen}
        options={{title: 'AI Assistant'}}
      />
    </Tab.Navigator>
  );
};

export default AppNavigator;
