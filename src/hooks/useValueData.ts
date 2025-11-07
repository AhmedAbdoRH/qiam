import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useValueData = () => {
  const [valueData, setValueData] = useState<Record<string, any>>({});

  const fetchValueData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('spiritual_values')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const valueDataMap = data.reduce((acc, item) => {
        acc[item.value_id] = {
          balancePercentage: item.balance_percentage || 50,
          selectedFeelings: item.selected_feelings || [],
          feelingNotes: item.feeling_notes || {},
          notes: item.notes || ''
        };
        return acc;
      }, {} as Record<string, any>);

      setValueData(valueDataMap);
    } catch (error) {
      console.error('Error fetching value data:', error);
    }
  };

  const getValueData = (valueId: string) => {
    return valueData[valueId] || {
      balancePercentage: 50,
      selectedFeelings: [],
      feelingNotes: {},
      notes: ''
    };
  };

  useEffect(() => {
    fetchValueData();
  }, []);

  return {
    valueData,
    getValueData,
    refresh: fetchValueData
  };
};
