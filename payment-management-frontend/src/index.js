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

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
