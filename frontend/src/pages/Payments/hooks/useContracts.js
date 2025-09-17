import { useState, useCallback } from 'react';
import { apiClient } from '../../../utils/api';

export const useContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [contractTreeData, setContractTreeData] = useState([]);

  const fetchContracts = useCallback(async () => {
    try {
      const response = await apiClient.get('/contract');
      if (response.success) {
        const contractsData = response.data || [];
        setContracts(contractsData);

        // 转换为树形选择器格式
        const convertToTreeSelectFormat = (contracts) => {
          return contracts.map(contract => ({
            title: `${contract.ContractNumber} - ${contract.Title || '无标题'}`,
            value: contract.Id,
            key: contract.Id,
            children: contract.children ? convertToTreeSelectFormat(contract.children) : []
          }));
        };

        const treeData = convertToTreeSelectFormat(contractsData);
        setContractTreeData(treeData);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  }, []);

  return {
    contracts,
    contractTreeData,
    fetchContracts
  };
};
