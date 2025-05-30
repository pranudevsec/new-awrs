// clarificationService.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import Axios from '../../helper/axios';
import toast from 'react-hot-toast';
import type {
  CreateClarificationPayload,
  CreateClarificationResponse,
  GetClarificationListResponse,
  UpdateClarificationPayload,
  UpdateClarificationResponse,
} from './clarificationInterface';
import { apiEndPoints } from '../../../constants';

export const createClarification = createAsyncThunk<
  CreateClarificationResponse,
  CreateClarificationPayload
>(
  'clarifications/create',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await Axios.post(apiEndPoints.clarification, payload);
      if (response.data.success) {
        toast.success(response.data.message || 'Clarification submitted');
        return response.data;
      } else {
        toast.error(response.data.message || 'Failed to submit clarification');
        return rejectWithValue(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Submission error');
      return rejectWithValue(error.response?.data?.message || 'Failed to submit clarification');
    }
  }
);

// ✅ Get Clarification for Units
export const getClarifications = createAsyncThunk<
  GetClarificationListResponse
>('clarifications/get', async (_, { rejectWithValue }) => {
  try {
    const response = await Axios.get(apiEndPoints.clarification);
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to fetch clarifications');
    return rejectWithValue(error.response?.data?.message);
  }
});

// ✅ Get Clarification for Subordinates
export const getSubordinateClarifications = createAsyncThunk<
  GetClarificationListResponse
>('clarifications/getSubordinates', async (_, { rejectWithValue }) => {
  try {
    const response = await Axios.get(`${apiEndPoints.clarification}/for-subordinates`);
    return response.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to fetch subordinate clarifications');
    return rejectWithValue(error.response?.data?.message);
  }
});

// ✅ Update Clarification
export const updateClarification = createAsyncThunk<
  UpdateClarificationResponse,
  UpdateClarificationPayload
>(
  'clarifications/update',
  async ({ id, clarification, clarification_status }, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      if (clarification !== undefined) {
        formData.append('clarification', clarification);
      }

      if (clarification_status !== undefined) {
        formData.append('clarification_status', clarification_status);
      }

      const response = await Axios.put(
        `${apiEndPoints.clarification}/${id}`,
        formData
      );

      if (response.data.success) {
        toast.success(response.data.message || 'Clarification updated');
        return response.data;
      } else {
        toast.error(response.data.message || 'Failed to update clarification');
        return rejectWithValue(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update error');
      return rejectWithValue(error.response?.data?.message);
    }
  }
);