import { createAsyncThunk } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import Axios from "../../helper/axios";
import type {
  FetchApplicationUnitDetailResponse,
  FetchApplicationUnitsResponse,
  UpdateApplicationParams,
  UpdateApplicationResponse,
} from "./applicationInterface";
import { apiEndPoints } from "../../../constants";

interface FetchUnitsParams {
  award_type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const fetchApplicationUnits = createAsyncThunk<
  FetchApplicationUnitsResponse,
  FetchUnitsParams | undefined
>("applications/fetchUnits", async (params, { rejectWithValue }) => {
  try {
    const queryParams = new URLSearchParams();

    if (params?.award_type) {
      queryParams.append("award_type", params.award_type);
    }
    if (params?.search) {
      queryParams.append("search", params.search);
    }
    if (params?.page) {
      queryParams.append("page", String(params.page));
    }
    if (params?.limit) {
      queryParams.append("limit", String(params.limit));
    }

    const response = await Axios.get(
      `${apiEndPoints.applicationUnits}?${queryParams.toString()}`
    );
    if (response.data.success) {
      return response.data;
    } else {
      toast.error(response.data.message || "Failed to fetch application units");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Error fetching application units"
    );
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch application units"
    );
  }
});

interface FetchUnitDetailParams {
  award_type: string;
  numericAppId: number;
}

export const fetchApplicationUnitDetail = createAsyncThunk<
  FetchApplicationUnitDetailResponse,
  FetchUnitDetailParams
>("applications/fetchUnitDetail", async (params, { rejectWithValue }) => {
  try {
    const queryParams = new URLSearchParams({
      award_type: params.award_type,
      application_id: String(params.numericAppId),
    });

    const response = await Axios.get(
      `${apiEndPoints.applicationUnitDetail}?${queryParams.toString()}`
    );

    if (response.data.success) {
      return response.data;
    } else {
      toast.error(response.data.message || "Failed to fetch unit detail");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error fetching unit detail");
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch unit detail"
    );
  }
});

export const fetchSubordinates = createAsyncThunk<
  FetchApplicationUnitsResponse,
  FetchUnitsParams | undefined
>("applications/fetchSubordinates", async (params, { rejectWithValue }) => {
  try {
    const queryParams = new URLSearchParams();

    if (params?.award_type) queryParams.append("award_type", params.award_type);
    if (params?.search) queryParams.append("search", params.search);
    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.limit) queryParams.append("limit", String(params.limit));

    const response = await Axios.get(
      `${apiEndPoints.applicationSubordinates}?${queryParams.toString()}`
    );

    if (response.data.success) {
      return response.data;
    } else {
      toast.error(
        response.data.errors || "Failed to fetch subordinate applications"
      );
      return rejectWithValue(response.data.errors);
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Error fetching subordinate applications"
    );
    return rejectWithValue(
      error.response?.data?.message ||
        "Failed to fetch subordinate applications"
    );
  }
});

export const updateApplication = createAsyncThunk<
  UpdateApplicationResponse,
  UpdateApplicationParams
>("applications/updateApplication", async (params, { rejectWithValue }) => {
  try {
    const response = await Axios.put(
      `${apiEndPoints.application}/${params.id}`,
      {
        type: params.type,
        status: params.status,
      }
    );

    if (response.data.success) {
      toast.success(
        response.data.message || "Application updated successfully"
      );
      return response.data;
    } else {
      toast.error(response.data.message || "Failed to update application");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error updating application");
    return rejectWithValue(
      error.response?.data?.message || "Failed to update application"
    );
  }
});
