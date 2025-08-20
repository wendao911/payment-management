import { useState, useCallback, useEffect } from 'react';
import { message, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from '../../../utils/dayjs';
import { apiClient } from '../../../utils/api';

const { confirm } = Modal;

export const useContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contractTreeData, setContractTreeData] = useState([]);

  const preprocessContractData = useCallback((data) => {
    return (data || []).map((contract) => {
      const processed = { ...contract };
      if (processed.children && Array.isArray(processed.children)) {
        processed.children = processed.children.length > 0 ? preprocessContractData(processed.children) : undefined;
      }
      return processed;
    });
  }, []);

  const convertToTreeSelectFormat = useCallback((contracts) => {
    return contracts.map(contract => ({
      title: `${contract.ContractNumber} - ${contract.Title || '无标题'}`,
      value: contract.Id,
      key: contract.Id,
      children: contract.children ? convertToTreeSelectFormat(contract.children) : []
    }));
  }, []);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/contract');
      if (response.success) {
        const data = preprocessContractData(response.data || []);
        setContracts(data);
        setFilteredContracts(data);
        
        // 转换为树形选择器格式
        const treeData = convertToTreeSelectFormat(data);
        setContractTreeData(treeData);
      } else {
        message.error(response.message || '获取合同列表失败');
        setContracts([]);
        setFilteredContracts([]);
        setContractTreeData([]);
      }
    } catch (e) {
      console.error('Error fetching contracts:', e);
      message.error('获取合同列表失败');
      setContracts([]);
      setFilteredContracts([]);
      setContractTreeData([]);
    }
    setLoading(false);
  }, [preprocessContractData, convertToTreeSelectFormat]);

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await apiClient.get('/supplier');
      if (response.success) {
        setSuppliers(response.data || []);
      } else {
        setSuppliers([]);
      }
    } catch (e) {
      console.error('Error fetching suppliers:', e);
      setSuppliers([]);
    }
  }, []);

  const handleSearch = useCallback(async (values) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (values.contractNumber) params.append('contractNumber', values.contractNumber);
      if (values.title) params.append('title', values.title);
      if (values.supplierId) params.append('supplierId', values.supplierId);
      if (values.status) params.append('status', values.status);
      if (values.dateRange && values.dateRange.length === 2) {
        params.append('startDate', values.dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', values.dateRange[1].format('YYYY-MM-DD'));
      }
      const response = await apiClient.get(`/contract/search?${params.toString()}`);
      if (response.success) {
        setFilteredContracts(preprocessContractData(response.data || []));
      } else {
        message.error(response.message || '查询失败');
        setFilteredContracts([]);
      }
    } catch (e) {
      console.error('Error searching contracts:', e);
      message.error('查询失败，请检查网络连接');
      setFilteredContracts([]);
    }
    setLoading(false);
  }, [preprocessContractData]);

  const handleReset = useCallback(async () => {
    await fetchContracts();
  }, [fetchContracts]);

  const handleDelete = useCallback((id) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个合同吗？',
      onOk: async () => {
        try {
          const resp = await apiClient.delete(`/contract/${id}`);
          if (resp.success) {
            message.success('删除成功');
            fetchContracts();
          } else {
            message.error(resp.message || '删除失败');
          }
        } catch (e) {
          console.error('Error deleting contract:', e);
          message.error('删除失败');
        }
      },
    });
  }, [fetchContracts]);

  const handleFormSubmit = useCallback(async (values) => {
    try {
      const payload = {
        ContractNumber: values.contractNumber,
        Title: values.title,
        Description: values.description,
        ContractDate: values.contractDate ? dayjs(values.contractDate).format('YYYY-MM-DD') : null,
        StartDate: values.startDate ? dayjs(values.startDate).format('YYYY-MM-DD') : null,
        EndDate: values.endDate ? dayjs(values.endDate).format('YYYY-MM-DD') : null,
        Status: values.status,
        SupplierId: values.supplierId,
        ParentContractId: values.parentContractId,
      };

      if (values.editingContract) {
        const id = values.editingContract.Id || values.editingContract.id;
        const resp = await apiClient.put(`/contract/${id}`, payload);
        if (resp.success) {
          message.success('更新成功');
        } else {
          message.error(resp.message || '更新失败');
          return false;
        }
      } else {
        const resp = await apiClient.post('/contract', payload);
        if (resp.success) {
          message.success('创建成功');
        } else {
          message.error(resp.message || '创建失败');
          return false;
        }
      }

      fetchContracts();
      return true;
    } catch (e) {
      console.error('Error saving contract:', e);
      if (e.response?.data?.message) {
        message.error(`保存失败: ${e.response.data.message}`);
      } else {
        message.error('保存失败');
      }
      return false;
    }
  }, [fetchContracts]);

  useEffect(() => {
    fetchContracts();
    fetchSuppliers();
  }, [fetchContracts, fetchSuppliers]);

  return {
    contracts,
    filteredContracts,
    loading,
    suppliers,
    contractTreeData,
    fetchContracts,
    handleSearch,
    handleReset,
    handleDelete,
    handleFormSubmit,
  };
};
