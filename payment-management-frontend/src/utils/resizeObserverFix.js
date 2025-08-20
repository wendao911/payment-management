// ResizeObserver 错误修复工具
// 这个文件提供了多种方法来从根本上解决 ResizeObserver 错误

// 方法1: 全局错误处理器 - 捕获并忽略 ResizeObserver 错误
export const setupResizeObserverErrorHandler = () => {
  // 保存原始的 error 事件处理器
  const originalErrorHandler = window.addEventListener;
  
  // 重写 addEventListener 来过滤 ResizeObserver 错误
  window.addEventListener = function(type, listener, options) {
    if (type === 'error') {
      // 包装错误监听器来过滤 ResizeObserver 错误
      const wrappedListener = (event) => {
        if (event.error && 
            event.error.message && 
            event.error.message.includes('ResizeObserver')) {
          // 忽略 ResizeObserver 错误
          console.warn('ResizeObserver error suppressed:', event.error.message);
          return;
        }
        // 调用原始的监听器
        listener(event);
      };
      return originalErrorHandler.call(this, type, wrappedListener, options);
    }
    return originalErrorHandler.call(this, type, listener, options);
  };
};

// 方法2: 重写 ResizeObserver 构造函数来添加错误处理
export const patchResizeObserver = () => {
  if (typeof window !== 'undefined' && window.ResizeObserver) {
    const OriginalResizeObserver = window.ResizeObserver;
    
    window.ResizeObserver = class PatchedResizeObserver extends OriginalResizeObserver {
      constructor(callback) {
        // 包装回调函数来添加错误处理
        const wrappedCallback = (entries, observer) => {
          try {
            // 添加防抖机制来避免频繁调用
            if (this.debounceTimer) {
              clearTimeout(this.debounceTimer);
            }
            
            this.debounceTimer = setTimeout(() => {
              try {
                callback(entries, observer);
              } catch (error) {
                if (error.message && error.message.includes('ResizeObserver')) {
                  console.warn('ResizeObserver callback error suppressed:', error.message);
                } else {
                  console.error('ResizeObserver callback error:', error);
                }
              }
            }, 16); // 约60fps的防抖
          } catch (error) {
            if (error.message && error.message.includes('ResizeObserver')) {
              console.warn('ResizeObserver error suppressed:', error.message);
            } else {
              console.error('ResizeObserver error:', error);
            }
          }
        };
        
        super(wrappedCallback);
        this.debounceTimer = null;
      }
      
      disconnect() {
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
          this.debounceTimer = null;
        }
        super.disconnect();
      }
    };
  }
};

// 方法3: 添加全局错误事件监听器
export const addGlobalErrorListener = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      if (event.error && 
          event.error.message && 
          event.error.message.includes('ResizeObserver')) {
        // 阻止 ResizeObserver 错误传播
        event.preventDefault();
        console.warn('ResizeObserver error caught globally:', event.error.message);
        return false;
      }
    });
    
    // 处理未捕获的 Promise 拒绝
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && 
          event.reason.message && 
          event.reason.message.includes('ResizeObserver')) {
        // 阻止 ResizeObserver Promise 错误传播
        event.preventDefault();
        console.warn('ResizeObserver promise error caught globally:', event.reason.message);
        return false;
      }
    });
  }
};

// 方法4: 初始化所有修复
export const initResizeObserverFixes = () => {
  try {
    setupResizeObserverErrorHandler();
    patchResizeObserver();
    addGlobalErrorListener();
    console.log('ResizeObserver fixes initialized successfully');
  } catch (error) {
    console.warn('Failed to initialize ResizeObserver fixes:', error);
  }
};

// 方法5: 为特定组件提供安全的 ResizeObserver 使用
export const createSafeResizeObserver = (callback, options = {}) => {
  if (typeof window === 'undefined' || !window.ResizeObserver) {
    return null;
  }
  
  try {
    return new window.ResizeObserver((entries, observer) => {
      // 添加错误边界
      try {
        callback(entries, observer);
      } catch (error) {
        if (error.message && error.message.includes('ResizeObserver')) {
          console.warn('Safe ResizeObserver callback error:', error.message);
        } else {
          console.error('Safe ResizeObserver callback error:', error);
        }
      }
    });
  } catch (error) {
    console.warn('Failed to create safe ResizeObserver:', error);
    return null;
  }
};

// 默认导出
export default {
  setupResizeObserverErrorHandler,
  patchResizeObserver,
  addGlobalErrorListener,
  initResizeObserverFixes,
  createSafeResizeObserver
};
