import {
  NavigationContainer,
  type RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import {StatusBar} from 'expo-status-bar';
import {useCallback, useEffect, useRef} from 'react';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {
  AccessibilityInfo,
  findNodeHandle,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type FocusMethod = 'legacy-tag' | 'renderer-ref';

type RootStackParamList = {
  Home: undefined;
  FocusDemo: {method: FocusMethod};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();

  const openDemo = useCallback(
    (method: FocusMethod) => {
      navigation.navigate('FocusDemo', {method});
    },
    [navigation],
  );

  return (
    <Screen>
      <Text accessibilityRole="header" style={styles.screenTitle}>
        Initial accessibility focus repro
      </Text>
      <Text style={styles.description}>
        Enable VoiceOver before opening the demo. Compare the deprecated tag API with the
        renderer-aware ref API.
      </Text>
      <DemoButton label="Open with legacy tag focus" onPress={() => openDemo('legacy-tag')} />
      <DemoButton label="Open with renderer ref focus" onPress={() => openDemo('renderer-ref')} />
    </Screen>
  );
}

function FocusDemoScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'FocusDemo'>>();
  const route = useRoute<RouteProp<RootStackParamList, 'FocusDemo'>>();
  const targetRef = useRef<View>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const animationFrame = requestAnimationFrame(() => {
      timer = setTimeout(() => {
        const target = targetRef.current;
        if (!target) {
          console.warn('[a11y-focus] Target ref was not mounted');
          return;
        }

        console.log(
          `[a11y-focus] Requesting ${route.params.method} focus at ${Math.round(performance.now())}ms`,
        );

        if (route.params.method === 'legacy-tag') {
          const reactTag = findNodeHandle(target);
          if (reactTag !== null) {
            AccessibilityInfo.setAccessibilityFocus(reactTag);
          }
          return;
        }

        AccessibilityInfo.sendAccessibilityEvent(target, 'focus');
      }, 50);
    });

    return () => {
      cancelAnimationFrame(animationFrame);
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    };
  }, [route.params.method]);

  return (
    <Screen>
      <View accessibilityLabel="Page header" style={styles.header}>
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={styles.headerButton}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>

        <Text
          accessible
          accessibilityRole="header"
          style={styles.headerTitle}>
          Focus demo
        </Text>

        <Pressable
          accessibilityLabel="Home"
          accessibilityRole="button"
          onPress={() => navigation.popToTop()}
          style={styles.headerButton}>
          <Text style={styles.buttonText}>Home</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <View
          ref={targetRef}
          accessible
          accessibilityLabel="Requested body target"
          accessibilityRole="summary"
          style={styles.focusTarget}>
          <Text style={styles.targetTitle}>Requested body target</Text>
          <Text style={styles.targetDescription}>
            VoiceOver should start here without first focusing Back, Title, or Home.
          </Text>
        </View>

        <Pressable
          accessibilityLabel="Next body action"
          accessibilityRole="button"
          onPress={() => undefined}
          style={styles.actionButton}>
          <Text style={styles.buttonText}>Next body action</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function Screen({children}: {children: React.ReactNode}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>{children}</View>
    </SafeAreaView>
  );
}

function DemoButton({label, onPress}: {label: string; onPress: () => void}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.actionButton}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{animation: 'none', headerShown: false}}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="FocusDemo" component={FocusDemoScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  body: {
    flex: 1,
    paddingTop: 32,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  description: {
    color: '#334155',
    fontSize: 17,
    lineHeight: 25,
    marginTop: 16,
  },
  focusTarget: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
    borderRadius: 12,
    borderWidth: 2,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerTitle: {
    color: '#0f172a',
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  safeArea: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  screenTitle: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '700',
  },
  targetDescription: {
    color: '#166534',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 8,
  },
  targetTitle: {
    color: '#14532d',
    fontSize: 22,
    fontWeight: '700',
  },
});
