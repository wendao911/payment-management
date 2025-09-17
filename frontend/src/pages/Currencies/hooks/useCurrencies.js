import { useState, useCallback } from 'react';
import { message, Modal } from 'antd';
import { apiClient } from '../../../utils/api';

export const useCurrencies = () => {
  const [Currencies, setCurrencies] = useState([]);
  const [FilteredCurrencies, setFilteredCurrencies] = useState([]);
  const [Loading, setLoading] = useState(false);

  const FetchCurrencies = useCallback(async () => {
    try {
      setLoading(true);
      const Response = await apiClient.get('/currencies');
      if (Response.data) {
        setCurrencies(Response.data);
        setFilteredCurrencies(Response.data);
      }
    } catch (Error) {
      console.error('获取币种列表失败:', Error);
      message.error('获取币种列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const HandleSearch = useCallback(async (SearchParams) => {
    try {
      setLoading(true);
      const Response = await apiClient.get('/currencies/search', { params: SearchParams });
      if (Response.data) {
        setFilteredCurrencies(Response.data);
      }
    } catch (Error) {
      console.error('搜索币种失败:', Error);
      message.error('搜索币种失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const HandleReset = useCallback(() => {
    setFilteredCurrencies(Currencies);
  }, [Currencies]);

  const HandleDelete = useCallback((Record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除币种 "${Record.Name}" (${Record.Code}) 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const Response = await apiClient.delete(`/currencies/${Record.Id}`);
          if (Response.success) {
            message.success('删除成功');
            FetchCurrencies();
          } else {
            message.error(Response.message || '删除失败');
          }
        } catch (Error) {
          console.error('删除币种失败:', Error);
          message.error('删除币种失败');
        }
      }
    });
  }, [FetchCurrencies]);

  return {
    Currencies,
    FilteredCurrencies,
    Loading,
    FetchCurrencies,
    HandleSearch,
    HandleReset,
    HandleDelete
  };
};
