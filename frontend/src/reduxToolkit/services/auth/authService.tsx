import { createAsyncThunk } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import Axios from '../../helper/axios';
import { apiEndPoints } from '../../../constants';
import type { LoginRequest, LoginResponse } from './authInterface';

// reqToLogin
export const reqToLogin = createAsyncThunk<LoginResponse, LoginRequest>(
  'auth/login',
  async (data: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await Axios.post(apiEndPoints.login, data);
      if (response.data.success) {
        toast.success('Login successfully!');
        return response.data;
      } else {
        toast.error('Login failed. Please check your details and try again.');
        return rejectWithValue(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.response.data.errors || error.response.data.message || 'An error occurred during login.');
      return rejectWithValue('Login failed due to an error.');
    }
  }
);
