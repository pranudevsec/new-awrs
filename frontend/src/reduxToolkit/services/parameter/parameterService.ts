import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiEndPoints } from "../../../constants";
import type { ParameterRequest, ParameterResponse } from "./parameterInterface";
import toast from "react-hot-toast";
import Axios from "../../helper/axios";

export const fetchParameters = createAsyncThunk<
  ParameterResponse,
  { awardType: string; search: string }
>("parameters/fetch", async ({ awardType, search }, { rejectWithValue }) => {
  try {
    const response = await Axios.get(
      `${apiEndPoints.parameter}?awardType=${awardType || ""}&search=${search}`
    );
    if (response.data.success) {
      return response.data;
    } else {
      toast.error("Failed to fetch parameters");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error fetching parameters");
    return rejectWithValue("Failed to fetch parameters");
  }
});

export const createParameter = createAsyncThunk<
  ParameterResponse,
  ParameterRequest
>("parameters/create", async (payload, { rejectWithValue }) => {
  try {
    const response = await Axios.post(apiEndPoints.parameter, payload);
    if (response.data.success) {
      toast.success(response.data.message || "Parameter submitted");
      return response.data;
    } else {
      toast.error(response.data.message || "Failed to submit parameter");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Submission error");
    return rejectWithValue(
      error.response?.data?.message || "Failed to submit parameter"
    );
  }
});

export const updateParameter = createAsyncThunk<
  ParameterResponse,
  { id: string; payload: ParameterRequest }
>("parameters/update", async ({ id, payload }, { rejectWithValue }) => {
  try {
    const response = await Axios.put(
      apiEndPoints.parameterEdit.replace(":id", id),
      payload
    );

    if (response.data.success) {
      toast.success(response.data.message || "Parameter updated successfully");
      return response.data;
    } else {
      toast.error(response.data.message || "Failed to update parameter");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "An error occurred during update"
    );
    return rejectWithValue(
      error.response?.data?.message || "Failed to update parameter"
    );
  }
});

// deleteParameter
export const deleteParameter = createAsyncThunk<
  ParameterResponse,
  { id: string }
>("parameters/delete", async ({ id }, { rejectWithValue }) => {
  try {
    const response = await Axios.delete(
      apiEndPoints.parameterEdit.replace(":id", id)
    );

    if (response.data.success) {
      toast.success("Parameter deleted successfully!");
      return response.data;
    } else {
      toast.error(response.data.message || "Something went wrong");
      return rejectWithValue(response.data.message || "Something went wrong");
    }
  } catch (error: any) {
    toast.error(
      error.response.data.message ||
        "An error occurred while deleting parameter."
    );
    return rejectWithValue("Failed to delete parameter due to an error.");
  }
});
