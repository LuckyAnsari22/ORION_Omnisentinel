import * as THREE from 'three';

/**
 * Lerp (Linear Interpolation) utility
 */
export const lerp = (start: number, end: number, t: number): number => {
    return start * (1 - t) + end * t;
};

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
};

/**
 * Map a value from one range to another
 */
export const mapRange = (
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
): number => {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

/**
 * Smooth step function for easing
 */
export const smoothstep = (min: number, max: number, value: number): number => {
    const x = clamp((value - min) / (max - min), 0, 1);
    return x * x * (3 - 2 * x);
};

/**
 * Generate random point on sphere surface
 */
export const randomPointOnSphere = (radius: number): THREE.Vector3 => {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    return new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
    );
};

/**
 * Generate random point in sphere volume
 */
export const randomPointInSphere = (radius: number): THREE.Vector3 => {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2 * Math.PI;
    const phi = Math.acos(2 * v - 1);
    const r = Math.cbrt(Math.random()) * radius;

    return new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
    );
};

/**
 * Calculate orbital position
 */
export const getOrbitalPosition = (
    radius: number,
    angle: number,
    height: number = 0
): THREE.Vector3 => {
    return new THREE.Vector3(
        radius * Math.cos(angle),
        height,
        radius * Math.sin(angle)
    );
};

/**
 * Debounce function for performance
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

/**
 * Check if WebGL is available
 */
export const isWebGLAvailable = (): boolean => {
    try {
        const canvas = document.createElement('canvas');
        return !!(
            window.WebGLRenderingContext &&
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        );
    } catch (e) {
        return false;
    }
};

/**
 * Get device performance tier
 */
export const getPerformanceTier = (): 'low' | 'medium' | 'high' => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) return 'low';

    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'medium';

    const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

    // Simple heuristic based on renderer string
    if (renderer.includes('Intel')) return 'medium';
    if (renderer.includes('NVIDIA') || renderer.includes('AMD')) return 'high';

    return 'medium';
};
