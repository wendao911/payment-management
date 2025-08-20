/**
 * 全局 ResizeObserver 错误修复配置
 * 这个文件在应用启动时被加载，为整个应用提供 ResizeObserver 错误保护
 */

// 全局错误处理函数
const handleResizeObserverError = (error) => {
  // 检查是否是 ResizeObserver 相关错误
  if (error.message && error.message.includes('ResizeObserver')) {
    console.warn('🔧 ResizeObserver error suppressed:', error.message);
    return true; // 阻止错误传播
  }
  return false; // 允许其他错误正常传播
};

// 重写 ResizeObserver 构造函数
const patchResizeObserver = () => {
  if (typeof window === 'undefined') return;
  
  // 如果已经被修补过，直接返回
  if (window.ResizeObserver && window.ResizeObserver._patched) {
    return;
  }
  
  try {
    const OriginalResizeObserver = window.ResizeObserver;
    
    window.ResizeObserver = function(callback) {
      let debounceTimer = null;
      let isDisconnected = false;
      
      const wrappedCallback = (...args) => {
        try {
          // 如果已经被断开连接，忽略回调
          if (isDisconnected) return;
          
          // 防抖机制，避免频繁触发
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }
          
          debounceTimer = setTimeout(() => {
            try {
              if (!isDisconnected && callback) {
                callback(...args);
              }
            } catch (error) {
              if (handleResizeObserverError(error)) {
                return; // 错误已被处理
              }
              throw error; // 重新抛出其他错误
            }
          }, 16); // 16ms 防抖
        } catch (error) {
          if (handleResizeObserverError(error)) {
            return; // 错误已被处理
          }
          throw error; // 重新抛出其他错误
        }
      };
      
      const observer = new OriginalResizeObserver(wrappedCallback);
      
      // 重写 disconnect 方法
      const originalDisconnect = observer.disconnect;
      observer.disconnect = function() {
        isDisconnected = true;
        if (debounceTimer) {
          clearTimeout(debounceTimer);
          debounceTimer = null;
        }
        originalDisconnect.call(this);
      };
      
      // 重写 unobserve 方法
      const originalUnobserve = observer.unobserve;
      observer.unobserve = function(target) {
        try {
          originalUnobserve.call(this, target);
        } catch (error) {
          if (handleResizeObserverError(error)) {
            return; // 错误已被处理
          }
          throw error; // 重新抛出其他错误
        }
      };
      
      return observer;
    };
    
    // 保持原型链
    window.ResizeObserver.prototype = OriginalResizeObserver.prototype;
    window.ResizeObserver._patched = true;
    
    console.log('🔧 Global ResizeObserver patch applied successfully');
  } catch (error) {
    console.warn('Failed to patch ResizeObserver:', error);
  }
};

// 全局错误事件监听器
const setupGlobalErrorHandling = () => {
  if (typeof window === 'undefined') return;
  
  // 监听全局错误
  window.addEventListener('error', (event) => {
    if (handleResizeObserverError(event.error)) {
      event.preventDefault();
      return false;
    }
  });
  
  // 监听未处理的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && handleResizeObserverError(event.reason)) {
      event.preventDefault();
      return false;
    }
  });
  
  console.log('🔧 Global error handling setup completed');
};

// 初始化函数
export const initializeResizeObserverFix = () => {
  try {
    // 应用 ResizeObserver 补丁
    patchResizeObserver();
    
    // 设置全局错误处理
    setupGlobalErrorHandling();
    
    // 设置全局状态标记
    if (typeof window !== 'undefined') {
      window.__resizeObserverState = {
        patched: true,
        timestamp: Date.now(),
        version: '1.0.0'
      };
    }
    
    console.log('🔧 ResizeObserver fix initialization completed');
  } catch (error) {
    console.warn('Failed to initialize ResizeObserver fix:', error);
  }
};

// 检查修复状态
export const checkResizeObserverFixStatus = () => {
  if (typeof window === 'undefined') {
    return { available: false, patched: false };
  }
  
  return {
    available: !!window.ResizeObserver,
    patched: !!(window.ResizeObserver && window.ResizeObserver._patched),
    globalState: window.__resizeObserverState || null
  };
};

// 导出默认配置
export default {
  initialize: initializeResizeObserverFix,
  checkStatus: checkResizeObserverFixStatus,
  handleError: handleResizeObserverError
};
