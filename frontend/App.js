import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'react-native';
import { lightTheme, darkTheme } from './src/theme/colors';

// Ekran İmportları
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import DashboardScreen from './src/screens/main/DashboardScreen';
import ExamAnalysisScreen from './src/screens/main/ExamAnalysisScreen';
import AIChatScreen from './src/screens/main/AIChatScreen';
import SummarizeScreen from './src/screens/main/SummarizeScreen';
import QuizGenerateScreen from './src/screens/main/QuizGenerateScreen';
import ScheduleScreen from './src/screens/main/ScheduleScreen';
import DailyReportScreen from './src/screens/main/DailyReportScreen';
import TargetNetsScreen from './src/screens/main/TargetNetsScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true); // Tema State'i

  // ALT MENÜ (BOTTOM TABS) MİMARİSİ
  function MainTabs() {
    const theme = isDarkMode ? darkTheme : lightTheme;

    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Ana Sayfa') iconName = 'dashboard';
            else if (route.name === 'Takvim') iconName = 'event';
            else if (route.name === 'Rapor') iconName = 'bar-chart';
            else if (route.name === 'Profil') iconName = 'person';

            return <MaterialIcons name={iconName} size={size + (focused ? 4 : 0)} color={color} />;
          },
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            height: 65,
            paddingBottom: 10,
            paddingTop: 10,
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold' }
        })}
      >
        <Tab.Screen name="Ana Sayfa">
          {(props) => <DashboardScreen {...props} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}
        </Tab.Screen>
        
        <Tab.Screen name="Takvim">
          {(props) => <ScheduleScreen {...props} isDarkMode={isDarkMode} />}
        </Tab.Screen>
        
        <Tab.Screen name="Rapor">
          {(props) => <DailyReportScreen {...props} isDarkMode={isDarkMode} />}
        </Tab.Screen>
        
        <Tab.Screen name="Profil">
          {(props) => <ProfileScreen {...props} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}
        </Tab.Screen>
      </Tab.Navigator>
    );
  }

  // ANA YÖNLENDİRİCİ (STACK)
  return (
    <NavigationContainer>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        
        {/* Auth Ekranları */}
        <Stack.Screen name="Login">
  {(props) => <LoginScreen {...props} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />}
</Stack.Screen>

<Stack.Screen name="Register">
  {(props) => <RegisterScreen {...props} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />}
</Stack.Screen>
        
        {/* Alt Menülü Ana Uygulama */}
        <Stack.Screen name="MainApp" component={MainTabs} />

        {/* Alt Menü Olmadan Açılacak İç Ekranlar */}
        <Stack.Screen name="ExamAnalysis">
          {(props) => <ExamAnalysisScreen {...props} isDarkMode={isDarkMode} />}
        </Stack.Screen>
        <Stack.Screen name="AIChat">
          {(props) => <AIChatScreen {...props} isDarkMode={isDarkMode} />}
        </Stack.Screen>
        <Stack.Screen name="Summarize">
          {(props) => <SummarizeScreen {...props} isDarkMode={isDarkMode} />}
        </Stack.Screen>
        <Stack.Screen name="QuizGenerate">
          {(props) => <QuizGenerateScreen {...props} isDarkMode={isDarkMode} />}
        </Stack.Screen>
        <Stack.Screen name="TargetNets">
          {(props) => <TargetNetsScreen {...props} isDarkMode={isDarkMode} />}
        </Stack.Screen>

      </Stack.Navigator>
    </NavigationContainer>
  );
}