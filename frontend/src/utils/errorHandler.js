// 全局错误处理器
export const setupGlobalErrorHandler = () => {
  // 捕获未处理的 Promise 拒绝（冒泡阶段）
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message &&
        event.reason.message.includes('ResizeObserver')) {
      console.warn('ResizeObserver error caught and ignored:', event.reason.message);
      event.preventDefault();
      return;
    }
  });

  // 捕获全局错误（冒泡阶段）
  window.addEventListener('error', (event) => {
    const message = (event.error && event.error.message) || event.message || '';
    if (typeof message === 'string' && message.includes('ResizeObserver')) {
      console.warn('ResizeObserver error caught and ignored:', message);
      event.preventDefault();
      return;
    }
  });

  // 关键：在捕获阶段拦截并阻止错误继续传播到 CRA overlay
  window.addEventListener('error', (event) => {
    const message = (event.error && event.error.message) || event.message || '';
    if (typeof message === 'string' && message.includes('ResizeObserver')) {
      try {
        // 阻止后续监听器（包括 React 开发错误覆盖层）接收该事件
        if (event.stopImmediatePropagation) {
          event.stopImmediatePropagation();
        }
        event.preventDefault();
      } catch (_) {}
      return false;
    }
  }, true);

  // 在捕获阶段拦截未处理的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    const message = (event.reason && (event.reason.message || String(event.reason))) || '';
    if (typeof message === 'string' && message.includes('ResizeObserver')) {
      try {
        if (event.stopImmediatePropagation) {
          event.stopImmediatePropagation();
        }
        event.preventDefault();
      } catch (_) {}
      return false;
    }
  }, true);

  // 重写 console.error 来过滤 ResizeObserver 错误
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (args.length > 0 && typeof args[0] === 'string' && 
        args[0].includes('ResizeObserver')) {
      console.warn('ResizeObserver error filtered:', ...args);
      return;
    }
    originalConsoleError.apply(console, args);
  };
};

// 设置 ResizeObserver 错误处理
export const setupResizeObserverErrorHandler = () => {
  // 如果存在 ResizeObserver，重写其构造函数
  if (typeof ResizeObserver !== 'undefined') {
    const OriginalResizeObserver = ResizeObserver;
    
    // 重写 ResizeObserver 构造函数
    window.ResizeObserver = function(callback) {
      // 添加防抖机制来避免频繁调用
      let debounceTimer = null;
      
      const wrappedCallback = (...args) => {
        try {
          // 清除之前的定时器
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }
          
          // 设置新的定时器，约60fps的防抖
          debounceTimer = setTimeout(() => {
            try {
              callback(...args);
            } catch (error) {
              if (error.message && error.message.includes('ResizeObserver')) {
                console.warn('ResizeObserver callback error caught and ignored:', error.message);
                return;
              }
              throw error;
            }
          }, 16);
        } catch (error) {
          if (error.message && error.message.includes('ResizeObserver')) {
            console.warn('ResizeObserver error caught and ignored:', error.message);
            return;
          }
          throw error;
        }
      };
      
      const observer = new OriginalResizeObserver(wrappedCallback);
      
      // 重写 disconnect 方法来清理定时器
      const originalDisconnect = observer.disconnect;
      observer.disconnect = function() {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
          debounceTimer = null;
        }
        originalDisconnect.call(this);
      };
      
      return observer;
    };
    
    // 保持原型链
    window.ResizeObserver.prototype = OriginalResizeObserver.prototype;
    
    // 添加静态方法
    window.ResizeObserver.constructor = OriginalResizeObserver;
  }
  
  // 额外的错误捕获机制
  try {
    // 重写 window.onerror
    const originalOnError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      if (message && typeof message === 'string' && message.includes('ResizeObserver')) {
        console.warn('ResizeObserver error caught by onerror:', message);
        return true; // 阻止错误传播
      }
      if (originalOnError) {
        return originalOnError.call(this, message, source, lineno, colno, error);
      }
      return false;
    };
  } catch (error) {
    console.warn('Failed to override window.onerror:', error);
  }
  
  // 处理 React 开发模式下的错误
  if (process.env.NODE_ENV === 'development') {
    try {
      // 重写 console.warn 来过滤 ResizeObserver 警告
      const originalConsoleWarn = console.warn;
      console.warn = (...args) => {
        if (args.length > 0 && typeof args[0] === 'string' && 
            args[0].includes('ResizeObserver')) {
          // 完全忽略 ResizeObserver 警告
          return;
        }
        originalConsoleWarn.apply(console, args);
      };
    } catch (error) {
      console.warn('Failed to override console.warn:', error);
    }
  }
};
