import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 如果是 ResizeObserver 错误，忽略它
    if (error.message && error.message.includes('ResizeObserver')) {
      console.warn('ResizeObserver error caught and ignored:', error.message);
      return;
    }
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // 如果是 ResizeObserver 错误，不显示错误UI
      if (this.state.error && this.state.error.message && 
          this.state.error.message.includes('ResizeObserver')) {
        return this.props.children;
      }
      
      // 自定义降级后的 UI
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

export default ErrorBoundary;
