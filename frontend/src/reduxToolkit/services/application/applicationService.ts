import { createAsyncThunk } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import Axios from "../../helper/axios";
import type {
  AddCommentParam,
  AddCommentResponse,
  ApproveApplicationsParams,
  ApproveApplicationsResponse,
  ApproveMarksParam,
  ApproveMarksResponse,
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
  isShortlisted?: boolean;
  isGetNotClarifications?: boolean;
}

interface FetchHQApplicationsParams {
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

export const fetchApplicationHistory = createAsyncThunk<
  FetchApplicationUnitsResponse,
  FetchUnitsParams | undefined
>("applications/fetchHistory", async (params, { rejectWithValue }) => {
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
      `${apiEndPoints.applicationHistory}?${queryParams.toString()}`
    );

    if (response.data.success) {
      return response.data;
    } else {
      toast.error(response.data.message || "Failed to fetch application history");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Error fetching application history"
    );
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch application history"
    );
  }
});

export const fetchAllApplications = createAsyncThunk<
  FetchApplicationUnitsResponse,
  FetchUnitsParams | undefined
>("applications/fetchAllApplications", async (params, { rejectWithValue }) => {
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
      `${apiEndPoints.applicationAll}?${queryParams.toString()}`
    );

    if (response.data.success) {
      return response.data;
    } else {
      toast.error(response.data.message || "Failed to fetch all application");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Error fetching all application"
    );
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch all application"
    );
  }
});

export const fetchApplicationsForHQ = createAsyncThunk<
  FetchApplicationUnitsResponse, 
  FetchHQApplicationsParams | undefined
>("applications/fetchApplicationsForHQ", async (params, { rejectWithValue }) => {
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
      `${apiEndPoints.application}/headquarter?${queryParams.toString()}`
    );

    if (response.data.success) {
      return response.data;
    } else {
      toast.error(response.data.message || "Failed to fetch HQ applications");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Error fetching HQ applications"
    );
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch HQ applications"
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
    if (params?.isShortlisted !== undefined) {
      queryParams.append("isShortlisted", String(params.isShortlisted));
    }
    if (params?.isGetNotClarifications !== undefined) {
      queryParams.append("isGetNotClarifications", String(params.isGetNotClarifications));
    }
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
        member: params.member
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

export const approveApplications = createAsyncThunk<
  ApproveApplicationsResponse,
  ApproveApplicationsParams
>(
  "applications/approveApplications",
  async (params, { rejectWithValue }) => {
    try {
      const payload: any = {
        type: params.type,
        status: params.status || "approved",
      };

      if (params.id) {
        payload.id = params.id; 
      }

      if (params.ids) {
        payload.ids = params.ids;
      }

      const response = await Axios.put(
        `${apiEndPoints.application}/approve/applications`,
        payload
      );

      if (response.data.success) {
        toast.success(
          response.data.message || "Applications approved successfully"
        );
        return response.data;
      } else {
        toast.error(response.data.message || "Failed to approve applications");
        return rejectWithValue(response.data.message);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Error approving applications"
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to approve applications"
      );
    }
  }
);


export const approveMarks = createAsyncThunk<
  ApproveMarksResponse,
  ApproveMarksParam
>("applications/approveMarks", async (body, { rejectWithValue }) => {
  try {
    const response = await Axios.post(
      `${apiEndPoints.application}/approve-marks`,
      body
    );

    if (response.data.success) {
      return response.data;
    } else {
      toast.error(response.data.message || "Failed to approve marks");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Error approving marks"
    );
    return rejectWithValue(
      error.response?.data?.message || "Failed to approve marks"
    );
  }
});

export const addApplicationComment = createAsyncThunk<
  AddCommentResponse,
  AddCommentParam
>(
  "applications/addApplicationComment",
  async (body, { rejectWithValue }) => {
    try {
      const response = await Axios.post(
        `${apiEndPoints.application}/add-comment`,
        body
      );

      if (response.data.success) {
        toast.success(response.data.message || "Comment(s) added successfully");
        return response.data;
      } else {
        toast.error(response.data.message || "Failed to add comment(s)");
        return rejectWithValue(response.data.message);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Error adding comment(s)"
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to add comment(s)"
      );
    }
  }
);