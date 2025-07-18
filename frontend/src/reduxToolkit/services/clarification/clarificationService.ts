import { createAsyncThunk } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import Axios from "../../helper/axios";
import type {
  CreateClarificationPayload,
  CreateClarificationResponse,
  GetClarificationListResponse,
  UpdateClarificationPayload,
  UpdateClarificationResponse,
} from "./clarificationInterface";
import { apiEndPoints } from "../../../constants";

export const createClarification = createAsyncThunk<
  CreateClarificationResponse,
  CreateClarificationPayload
>("clarifications/create", async (payload, { rejectWithValue }) => {
  try {
    const response = await Axios.post(apiEndPoints.clarification, payload);
    if (response.data.success) {
      toast.success(response.data.message ?? "Clarification submitted");
      return response.data;
    } else {
      toast.error(response.data.message ?? "Failed to submit clarification");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message ?? "Submission error");
    return rejectWithValue(
      error.response?.data?.message ?? "Failed to submit clarification"
    );
  }
});

export const getClarifications = createAsyncThunk<
  GetClarificationListResponse,
  { awardType: string; search: string; page?: number; limit?: number }
>(
  "clarifications/get",
  async ({ awardType, search, page, limit }, { rejectWithValue }) => {
    try {
      const response = await Axios.get(
        `${apiEndPoints.clarification}?awardType=${
          awardType ?? ""
        }&search=${search}&page=${page ?? 1}&limit=${limit ?? 10}`
      );
      return response.data;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ?? "Failed to fetch clarifications"
      );
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const getSubordinateClarifications = createAsyncThunk<
  GetClarificationListResponse,
  { awardType: string; search: string; page?: number; limit?: number }
>(
  "clarifications/getSubordinates",
  async ({ awardType, search, page, limit }, { rejectWithValue }) => {
    try {
      const response = await Axios.get(
        `${apiEndPoints.clarification}/for-subordinates?awardType=${
          awardType ?? ""
        }&search=${search}&page=${page ?? 1}&limit=${limit ?? 10}`
      );
      return response.data;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ??
          "Failed to fetch subordinate clarifications"
      );
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const updateClarification = createAsyncThunk<
  UpdateClarificationResponse,
  UpdateClarificationPayload
>(
  "clarifications/update",
  async (
    { id, clarification, clarification_status, clarification_doc },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();

      if (clarification !== undefined) {
        formData.append("clarification", clarification);
      }

      if (clarification_status !== undefined) {
        formData.append("clarification_status", clarification_status);
      }

      if (clarification_doc) {
        formData.append("clarification_doc", clarification_doc);
      }

      const response = await Axios.put(
        `${apiEndPoints.clarification}/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message ?? "Clarification updated");
        return response.data;
      } else {
        toast.error(response.data.message ?? "Failed to update clarification");
        return rejectWithValue(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Update error");
      return rejectWithValue(error.response?.data?.message);
    }
  }
);
