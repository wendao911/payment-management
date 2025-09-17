import React, { useEffect, useRef } from 'react';

/**
 * ResizeObserver 错误修复组件
 * 这个组件通过多种方式来防止 ResizeObserver 错误
 */
const ResizeObserverFix = ({ children }) => {
  const containerRef = useRef(null);
  const resizeObserverRef = useRef(null);

  useEffect(() => {
    // 在组件挂载时设置 ResizeObserver 错误处理
    const setupComponentLevelFix = () => {
      try {
        // 方法1: 重写 ResizeObserver 构造函数（如果还没有被重写）
        if (typeof window !== 'undefined' && window.ResizeObserver && 
            !window.ResizeObserver._patched) {
          const OriginalResizeObserver = window.ResizeObserver;
          
          window.ResizeObserver = function(callback) {
            let debounceTimer = null;
            
            const wrappedCallback = (...args) => {
              try {
                // 防抖机制
                if (debounceTimer) {
                  clearTimeout(debounceTimer);
                }
                
                debounceTimer = setTimeout(() => {
                  try {
                    callback(...args);
                  } catch (error) {
                    if (error.message && error.message.includes('ResizeObserver')) {
                      console.warn('Component-level ResizeObserver error suppressed:', error.message);
                      return;
                    }
                    throw error;
                  }
                }, 16);
              } catch (error) {
                if (error.message && error.message.includes('ResizeObserver')) {
                  console.warn('Component-level ResizeObserver error suppressed:', error.message);
                  return;
                }
                throw error;
              }
            };
            
            const observer = new OriginalResizeObserver(wrappedCallback);
            
            // 重写 disconnect 方法
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
          window.ResizeObserver._patched = true;
        }
        
        // 方法2: 为当前组件创建安全的 ResizeObserver
        if (containerRef.current && window.ResizeObserver) {
          resizeObserverRef.current = new window.ResizeObserver((entries) => {
            try {
              // 这里可以添加组件特定的 resize 处理逻辑
              entries.forEach(entry => {
                // 安全地处理 resize 事件
                if (entry.target && entry.contentRect) {
                  // 可以在这里添加自定义的 resize 处理逻辑
                }
              });
            } catch (error) {
              if (error.message && error.message.includes('ResizeObserver')) {
                console.warn('Component ResizeObserver error suppressed:', error.message);
              } else {
                console.error('Component ResizeObserver error:', error);
              }
            }
          });
          
          // 观察容器元素
          resizeObserverRef.current.observe(containerRef.current);
        }
        
      } catch (error) {
        console.warn('Failed to setup component-level ResizeObserver fix:', error);
      }
    };

    setupComponentLevelFix();

    // 清理函数
    return () => {
      try {
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect();
          resizeObserverRef.current = null;
        }
      } catch (error) {
        console.warn('Failed to cleanup ResizeObserver:', error);
      }
    };
  }, []);

  // 方法3: 添加错误边界
  const handleError = (error) => {
    if (error.message && error.message.includes('ResizeObserver')) {
      console.warn('ResizeObserver error caught by component:', error.message);
      return true; // 阻止错误传播
    }
    return false;
  };

  // 方法4: 使用 try-catch 包装渲染
  try {
    return (
      <div 
        ref={containerRef}
        onError={handleError}
        style={{ width: '100%', height: '100%' }}
      >
        {children}
      </div>
    );
  } catch (error) {
    if (error.message && error.message.includes('ResizeObserver')) {
      console.warn('ResizeObserver render error suppressed:', error.message);
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>组件加载中...</p>
        </div>
      );
    }
    throw error;
  }
};

export default ResizeObserverFix;
