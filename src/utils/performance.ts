/**
 * Performance Optimization Utilities
 *
 * This file contains utilities for optimizing React application performance:
 * - Debouncing for user input
 * - Throttling for frequent operations
 * - Memoization helpers
 */

/**
 * Debounce function - delays execution until after wait milliseconds have elapsed
 * since the last time it was invoked.
 *
 * Useful for: search inputs, resize handlers, autocomplete
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - ensures function is called at most once per wait period
 *
 * Useful for: scroll handlers, window resize, API calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let previous = 0;

  return function executedFunction(...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func(...args);
    } else if (timeout === null) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func(...args);
      }, remaining);
    }
  };
}

/**
 * Shallow comparison for objects - used in React.memo
 */
export function shallowEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (
    typeof obj1 !== 'object' ||
    obj1 === null ||
    typeof obj2 !== 'object' ||
    obj2 === null
  ) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key) || obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Measure component render time (development only)
 */
export function measureRender(
  componentName: string,
  renderFn: () => void
): void {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    const duration = end - start;

    if (duration > 16) {
      // More than one frame (60fps)
      console.warn(
        `[Performance] ${componentName} took ${duration.toFixed(2)}ms to render`
      );
    }
  } else {
    renderFn();
  }
}

/**
 * Lazy load a component with optional delay (for testing loading states)
 */
export function lazyWithDelay<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  delay = 0
): React.LazyExoticComponent<T> {
  return React.lazy(() => {
    return new Promise((resolve) => {
      setTimeout(() => {
        importFunc().then(resolve);
      }, delay);
    });
  });
}

// React import for lazy loading
import React from 'react';
