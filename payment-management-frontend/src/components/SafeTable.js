import React, { useRef, useEffect, useState } from 'react';
import { Table } from 'antd';
import { useResizeObserverFix } from '../hooks/useResizeObserverFix';

/**
 * 安全的 Table 组件
 * 专门处理 Ant Design Table 组件的 ResizeObserver 错误
 */
const SafeTable = ({ 
  scroll, 
  children, 
  onResize,
  ...tableProps 
}) => {
  const [isReady, setIsReady] = useState(false);
  const tableRef = useRef(null);
  
  // 使用 ResizeObserver 修复 Hook
  const { containerRef } = useResizeObserverFix({
    enabled: true,
    debounceMs: 32, // 为 Table 组件增加防抖时间
    suppressErrors: true,
    onResize: (entries) => {
      if (onResize) {
        onResize(entries);
      }
    }
  });

  // 处理 Table 组件的特殊需求
  useEffect(() => {
    if (tableRef.current) {
      // 延迟设置就绪状态，确保 DOM 完全渲染
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // 优化 scroll 属性
  const optimizedScroll = React.useMemo(() => {
    if (!scroll) return undefined;
    
    // 如果设置了 x 滚动，添加一些优化
    if (scroll.x) {
      return {
        ...scroll,
        // 添加平滑滚动
        scrollToFirstRowOnChange: false,
        // 优化大表格的性能
        preserveWhitespace: false
      };
    }
    
    return scroll;
  }, [scroll]);

  // 处理表格大小变化
  const handleTableResize = (entries) => {
    try {
      entries.forEach(entry => {
        if (entry.target === tableRef.current) {
          // 表格大小变化时的处理逻辑
          const { width, height } = entry.contentRect;
          
          // 可以在这里添加表格大小变化的处理逻辑
          if (onResize) {
            onResize([{ target: entry.target, contentRect: { width, height } }]);
          }
        }
      });
    } catch (error) {
      // 忽略 ResizeObserver 相关错误
      if (error.message && error.message.includes('ResizeObserver')) {
        console.warn('Table resize error suppressed:', error.message);
      } else {
        console.error('Table resize error:', error);
      }
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <div 
        ref={tableRef}
        style={{ 
          width: '100%',
          opacity: isReady ? 1 : 0.8,
          transition: 'opacity 0.2s ease-in-out'
        }}
      >
        <Table
          {...tableProps}
          scroll={optimizedScroll}
          onResize={handleTableResize}
          // 添加性能优化
          pagination={{
            ...tableProps.pagination,
            // 避免分页时的频繁重新渲染
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            position: ['bottomCenter'],
            size: 'default'
          }}
          // 优化表格渲染
          size="middle"
          bordered={false}
          // 添加错误边界
          locale={{
            ...tableProps.locale,
            emptyText: tableProps.locale?.emptyText || '暂无数据'
          }}
        />
      </div>
    </div>
  );
};

export default SafeTable;
