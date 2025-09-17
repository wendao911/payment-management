import { useEffect, useRef, useCallback } from 'react';

/**
 * 自定义 Hook：修复 ResizeObserver 错误
 * 这个 Hook 提供了多种方法来防止 ResizeObserver 错误
 */
export const useResizeObserverFix = (options = {}) => {
  const {
    enabled = true,
    debounceMs = 16,
    suppressErrors = true,
    onResize = null
  } = options;

  const containerRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // 清理函数
  const cleanup = useCallback(() => {
    try {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    } catch (error) {
      console.warn('Failed to cleanup ResizeObserver:', error);
    }
  }, []);

  // 创建安全的 ResizeObserver
  const createSafeResizeObserver = useCallback((callback) => {
    if (typeof window === 'undefined' || !window.ResizeObserver) {
      return null;
    }

    try {
      return new window.ResizeObserver((entries, observer) => {
        try {
          // 防抖机制
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }

          debounceTimerRef.current = setTimeout(() => {
            try {
              if (callback) {
                callback(entries, observer);
              }
            } catch (error) {
              if (suppressErrors && error.message && error.message.includes('ResizeObserver')) {
                console.warn('ResizeObserver callback error suppressed:', error.message);
                return;
              }
              throw error;
            }
          }, debounceMs);
        } catch (error) {
          if (suppressErrors && error.message && error.message.includes('ResizeObserver')) {
            console.warn('ResizeObserver error suppressed:', error.message);
            return;
          }
          throw error;
        }
      });
    } catch (error) {
      console.warn('Failed to create safe ResizeObserver:', error);
      return null;
    }
  }, [debounceMs, suppressErrors]);

  // 观察元素大小变化
  const observe = useCallback((element) => {
    if (!enabled || !element || !resizeObserverRef.current) {
      return;
    }

    try {
      resizeObserverRef.current.observe(element);
    } catch (error) {
      if (suppressErrors && error.message && error.message.includes('ResizeObserver')) {
        console.warn('Failed to observe element (suppressed):', error.message);
      } else {
        console.error('Failed to observe element:', error);
      }
    }
  }, [enabled, suppressErrors]);

  // 停止观察
  const unobserve = useCallback((element) => {
    if (!resizeObserverRef.current || !element) {
      return;
    }

    try {
      resizeObserverRef.current.unobserve(element);
    } catch (error) {
      if (suppressErrors && error.message && error.message.includes('ResizeObserver')) {
        console.warn('Failed to unobserve element (suppressed):', error.message);
      } else {
        console.error('Failed to unobserve element:', error);
      }
    }
  }, [suppressErrors]);

  // 初始化
  useEffect(() => {
    if (!enabled) {
      return;
    }

    try {
      // 创建安全的 ResizeObserver
      resizeObserverRef.current = createSafeResizeObserver((entries) => {
        if (onResize) {
          onResize(entries);
        }
      });

      // 如果容器引用存在，开始观察
      if (containerRef.current) {
        observe(containerRef.current);
      }
    } catch (error) {
      if (suppressErrors && error.message && error.message.includes('ResizeObserver')) {
        console.warn('Failed to initialize ResizeObserver (suppressed):', error.message);
      } else {
        console.error('Failed to initialize ResizeObserver:', error);
      }
    }

    // 清理函数
    return cleanup;
  }, [enabled, createSafeResizeObserver, observe, onResize, cleanup]);

  // 当容器引用变化时，重新开始观察
  useEffect(() => {
    if (!enabled || !resizeObserverRef.current) {
      return;
    }

    if (containerRef.current) {
      observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        unobserve(containerRef.current);
      }
    };
  }, [enabled, observe, unobserve]);

  // 返回容器引用和观察方法
  return {
    containerRef,
    observe,
    unobserve,
    cleanup
  };
};

export default useResizeObserverFix;
