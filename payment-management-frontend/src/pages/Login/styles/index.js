// 登录表单样式
export const loginFormStyles = `
  .ant-card {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.95);
  }
  
  .ant-form-item {
    margin-bottom: 24px;
  }
  
  .ant-input,
  .ant-input-password {
    border-radius: 8px;
    border: 1px solid #d9d9d9;
    transition: all 0.3s ease;
  }
  
  .ant-input:focus,
  .ant-input-password:focus,
  .ant-input:hover,
  .ant-input-password:hover {
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
  
  .ant-btn-primary {
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    border: none;
    transition: all 0.3s ease;
  }
  
  .ant-btn-primary:hover {
    background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
  }
  
  .ant-btn-primary:active {
    transform: translateY(0);
  }
  
  .ant-typography h2 {
    margin-bottom: 8px;
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .ant-typography .ant-typography-secondary {
    color: #8c8c8c;
    font-size: 14px;
  }
`;
