import { createAsyncThunk } from "@reduxjs/toolkit";
import { create } from "xmlbuilder2";
import toast from "react-hot-toast";
import axios from "axios";
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
  FetchDashboardStatsResponse,
  UpdateApplicationParams,
  UpdateApplicationResponse,
  TokenValidationParam,
  TokenValidationResponse,
} from "./applicationInterface";
import { apiEndPoints } from "../../../constants";

const URL = import.meta.env.VITE_VALIDATE_TOKEN_URL;

interface FetchUnitsParams {
  award_type?: string;
  command_type?: string;
  corps_type?: string;
  division_type?: string;
  brigade_type?: string;
  search?: string;
  page?: number;
  limit?: number;
  isShortlisted?: boolean;
  isGetNotClarifications?: boolean;
  isGetWithdrawRequests?: boolean;
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
      toast.error(response.data.message ?? "Failed to fetch application units");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.message ?? "Error fetching application units"
    );
    return rejectWithValue(
      error.response?.data?.message ?? "Failed to fetch application units"
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
      return rejectWithValue({
        message: response.data.message ?? "Failed to fetch all applications",
        errors: response.data.errors,
      });
    }
  } catch (error: any) {
    return rejectWithValue({
      message:
        error.response?.data?.message ?? "Failed to fetch all applications",
      errors: error.response?.data?.errors,
    });
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
    if (params?.command_type) {
      queryParams.append("command_type", params.command_type);
    }
    if (params?.corps_type) {
      queryParams.append("corps_type", params.corps_type);
    }
    if (params?.division_type) {
      queryParams.append("division_type", params.division_type);
    }
    if (params?.brigade_type) {
      queryParams.append("brigade_type", params.brigade_type);
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
      return rejectWithValue({
        message: response.data.message ?? "Failed to fetch all applications",
        errors: response.data.errors,
      });
    }
  } catch (error: any) {
    return rejectWithValue({
      message:
        error.response?.data?.message ?? "Failed to fetch all applications",
      errors: error.response?.data?.errors,
    });
  }
});

export const fetchApplicationsForHQ = createAsyncThunk<
  FetchApplicationUnitsResponse,
  FetchHQApplicationsParams | undefined
>(
  "applications/fetchApplicationsForHQ",
  async (params, { rejectWithValue }) => {
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
        toast.error(response.data.message ?? "Failed to fetch HQ applications");
        return rejectWithValue(response.data.message);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ?? "Error fetching HQ applications"
      );
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to fetch HQ applications"
      );
    }
  }
);

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
      toast.error(response.data.message ?? "Failed to fetch unit detail");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message ?? "Error fetching unit detail");
    return rejectWithValue(
      error.response?.data?.message ?? "Failed to fetch unit detail"
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
      queryParams.append(
        "isGetNotClarifications",
        String(params.isGetNotClarifications)
      );
    }
    if (params?.isGetWithdrawRequests !== undefined) {
      queryParams.append(
        "isGetWithdrawRequests",
        String(params.isGetWithdrawRequests)
      );
    }
    const response = await Axios.get(
      `${apiEndPoints.applicationSubordinates}?${queryParams.toString()}`
    );

    if (response.data.success) {
      return response.data;
    } else {
      return rejectWithValue({
        message: response.data.message ?? "Failed to fetch all applications",
        errors: response.data.errors,
      });
    }
  } catch (error: any) {
    return rejectWithValue({
      message:
        error.response?.data?.message ?? "Failed to fetch all applications",
      errors: error.response?.data?.errors,
    });
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
        member: params.member,
        level: params.level,
        iscdr: params.iscdr,
        withdrawRequested: params.withdrawRequested,
        withdraw_status: params.withdraw_status,
      }
    );

    if (response.data.success) {
      toast.success(
        response.data.message ?? "Application updated successfully"
      );
      return response.data;
    } else {
      toast.error(
        response.data.errors ??
          response.data.message ??
          "Failed to update application"
      );
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.errors ??
        error.response?.data?.message ??
        "Error updating application"
    );
    return rejectWithValue(
      error.response?.data?.message ?? "Failed to update application"
    );
  }
});

export const approveApplications = createAsyncThunk<
  ApproveApplicationsResponse,
  ApproveApplicationsParams
>("applications/approveApplications", async (params, { rejectWithValue }) => {
  try {
    const payload: any = {
      type: params.type,
      status: params.status ?? "approved",
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
        response.data.message ?? "Applications approved successfully"
      );
      return response.data;
    } else {
      toast.error(response.data.message ?? "Failed to approve applications");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.message ?? "Error approving applications"
    );
    return rejectWithValue(
      error.response?.data?.message ?? "Failed to approve applications"
    );
  }
});

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
      toast.error(response.data.message ?? "Failed to approve marks");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message ?? "Error approving marks");
    return rejectWithValue(
      error.response?.data?.message ?? "Failed to approve marks"
    );
  }
});

export const addApplicationComment = createAsyncThunk<
  AddCommentResponse,
  AddCommentParam
>("applications/addApplicationComment", async (body, { rejectWithValue }) => {
  try {
    const response = await Axios.post(
      `${apiEndPoints.application}/add-comment`,
      body
    );

    if (response.data.success) {
      toast.success(response.data.message ?? "Comment(s) added successfully");
      return response.data;
    } else {
      toast.error(response.data.message ?? "Failed to add comment(s)");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message ?? "Error adding comment(s)");
    return rejectWithValue(
      error.response?.data?.message ?? "Failed to add comment(s)"
    );
  }
});
export const TokenValidation = createAsyncThunk<
  TokenValidationResponse,
  TokenValidationParam,
  {
    rejectValue: string;
  }
>(
  "applications/validateToken",
  async ({ inputPersID }, { rejectWithValue }) => {
    try {
      const data = JSON.stringify({ inputPersID });

      const config = {
        method: "post" as const,
        url: `${URL}/ValidatePersID`,
        headers: {
          "Content-Type": "application/json",
        },
        maxBodyLength: Infinity,
        data,
      };

      const response = await axios.request(config);
      const result = response.data?.ValidatePersIDResult?.[0];

      if (result?.Status === "201" && result?.vaildId) {
        toast.success(result?.Remark ?? "Token Matched");
        return result as TokenValidationResponse;
      } else {
        toast.error(result?.Remark ?? "Token does not match!!");
        return rejectWithValue(result?.Remark ?? "Token validation failed");
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? "Error validating token";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const getSignedData = createAsyncThunk<any, any>(
  "applications/getSignedData",
  async (body, { rejectWithValue }) => {
    try {
      const xml = create({ version: "1.0" })
        .ele(body)
        .end({ prettyPrint: true });

      const config = {
        method: "post" as const,
        maxBodyLength: Infinity,
        url: `${URL}/SignXml`,
        headers: {
          "Content-Type": "application/xml",
        },
        data: xml,
      };

      const response = await axios.request(config);

      if (response.data) {
        toast.success("Data signed successfully");
        return response.data;
      } else {
        toast.error("Signing failed: No data received");
        return rejectWithValue("Signing failed: No data received");
      }
    } catch (error: any) {
      const message = error?.response?.data?.message ?? "Error signing data";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

interface FetchDashboardStatsParams {
  page?: number;
  limit?: number;
  award_type?: string;
}

export const fetchDashboardStats = createAsyncThunk<
  FetchDashboardStatsResponse,
  FetchDashboardStatsParams | undefined
>("applications/fetchDashboardStats", async (params, { rejectWithValue }) => {
  try {
    const queryParams = new URLSearchParams();

    if (params?.page) {
      queryParams.append("page", String(params.page));
    }
    if (params?.limit) {
      queryParams.append("limit", String(params.limit));
    }
    if (params?.award_type) {
      queryParams.append("award_type", params.award_type);
    }

    const response = await Axios.get(
      `${apiEndPoints.applicationAllCount}?${queryParams.toString()}`
    );

    if (response.data.success) {
      return response.data;
    } else {
      return rejectWithValue({
        message: response.data.message ?? "Failed to fetch dashboard stats",
        errors: response.data.errors,
      });
    }
  } catch (error: any) {
    return rejectWithValue({
      message:
        error.response?.data?.message ?? "Failed to fetch dashboard stats",
      errors: error.response?.data?.errors,
    });
  }
});

interface ApplicationsGraphResponse {
  success: boolean;
  message: string;
  data: Array<{
    name: string;
    totalApplications: number;
    approvedApplications: number;
    rejectedApplications: number;
    pendingApplications: number;
    totalMarks: number;
    averageMarks: number;
  }> | {
    x: string[];
    y: number[];
  };
  meta?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

interface FetchApplicationsGraphParams {
  page?: number;
  limit?: number;
  group_by?: string;
}

export const fetchApplicationsGraph = createAsyncThunk<
  ApplicationsGraphResponse,
  FetchApplicationsGraphParams | undefined
>("applications/fetchApplicationsGraph", async (params, { rejectWithValue }) => {
  try {
    const queryParams = new URLSearchParams();

    if (params?.page) {
      queryParams.append("page", String(params.page));
    }
    if (params?.limit) {
      queryParams.append("limit", String(params.limit));
    }
    if (params?.group_by) {
      queryParams.append("group_by", params.group_by);
    }

    const response = await Axios.get(
      `${apiEndPoints.application}/graph?${queryParams.toString()}`
    );

    if (response.data.success) {
      return response.data;
    } else {
      return rejectWithValue({
        message: response.data.message ?? "Failed to fetch applications graph data",
        errors: response.data.errors,
      });
    }
  } catch (error: any) {
    return rejectWithValue({
      message:
        error.response?.data?.message ?? "Failed to fetch applications graph data",
      errors: error.response?.data?.errors,
    });
  }
});
