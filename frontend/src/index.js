import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { setupGlobalErrorHandler } from './utils/errorHandler';
import { initializeResizeObserverFix } from './utils/resizeObserverConfig';

// 初始化错误处理器
setupGlobalErrorHandler();

// 初始化 ResizeObserver 修复系统
initializeResizeObserverFix();

// 开发环境：抑制 CRA 错误覆盖层对 ResizeObserver 的拦截
if (process.env.NODE_ENV === 'development') {
  try {
    const overlayHook = window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__;
    if (overlayHook) {
      const originalUnhandledError = overlayHook.onUnhandledError;
      overlayHook.onUnhandledError = (error) => {
        const message = (error && (error.message || String(error))) || '';
        if (typeof message === 'string' && message.includes('ResizeObserver')) {
          // 忽略，避免弹出覆盖层
          return;
        }
        if (typeof originalUnhandledError === 'function') {
          originalUnhandledError(error);
        }
      };

      const originalUnhandledRejection = overlayHook.onUnhandledRejection;
      overlayHook.onUnhandledRejection = (rejection) => {
        const reason = rejection && (rejection.reason || rejection);
        const message = (reason && (reason.message || String(reason))) || '';
        if (typeof message === 'string' && message.includes('ResizeObserver')) {
          return;
        }
        if (typeof originalUnhandledRejection === 'function') {
          originalUnhandledRejection(rejection);
        }
      };
    }
  } catch (e) {
    // 忽略
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
