// applicationService.ts

import { createAsyncThunk } from "@reduxjs/toolkit";
import Axios from "../../helper/axios";
import toast from "react-hot-toast";
import type {
  FetchApplicationUnitDetailResponse,
  FetchApplicationUnitsResponse,
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
        response.data.message || "Failed to fetch subordinate applications"
      );
      return rejectWithValue(response.data.message);
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
