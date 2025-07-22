import { createAsyncThunk } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import Axios from "../../helper/axios";
import { apiEndPoints } from "../../../constants";
import type {
  CommandPanelResponse,
  DashboardResponse,
  DashboardUnitScoreResponse,
  HomeCountResponse,
} from "./commandPanelInterface";

// Get Brigade ScoreBoards
export const getBrigadeScoreBoards = createAsyncThunk<
  CommandPanelResponse,
  {
    award_type: string;
    search: string;
    page?: number;
    limit?: number;
    isShortlisted?: boolean;
  }
>(
  "brigadePanel/get",
  async (
    { award_type, search, page, limit, isShortlisted },
    { rejectWithValue }
  ) => {
    try {
      const response = await Axios.get(
        `${apiEndPoints.scoreBoard}?award_type=${
          award_type || ""
        }&search=${search}&page=${page ?? 1}&limit=${
          limit ?? 10
        }&isShortlisted=${isShortlisted ?? ""}`
      );
      return response.data;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ?? "Failed to fetch scoreboard"
      );
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// Get Brigade Dashboard Stats
export const getBrigadeDashboardStats = createAsyncThunk<DashboardResponse>(
  "brigadeDashboard/getStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Axios.get(apiEndPoints.dashboardStats);
      if (response.data.success) {
        return response.data;
      } else {
        return rejectWithValue(response.data.message ?? "Something went wrong");
      }
    } catch (error: any) {
      toast.error(
        error.response.data.message ??
          "An error occurred while fetching dashboard stats."
      );
      return rejectWithValue(
        "Failed to fetch dashboard stats due to an error."
      );
    }
  }
);

// Get Brigade Dashboard Unit Scores
export const getBrigadeDashboardUnitScores =
  createAsyncThunk<DashboardUnitScoreResponse>(
    "brigadeDashboard/getUnitScoresChart",
    async (_, { rejectWithValue }) => {
      try {
        const response = await Axios.get(apiEndPoints.dashboardUnitScores);
        if (response.data.success) {
          return response.data;
        } else {
          toast.error(response.data.message ?? "Something went wrong");
          return rejectWithValue(
            response.data.message ?? "Something went wrong"
          );
        }
      } catch (error: any) {
        console.error("Dashboard score fetch error:", error);

        toast.error(
          error?.response?.data?.message ??
          error.message ??
          "Failed to fetch dashboard unit score chart."
        );

        return rejectWithValue(
          error?.response?.data?.message ??
          "Failed to fetch dashboard unit score chart due to an error."
        );
      }
    }
  );

// Get Brigade Home Count Stats
export const getBrigadeHomeCountStats = createAsyncThunk<HomeCountResponse>(
  "brigadePanel/getHomeCounts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Axios.get(`${apiEndPoints.dashboard}/home-counts`);
      if (response.data.success) {
        return response.data;
      } else {
        toast.error(response.data.message ?? "Failed to fetch home counts");
        return rejectWithValue(response.data.message);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ?? "Error fetching home counts"
      );
      return rejectWithValue(error.response?.data?.message);
    }
  }
); 