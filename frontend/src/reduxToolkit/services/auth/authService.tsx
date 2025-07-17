import { createAsyncThunk } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import Axios from '../../helper/axios';
import { apiEndPoints } from '../../../constants';
import type { LoginRequest, LoginResponse, ProfileResponse, SignUpRequest, SignUpResponse, UpdateUnitProfileRequest, UpdateUnitProfileResponse } from './authInterface';

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
      toast.error(error.response.data.errors ?? error.response.data.message ?? 'An error occurred during login.');
      return rejectWithValue('Login failed due to an error.');
    }
  }
);

export const reqToSignUp = createAsyncThunk<SignUpResponse, SignUpRequest>(
  'auth/signUp',
  async (data: SignUpRequest, { rejectWithValue }) => {
    try {
      const response = await Axios.post(apiEndPoints.signUp, data);
      if (response.data.success) {
        toast.success('Sign up successfully!');
        return response.data;
      } else {
        toast.error('Sign up failed. Please check your details and try again.');
        return rejectWithValue(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.response.data.errors ?? error.response.data.message ?? 'An error occurred during sign up.');
      return rejectWithValue('Sign up failed due to an error.');
    }
  }
);

export const getProfile = createAsyncThunk<ProfileResponse>(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await Axios.get(apiEndPoints.getProfile);
      if (response.data.success) {
        return response.data;
      } else {
        toast.error('Failed to fetch profile.');
        return rejectWithValue(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? 'Error fetching profile.');
      return rejectWithValue('Failed to fetch profile.');
    }
  }
);

export const reqToUpdateUnitProfile = createAsyncThunk<
  UpdateUnitProfileResponse,
  UpdateUnitProfileRequest
>(
  'auth/updateUnitProfile',
  async (data, { rejectWithValue }) => {
    try {
      const response = await Axios.post(apiEndPoints.updateUnitProfile, data);
      if (response.data.success) {
        toast.success('Unit profile updated successfully!');
        return response.data;
      } else {
        toast.error(response.data.message ?? 'Failed to update unit profile.');
        return rejectWithValue(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? 'Error updating unit profile.');
      return rejectWithValue('Failed to update unit profile.');
    }
  }
);