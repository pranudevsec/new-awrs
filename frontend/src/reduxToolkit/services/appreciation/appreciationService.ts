import { createAsyncThunk } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import Axios from "../../helper/axios";
import type {
  CreateAppreciationPayload,
  CreateAppreciationResponse,
  UpdateAppreciationRequest,
  UpdateAppreciationResponse,
} from "./appreciationInterface";
import { apiEndPoints } from "../../../constants";

export const createAppreciation = createAsyncThunk<
  CreateAppreciationResponse,
  CreateAppreciationPayload
>("appreciations/create", async (payload, { rejectWithValue }) => {
  try {
    const response = await Axios.post(apiEndPoints.appreciation, payload);
    if (response.data.success) {
      if (!payload?.isDraft)
        toast.success("Appreciation created successfully!");

      return response.data;
    } else {
      toast.error(response.data.message ?? "Failed to submit appreciation");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message ?? "Submission error");
    return rejectWithValue(
      error.response?.data?.message ?? "Failed to submit appreciation"
    );
  }
});

export const fetchAppreciationById = createAsyncThunk<
  CreateAppreciationResponse,
  number
>("appreciations/fetchById", async (id, { rejectWithValue }) => {
  try {
    const response = await Axios.get(`${apiEndPoints.appreciation}/${id}`);
    if (response.data.success) {
      return response.data;
    } else {
      toast.error("Failed to fetch appreciation");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message ?? "Error fetching appreciation");
    return rejectWithValue("Failed to fetch appreciation");
  }
});

export const updateAppreciation = createAsyncThunk<
  UpdateAppreciationResponse,
  UpdateAppreciationRequest
>("appreciations/update", async (payload, { rejectWithValue }) => {
  try {
    const { id, ...restPayload } = payload;
    const response = await Axios.put(
      `${apiEndPoints.appreciation}/${id}`,
      restPayload
    );

    if (response.data.success) {
      return response.data;
    } else {
      toast.error("Failed to update appreciation");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message ?? "Error updating appreciation");
    return rejectWithValue("Failed to update appreciation");
  }
});

export const deleteAppreciation = createAsyncThunk<
  UpdateAppreciationResponse,
  number,
  { rejectValue: string }
>("appreciations/delete", async (id, { rejectWithValue }) => {
  try {
    const response = await Axios.delete(`${apiEndPoints.appreciation}/${id}`);
    if (response.data.success) {
      toast.success("Appreciation deleted successfully!");
      return response.data;
    } else {
      toast.error("Failed to delete appreciation");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message ?? "Error deleting appreciation");
    return rejectWithValue("Failed to delete appreciation");
  }
});
