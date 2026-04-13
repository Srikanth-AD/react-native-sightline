import React, { createContext, useContext, useRef } from 'react';

export const RenderCountContext = createContext<React.MutableRefObject<number> | null>(null);

/**
 * Track re-renders in a component. Add this hook to any component
 * you want to include in the re-render count metric.
 *
 * The hook increments a ref — it never causes a re-render in your component.
 */
export function useTrackRenders(_componentName?: string): void {
  const renderCountRef = useContext(RenderCountContext);
  if (renderCountRef) {
    renderCountRef.current++;
  }
}

export function useRenderCountRef(): React.MutableRefObject<number> {
  return useRef(0);
}
