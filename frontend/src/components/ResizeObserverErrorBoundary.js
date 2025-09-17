import React from 'react';

class ResizeObserverErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // 如果是 ResizeObserver 错误，不更新状态
    if (error.message && error.message.includes('ResizeObserver')) {
      return { hasError: false };
    }
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 如果是 ResizeObserver 错误，忽略它
    if (error.message && error.message.includes('ResizeObserver')) {
      console.warn('ResizeObserver error caught and ignored:', error.message);
      return;
    }
    
    // 记录其他错误
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          color: '#666'
        }}>
          <h2>页面出现了一些问题</h2>
          <p>请刷新页面重试，如果问题持续存在，请联系技术支持。</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ResizeObserverErrorBoundary;
