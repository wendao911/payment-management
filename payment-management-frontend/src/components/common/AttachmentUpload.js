import React, { useState, forwardRef, useImperativeHandle } from 'react';
import {
  Upload,
  Button,
  List,
  message,
  Popconfirm,
  notification
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import dayjs from '../../utils/dayjs';
import { apiClient, getBackendURL } from '../../utils/api';

const AttachmentUpload = forwardRef(({
  relatedTable,
  relatedId,
  attachments = [],
  onAttachmentsChange,
  maxFileSize = 10, // MB
  multiple = true,
  disabled = false,
  style = {},
  className = '',
  showDelete = true,
  showDownload = true
}, ref) => {
  const [uploading, setUploading] = useState(false);

  // 显示反馈消息的通用函数
  const showFeedback = (type, content) => {
    try {
      // 优先使用 message
      if (type === 'success') {
        message.success(content);
      } else if (type === 'error') {
        message.error(content);
      } else if (type === 'warning') {
        message.warning(content);
      }
      console.log('反馈消息显示成功:', { type, content });
    } catch (error) {
      console.error('反馈消息显示失败:', error);
      // 备用方案：使用 notification
      try {
        if (type === 'success') {
          notification.success({
            message: '操作成功',
            description: content,
            placement: 'topRight',
          });
        } else if (type === 'error') {
          notification.error({
            message: '操作失败',
            description: content,
            placement: 'topRight',
          });
        } else if (type === 'warning') {
          notification.warning({
            message: '操作警告',
            description: content,
            placement: 'topRight',
          });
        }
        console.log('备用反馈消息显示成功:', { type, content });
      } catch (notificationError) {
        console.error('备用反馈消息也失败:', notificationError);
        // 最后的备用方案：使用 alert
        alert(content);
      }
    }
  };

  // 处理文件上传
  const handleFileUpload = async (file) => {
    const isLtMaxSize = file.size / 1024 / 1024 < maxFileSize;
    if (!isLtMaxSize) {
      showFeedback('error', `文件 "${file.name}" 大小不能超过${maxFileSize}MB!`);
      return false;
    }

    // 检查是否有有效的relatedId
    if (!relatedId || relatedId === 'temp' || relatedId === 0) {
      showFeedback('error', '请先保存业务记录，然后再上传附件');
      return false;
    }

    console.log('开始上传附件:', {
      relatedTable,
      relatedId,
      fileName: file.name,
      fileSize: file.size
    });

    const formData = new FormData();
    formData.append('attachment', file);
    
    // 直接使用数据库结构的字段名
    formData.append('relatedTable', relatedTable);
    formData.append('relatedId', relatedId);
    
    console.log('上传参数:', {
      relatedTable,
      relatedId
    });

    try {
      setUploading(true);
      const response = await apiClient.post('/attachment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      console.log('上传响应:', response);
      
      // 检查响应结构，兼容不同的返回格式
      const isSuccess = response.success || response.status === 200 || response.status === 201;
      const responseData = response.data || response;
      
      if (isSuccess && responseData) {
        const newAttachment = responseData;
        
        // 添加到附件列表并通知父组件
        const newAttachments = [...attachments, newAttachment];
        onAttachmentsChange(newAttachments);
        console.log('附件上传成功，更新附件列表:', newAttachments);
        
        showFeedback('success', `文件 "${file.name}" 上传成功`);
        console.log('文件上传成功:', newAttachment);
        return true;
      } else {
        const errorMessage = response.message || response.error || '文件上传失败';
        showFeedback('error', errorMessage);
        console.error('上传失败:', response);
        return false;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      if (error.response?.data?.message) {
        showFeedback('error', `文件 "${file.name}" 上传失败: ${error.response.data.message}`);
      } else {
        showFeedback('error', `文件 "${file.name}" 上传失败`);
      }
      return false;
    } finally {
      setUploading(false);
    }
  };

  // 删除附件
  const handleDeleteAttachment = async (attachmentId) => {
    try {
      const response = await apiClient.delete(`/attachment/${attachmentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      console.log('删除响应:', response);
      
      // 检查响应结构，兼容不同的返回格式
      const isSuccess = response.success || response.status === 200 || response.status === 204;
      
      if (isSuccess) {
        const deletedAttachment = attachments.find(att => att.Id === attachmentId);
        const newAttachments = attachments.filter(att => att.Id !== attachmentId);
        onAttachmentsChange(newAttachments);
        
        if (deletedAttachment) {
          showFeedback('success', `附件 "${deletedAttachment.OriginalFileName || deletedAttachment.FileName}" 删除成功`);
          console.log('附件删除成功:', deletedAttachment);
          console.log('删除后的附件列表:', newAttachments);
        } else {
          showFeedback('success', '附件删除成功');
          console.log('删除后的附件列表:', newAttachments);
        }
      } else {
        const errorMessage = response.message || response.error || '附件删除失败';
        showFeedback('error', errorMessage);
        console.error('删除失败:', response);
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      if (error.response?.data?.message) {
        showFeedback('error', `附件删除失败: ${error.response.data.message}`);
      } else {
        showFeedback('error', '附件删除失败');
      }
    }
  };

  // 下载附件
  const handleDownloadAttachment = async (attachment) => {
    try {
      const attachmentId = attachment?.Id || attachment?.id;
      if (!attachmentId) {
        message.error('无法识别附件ID');
        return;
      }
      
      console.log('开始下载附件:', {
        attachmentId,
        attachment,
        backendURL: getBackendURL()
      });
      
      // 对于文件下载，直接使用fetch而不是apiClient
      const token = localStorage.getItem('token');
      const response = await fetch(`${getBackendURL()}/attachment/${attachmentId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('下载响应:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        throw new Error(`下载失败: ${response.status} ${response.statusText}`);
      }
      
      // 获取文件名
      const contentDisposition = response.headers.get('content-disposition');
      let fileName = attachment.OriginalFileName || attachment.originalFileName || attachment.FileName || attachment.name || 'attachment';
      
      console.log('文件名处理:', {
        originalFileName: attachment.OriginalFileName,
        fileName: attachment.FileName,
        contentDisposition,
        initialFileName: fileName
      });
      
      // 从响应头中提取文件名
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          fileName = filenameMatch[1].replace(/['"]/g, '');
          // 解码URI编码的文件名
          try {
            fileName = decodeURIComponent(fileName);
          } catch (e) {
            console.warn('文件名解码失败:', e);
          }
        }
      }
      
      console.log('最终文件名:', fileName);
      
      // 创建blob并下载
      const blob = await response.blob();
      console.log('Blob信息:', {
        size: blob.size,
        type: blob.type
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showFeedback('success', '文件下载成功');
    } catch (e) {
      console.error('Error downloading attachment:', e);
      showFeedback('error', '下载失败: ' + e.message);
    }
  };

  // 获取文件大小显示
  const getFileSizeDisplay = (size) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  };

  // 获取文件名
  const getFileName = (attachment) => {
    return attachment.OriginalFileName || attachment.originalFileName || attachment.FileName || attachment.name || '未知文件';
  };

  // 获取上传时间
  const getUploadTime = (attachment) => {
    return dayjs(attachment.CreatedAt || attachment.uploadTime || attachment.createdAt).format('YYYY-MM-DD HH:mm:ss');
  };

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({}));

  // 构建操作按钮
  const buildActions = (attachment) => {
    const actions = [];
    
    if (showDownload) {
      actions.push(
        <Button
          key="download"
          type="link"
          size="small"
          icon={<DownloadOutlined />}
          onClick={() => handleDownloadAttachment(attachment)}
          style={{ padding: '4px 8px' }}
        >
          下载
        </Button>
      );
    }
    
    if (showDelete) {
      actions.push(
        <Popconfirm
          key="delete"
          title="确定要删除这个附件吗？"
          description="删除后无法恢复"
          onConfirm={() => handleDeleteAttachment(attachment.Id)}
          okText="确定删除"
          cancelText="取消"
          okType="danger"
        >
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            style={{ padding: '4px 8px' }}
          >
            删除
          </Button>
        </Popconfirm>
      );
    }
    
    return actions;
  };

  return (
    <div 
      style={{
        border: '1px dashed #d9d9d9',
        borderRadius: '6px',
        padding: '16px',
        backgroundColor: '#fafafa',
        marginBottom: '16px',
        ...style
      }}
      className={className}
    >
      <div style={{ marginBottom: '12px' }}>
        <Upload
          beforeUpload={(file) => {
            handleFileUpload(file);
            return false; // 阻止自动上传
          }}
          showUploadList={false}
          multiple={multiple}
          disabled={disabled}
        >
          <Button 
            icon={<UploadOutlined />} 
            loading={uploading} 
            type="dashed" 
            style={{ width: '100%' }}
            disabled={disabled}
          >
            选择文件
          </Button>
        </Upload>
        <div style={{
          marginTop: '8px',
          color: '#999',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          支持{multiple ? '多个' : '单个'}文件，单个文件不超过{maxFileSize}MB
        </div>
      </div>

      {/* 显示已上传的附件列表 */}
      {attachments.length > 0 && (
        <div>
          <div style={{
            marginBottom: '12px',
            fontWeight: 'bold',
            color: '#1890ff',
            fontSize: '14px'
          }}>
            附件列表 ({attachments.length} 个)
          </div>
          <List
            size="small"
            dataSource={attachments}
            renderItem={(attachment) => (
              <List.Item
                style={{
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  border: '1px solid #f0f0f0'
                }}
                actions={buildActions(attachment)}
              >
                <List.Item.Meta
                  avatar={<FileTextOutlined style={{ color: '#1890ff', fontSize: '16px' }} />}
                  title={
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#333'
                    }}>
                      {getFileName(attachment)}
                    </span>
                  }
                  description={
                    <span style={{
                      fontSize: '12px',
                      color: '#666',
                      lineHeight: '1.4'
                    }}>
                      大小：{getFileSizeDisplay(attachment.FileSize || attachment.fileSize || attachment.size || 0)} |
                      上传时间：{getUploadTime(attachment)}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  );
});

export default AttachmentUpload;
