import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useSightlineStore } from './store/useSightlineStore';
import { RenderCountContext, useRenderCountRef } from './hooks/useRenderCounter';
import { useFPSMonitor } from './hooks/useFPSMonitor';
import { useMemoryMonitor } from './hooks/useMemoryMonitor';
import { useNetworkMonitor } from './hooks/useNetworkMonitor';
import { Pill } from './components/Pill';
import { Panel } from './components/Panel';
import type { ThresholdConfig, TraceData } from './utils/thresholds';

declare const __DEV__: boolean;

export interface SightlineOverlayProps {
  children: React.ReactNode;
  enabled?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  defaultExpanded?: boolean;
  thresholds?: Partial<ThresholdConfig>;
  opacity?: number;
  onExport?: (trace: TraceData) => void;
}

const POSITION_STYLES = {
  'top-right': { top: 50, right: 16 },
  'top-left': { top: 50, left: 16 },
  'bottom-right': { bottom: 50, right: 16 },
  'bottom-left': { bottom: 50, left: 16 },
} as const;

export function SightlineOverlay({
  children,
  enabled,
  position = 'top-right',
  defaultExpanded = false,
  thresholds,
  opacity = 0.92,
  onExport,
}: SightlineOverlayProps): React.ReactElement {
  // Production check FIRST — before any hooks
  const isEnabled = enabled ?? (typeof __DEV__ !== 'undefined' && __DEV__);
  if (!isEnabled) {
    return <>{children}</>;
  }

  return (
    <SightlineOverlayInner
      position={position}
      defaultExpanded={defaultExpanded}
      thresholds={thresholds}
      opacity={opacity}
      onExport={onExport}
    >
      {children}
    </SightlineOverlayInner>
  );
}

function SightlineOverlayInner({
  children,
  position,
  defaultExpanded,
  thresholds,
  opacity: _opacity,
  onExport,
}: Required<Pick<SightlineOverlayProps, 'position' | 'defaultExpanded' | 'opacity'>> &
  Pick<SightlineOverlayProps, 'children' | 'thresholds' | 'onExport'>): React.ReactElement {
  const renderCountRef = useRenderCountRef();
  const isExpanded = useSightlineStore((s) => s.isExpanded);
  const animValue = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

  // Apply custom thresholds on mount only
  useEffect(() => {
    if (thresholds) {
      useSightlineStore.getState().setThresholds(thresholds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set default expanded state on mount only
  useEffect(() => {
    if (defaultExpanded) {
      useSightlineStore.getState().toggleExpanded();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start all monitors
  useFPSMonitor();
  useMemoryMonitor();
  useNetworkMonitor();

  // Poll render count ref every 500ms and update store
  useEffect(() => {
    const interval = setInterval(() => {
      const count = renderCountRef.current;
      const rate = count * 2; // count per 500ms -> per second
      renderCountRef.current = 0;
      useSightlineStore.getState().updateMetric('rerendersPerSec', rate);
    }, 500);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animate panel open/close
  useEffect(() => {
    Animated.timing(animValue, {
      toValue: isExpanded ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const positionStyle = POSITION_STYLES[position];

  return (
    <RenderCountContext.Provider value={renderCountRef}>
      <View style={styles.root} pointerEvents="box-none">
        {children}
        <View style={styles.overlayFullScreen} pointerEvents="box-none">
          {isExpanded ? (
            <Animated.View style={[styles.panelPosition, positionStyle, { opacity: animValue }]}>
              <Panel onExport={onExport} />
            </Animated.View>
          ) : (
            <Animated.View
              style={[
                styles.pillPosition,
                positionStyle,
                { opacity: Animated.subtract(1, animValue) },
              ]}
            >
              <Pill />
            </Animated.View>
          )}
        </View>
      </View>
    </RenderCountContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlayFullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
  },
  pillPosition: {
    position: 'absolute',
  },
  panelPosition: {
    position: 'absolute',
  },
});
