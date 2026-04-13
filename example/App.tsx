import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
  Pressable,
  type GestureResponderEvent,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { SightlineOverlay, useTrackRenders } from 'react-native-sightline';

// --- Ripple pressable wrapper ---

function RipplePressable({
  onPress,
  style,
  children,
}: {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const [ripplePos, setRipplePos] = useState({ x: 0, y: 0 });

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      const { locationX, locationY } = e.nativeEvent;
      setRipplePos({ x: locationX, y: locationY });
      rippleScale.setValue(0);
      rippleOpacity.setValue(0.25);
      Animated.timing(rippleScale, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    },
    [rippleScale, rippleOpacity],
  );

  const handlePressOut = useCallback(() => {
    Animated.timing(rippleOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [rippleOpacity]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[{ overflow: 'hidden' }, style]}
    >
      {children}
      <Animated.View
        pointerEvents="none"
        style={[
          rippleStyles.circle,
          {
            left: ripplePos.x - 150,
            top: ripplePos.y - 150,
            opacity: rippleOpacity,
            transform: [{ scale: rippleScale }],
          },
        ]}
      />
    </Pressable>
  );
}

const rippleStyles = StyleSheet.create({
  circle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});

type ItemType = 'heavy' | 'network' | 'animated' | 'rerender' | 'normal';

interface ItemData {
  id: string;
  title: string;
  type: ItemType;
  description: string;
  tapLabel: string;
}

// --- Tappable item components ---

function HeavyItem({ title, description, tapLabel }: ItemData) {
  useTrackRenders('HeavyItem');
  const [active, setActive] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handlePress = useCallback(() => {
    setActive(true);
    setResult('computing...');
    // Block JS thread for ~300ms
    const start = Date.now();
    let sum = 0;
    while (Date.now() - start < 300) {
      sum += Math.sqrt(Math.random()) * Math.sin(Math.random());
    }
    setResult(`done in ${Date.now() - start}ms (${sum.toFixed(0)})`);
    setTimeout(() => setActive(false), 2000);
  }, []);

  return (
    <RipplePressable
      onPress={handlePress}
      style={[listStyles.item, listStyles.heavyBorder, active && listStyles.activeItem]}
    >
      <Text style={listStyles.tag}>JS HEAVY</Text>
      <Text style={listStyles.title}>{title}</Text>
      <Text style={listStyles.subtitle}>{description}</Text>
      <View style={listStyles.tapRow}>
        <Text style={listStyles.tapHint}>{tapLabel}</Text>
        {result && <Text style={listStyles.resultText}>{result}</Text>}
      </View>
    </RipplePressable>
  );
}

function NetworkItem({ title, description, tapLabel }: ItemData) {
  useTrackRenders('NetworkItem');
  const [active, setActive] = useState(false);
  const [inFlight, setInFlight] = useState(0);

  const handlePress = useCallback(() => {
    setActive(true);
    const count = 5;
    setInFlight(count);
    for (let i = 0; i < count; i++) {
      fetch(`https://httpbin.org/delay/3?t=${Date.now()}&i=${i}`)
        .catch(() => {})
        .finally(() => setInFlight((c) => c - 1));
    }
    setTimeout(() => setActive(false), 4000);
  }, []);

  return (
    <RipplePressable
      onPress={handlePress}
      style={[listStyles.item, listStyles.networkBorder, active && listStyles.activeItem]}
    >
      <Text style={[listStyles.tag, { color: '#007aff' }]}>NETWORK</Text>
      <Text style={listStyles.title}>{title}</Text>
      <Text style={listStyles.subtitle}>{description}</Text>
      <View style={listStyles.tapRow}>
        <Text style={listStyles.tapHint}>{tapLabel}</Text>
        {inFlight > 0 && (
          <Text style={[listStyles.resultText, { color: '#007aff' }]}>
            {inFlight} in flight...
          </Text>
        )}
      </View>
    </RipplePressable>
  );
}

function AnimatedItem({ title, description, tapLabel }: ItemData) {
  useTrackRenders('AnimatedItem');
  const [active, setActive] = useState(false);
  const spin = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  const handlePress = useCallback(() => {
    setActive(true);
    // Start spinning + pulsing animation
    loopRef.current = Animated.loop(
      Animated.parallel([
        Animated.timing(spin, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.5,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    loopRef.current.start();
    setTimeout(() => {
      loopRef.current?.stop();
      spin.setValue(0);
      scale.setValue(1);
      setActive(false);
    }, 5000);
  }, [spin, scale]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <RipplePressable
      onPress={handlePress}
      style={[listStyles.item, listStyles.animBorder, active && listStyles.activeItem]}
    >
      <View style={listStyles.animRow}>
        <View style={listStyles.animText}>
          <Text style={[listStyles.tag, { color: '#ffcc00' }]}>ANIMATION</Text>
          <Text style={listStyles.title}>{title}</Text>
          <Text style={listStyles.subtitle}>{description}</Text>
          <Text style={listStyles.tapHint}>{tapLabel}</Text>
        </View>
        <Animated.View
          style={[
            listStyles.spinner,
            active && { transform: [{ rotate }, { scale }] },
          ]}
        />
      </View>
    </RipplePressable>
  );
}

function RerenderItem({ title, description, tapLabel }: ItemData) {
  useTrackRenders('RerenderItem');
  const [active, setActive] = useState(false);
  const [count, setCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handlePress = useCallback(() => {
    if (active) return;
    setActive(true);
    setCount(0);
    // Rapid state updates for 3 seconds
    intervalRef.current = setInterval(() => {
      setCount((c) => c + 1);
    }, 50);
    setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setActive(false);
    }, 3000);
  }, [active]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <RipplePressable
      onPress={handlePress}
      style={[listStyles.item, listStyles.rerenderBorder, active && listStyles.activeItem]}
    >
      <Text style={[listStyles.tag, { color: '#af52de' }]}>RE-RENDERS</Text>
      <Text style={listStyles.title}>{title}</Text>
      <Text style={listStyles.subtitle}>{description}</Text>
      <View style={listStyles.tapRow}>
        <Text style={listStyles.tapHint}>{tapLabel}</Text>
        {active && (
          <Text style={[listStyles.resultText, { color: '#af52de' }]}>
            #{count} updates
          </Text>
        )}
      </View>
    </RipplePressable>
  );
}

function NormalItem({ title, description }: ItemData) {
  useTrackRenders('NormalItem');

  return (
    <View style={listStyles.item}>
      <Text style={listStyles.title}>{title}</Text>
      <Text style={listStyles.subtitle}>{description}</Text>
    </View>
  );
}

// --- Data ---

const ITEMS: ItemData[] = [
  {
    id: '0',
    type: 'heavy',
    title: 'Sort 100k Records',
    description: 'Blocks JS thread with heavy computation',
    tapLabel: 'Tap to freeze JS thread',
  },
  {
    id: '1',
    type: 'normal',
    title: 'User Profile',
    description: 'Simple component, no performance impact',
    tapLabel: '',
  },
  {
    id: '2',
    type: 'network',
    title: 'Fetch Dashboard Data',
    description: 'Fires 5 concurrent API requests',
    tapLabel: 'Tap to fire requests',
  },
  {
    id: '3',
    type: 'normal',
    title: 'Settings',
    description: 'Lightweight static content',
    tapLabel: '',
  },
  {
    id: '4',
    type: 'animated',
    title: 'Loading Spinner',
    description: 'Continuous spin + pulse animation',
    tapLabel: 'Tap to start animation',
  },
  {
    id: '5',
    type: 'normal',
    title: 'Notifications',
    description: 'Simple list cell',
    tapLabel: '',
  },
  {
    id: '6',
    type: 'rerender',
    title: 'Live Price Ticker',
    description: 'Rapid state updates every 50ms',
    tapLabel: 'Tap to start updating',
  },
  {
    id: '7',
    type: 'normal',
    title: 'About',
    description: 'Static informational content',
    tapLabel: '',
  },
  {
    id: '8',
    type: 'heavy',
    title: 'Parse JSON Payload',
    description: 'Expensive synchronous operation',
    tapLabel: 'Tap to block JS thread',
  },
  {
    id: '9',
    type: 'network',
    title: 'Sync Offline Queue',
    description: 'Fires batch of network requests',
    tapLabel: 'Tap to fire requests',
  },
  {
    id: '10',
    type: 'normal',
    title: 'Help Center',
    description: 'No performance impact',
    tapLabel: '',
  },
  {
    id: '11',
    type: 'animated',
    title: 'Progress Indicator',
    description: 'Animated spinner with scaling',
    tapLabel: 'Tap to animate',
  },
  {
    id: '12',
    type: 'rerender',
    title: 'Chat Messages',
    description: 'Simulates rapid incoming messages',
    tapLabel: 'Tap to simulate updates',
  },
  {
    id: '13',
    type: 'normal',
    title: 'Privacy Policy',
    description: 'Static text content',
    tapLabel: '',
  },
  {
    id: '14',
    type: 'heavy',
    title: 'Image Processing',
    description: 'Heavy math on the JS thread',
    tapLabel: 'Tap to process',
  },
  {
    id: '15',
    type: 'network',
    title: 'Upload Analytics',
    description: 'Multiple concurrent uploads',
    tapLabel: 'Tap to upload',
  },
];

function ListItemRenderer({ item }: { item: ItemData }) {
  switch (item.type) {
    case 'heavy':
      return <HeavyItem {...item} />;
    case 'network':
      return <NetworkItem {...item} />;
    case 'animated':
      return <AnimatedItem {...item} />;
    case 'rerender':
      return <RerenderItem {...item} />;
    default:
      return <NormalItem {...item} />;
  }
}

export default function App() {
  return (
    <SightlineOverlay>
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Sightline Demo</Text>
        <Text style={styles.subheader}>Tap items to trigger performance spikes</Text>

        <View style={styles.legend}>
          <LegendDot color="#ff3b30" label="JS heavy" />
          <LegendDot color="#007aff" label="Network" />
          <LegendDot color="#ffcc00" label="Animation" />
          <LegendDot color="#af52de" label="Re-renders" />
        </View>

        <FlatList
          data={ITEMS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ListItemRenderer item={item} />}
          style={styles.list}
        />
      </SafeAreaView>
    </SightlineOverlay>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 16,
  },
  subheader: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  list: { flex: 1 },
});

const listStyles = StyleSheet.create({
  item: {
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
  },
  activeItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heavyBorder: { borderLeftColor: '#ff3b30', borderLeftWidth: 3 },
  networkBorder: { borderLeftColor: '#007aff', borderLeftWidth: 3 },
  animBorder: { borderLeftColor: '#ffcc00', borderLeftWidth: 3 },
  rerenderBorder: { borderLeftColor: '#af52de', borderLeftWidth: 3 },
  tag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ff3b30',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: { color: 'white', fontSize: 15, fontWeight: '600' },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  tapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  tapHint: { color: 'rgba(255,255,255,0.25)', fontSize: 11, fontStyle: 'italic' },
  resultText: { color: '#ff3b30', fontSize: 11, fontFamily: 'monospace' },
  animRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  animText: { flex: 1 },
  spinner: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#ffcc00',
    marginLeft: 12,
  },
});
