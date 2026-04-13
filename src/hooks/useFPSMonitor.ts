import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useSightlineStore } from '../store/useSightlineStore';

export function useFPSMonitor(): void {
  const rafIdRef = useRef<number | null>(null);
  const uiAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const updateMetric = useSightlineStore.getState().updateMetric;

    // --- JS Thread FPS ---
    let jsFrameCount = 0;
    let jsLastTimestamp = performance.now();

    const measureJs = (timestamp: number) => {
      jsFrameCount++;
      const elapsed = timestamp - jsLastTimestamp;
      if (elapsed >= 500) {
        const fps = (jsFrameCount / elapsed) * 1000;
        updateMetric('jsFps', Math.min(fps, 60));
        jsFrameCount = 0;
        jsLastTimestamp = timestamp;
      }
      rafIdRef.current = requestAnimationFrame(measureJs);
    };
    rafIdRef.current = requestAnimationFrame(measureJs);

    // --- UI Thread FPS (approximation) ---
    // Uses Animated.loop with useNativeDriver: true.
    // Measures timing drift between expected and actual callbacks
    // to approximate UI thread pressure.
    const uiAnimValue = new Animated.Value(0);
    let uiFrameCount = 0;
    let uiLastTime = performance.now();

    const listenerId = uiAnimValue.addListener(({ value: _value }) => {
      // Each tick of the animation triggers this listener
      // When the UI thread is busy, ticks arrive late
      uiFrameCount++;
      const now = performance.now();
      const elapsed = now - uiLastTime;
      if (elapsed >= 500) {
        // Scale to approximate 60fps equivalent
        const fps = (uiFrameCount / elapsed) * 1000;
        // Clamp to reasonable range
        updateMetric('uiFps', Math.min(fps, 60));
        uiFrameCount = 0;
        uiLastTime = now;
      }
    });

    uiAnimRef.current = Animated.loop(
      Animated.timing(uiAnimValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    uiAnimRef.current.start();

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      uiAnimValue.removeListener(listenerId);
      if (uiAnimRef.current) {
        uiAnimRef.current.stop();
      }
    };
  }, []);
}
