import { createAsyncThunk } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import Axios from "../../helper/axios";
import type {
  CreateCitationRequest,
  CreateCitationResponse,
  UpdateCitationRequest,
  UpdateCitationResponse,
} from "./citationInterface";
import { apiEndPoints } from "../../../constants";

export const createCitation = createAsyncThunk<
  CreateCitationResponse,
  CreateCitationRequest
>("citations/create", async (payload, { rejectWithValue }) => {
  try {
    const response = await Axios.post(apiEndPoints.citation, payload);
    if (response.data.success) {
      if (!payload?.isDraft) toast.success("Citation created successfully!");
      return response.data;
    } else {
      toast.error("Failed to create citation");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message ?? "Error creating citation");
    return rejectWithValue("Failed to create citation");
  }
});

export const fetchCitationById = createAsyncThunk<
  CreateCitationResponse,
  number
>("citations/fetchById", async (id, { rejectWithValue }) => {
  try {
    const response = await Axios.get(`${apiEndPoints.citation}/${id}`);
    if (response.data.success) {
      return response.data;
    } else {
      toast.error("Failed to fetch citation");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message ?? "Error fetching citation");
    return rejectWithValue("Failed to fetch citation");
  }
});

export const updateCitation = createAsyncThunk<
  UpdateCitationResponse,
  UpdateCitationRequest
>("citations/update", async (payload, { rejectWithValue }) => {
  try {
    const { id, ...restPayload } = payload;

    const response = await Axios.put(
      `${apiEndPoints.citation}/${id}`,
      restPayload
    );

    if (response.data.success) {
      return response.data;
    } else {
      toast.error("Failed to update citation");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message ?? "Error updating citation");
    return rejectWithValue("Failed to update citation");
  }
});

export const deleteCitation = createAsyncThunk<
  UpdateCitationResponse,
  number,
  { rejectValue: string }
>("citations/delete", async (id, { rejectWithValue }) => {
  try {
    const response = await Axios.delete(`${apiEndPoints.citation}/${id}`);
    if (response.data.success) {
      toast.success("Citation deleted successfully!");
      return response.data;
    } else {
      toast.error("Failed to delete citation");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message ?? "Error deleting citation");
    return rejectWithValue("Failed to delete citation");
  }
});
