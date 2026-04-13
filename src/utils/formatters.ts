export const formatFps = (fps: number): string => `${Math.round(fps)} fps`;

export const formatMemory = (mb: number): string => `${mb.toFixed(1)} mb`;

export const formatRerenders = (n: number): string => `${Math.round(n)}/s`;

export const formatNetwork = (n: number): string => `${Math.round(n)} req`;

export const formatNative = (n: number): string => `${Math.round(n)}/s`;
