import { createAsyncThunk } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import Axios from "../../helper/axios";
import { apiEndPoints } from "../../../constants";
import type { ConfigResponse, UpdateConfigRequest } from "./configInterface";

export const getConfig = createAsyncThunk<ConfigResponse>(
  "config/get",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Axios.get(apiEndPoints.config);
      if (response.data.success) {
        return response.data;
      } else {
        toast.error("Failed to fetch config");
        return rejectWithValue(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Error fetching config");
      return rejectWithValue("Fetch failed");
    }
  }
);

export const updateConfig = createAsyncThunk<
  ConfigResponse,
  UpdateConfigRequest
>("config/update", async (data, { rejectWithValue }) => {
  try {
    const response = await Axios.put(apiEndPoints.config, data);
    if (response.data.success) {
      toast.success("Config updated successfully");
      return response.data;
    } else {
      toast.error("Update failed");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message ?? "Error updating config");
    return rejectWithValue("Update failed");
  }
});
