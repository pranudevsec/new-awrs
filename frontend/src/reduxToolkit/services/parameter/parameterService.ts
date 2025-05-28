// parameterService.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import Axios from '../../helper/axios';
import type { ParameterResponse } from './parameterInterface';
import { apiEndPoints } from '../../../constants';

export const fetchParameters = createAsyncThunk<
  ParameterResponse,
  { awardType: string }
>(
  'parameters/fetch',
  async ({ awardType }, { rejectWithValue }) => {
    try {
      const response = await Axios.get(`${apiEndPoints.parameter}?awardType=${awardType}`);
      if (response.data.success) {
        return response.data;
      } else {
        toast.error('Failed to fetch parameters');
        return rejectWithValue(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error fetching parameters');
      return rejectWithValue('Failed to fetch parameters');
    }
  }
);
