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

// ✅ Get ScoreBoards
export const getScoreBoards = createAsyncThunk<
  CommandPanelResponse,
  { awardType: string; search: string; page?: number; limit?: number }
>(
  "commandPanel/get",
  async ({ awardType, search, page, limit }, { rejectWithValue }) => {
    try {
      const response = await Axios.get(
        `${apiEndPoints.scoreBoard}?awardType=${
          awardType || ""
        }&search=${search}&page=${page || 1}&limit=${limit || 10}`
      );
      return response.data;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to fetch scoreboard"
      );
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// ✅ Get getDashboardStats
export const getDashboardStats = createAsyncThunk<DashboardResponse>(
  "commandDashboard/getStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Axios.get(apiEndPoints.dashboardStats);
      if (response.data.success) {
        return response.data;
      } else {
        // toast.error(response.data.message || "Something went wrong");
        return rejectWithValue(response.data.message || "Something went wrong");
      }
    } catch (error: any) {
      toast.error(
        error.response.data.message ||
          "An error occurred while fetching dashboard stats."
      );
      return rejectWithValue(
        "Failed to fetch dashboard stats due to an error."
      );
    }
  }
);

// ✅ Get getDashboardUnitScores
export const getDashboardUnitScores =
  createAsyncThunk<DashboardUnitScoreResponse>(
    "commandDashboard/getUnitScoresChart",
    async (_, { rejectWithValue }) => {
      try {
        const response = await Axios.get(apiEndPoints.dashboardUnitScores);
        if (response.data.success) {
          return response.data;
        } else {
          toast.error(response.data.message || "Something went wrong");
          return rejectWithValue(
            response.data.message || "Something went wrong"
          );
        }
      } catch (error: any) {
        // toast.error(
        //   error.response.data.message ||
        //     "An error occurred while fetching dashboard unit score chart."
        // );
        return rejectWithValue(
          "Failed to fetch dashboard unit score chart due to an error."
        );
      }
    }
  );

// ✅ Get Home Count Stats
export const getHomeCountStats = createAsyncThunk<HomeCountResponse>(
  "commandPanel/getHomeCounts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Axios.get(`${apiEndPoints.dashboard}/home-counts`);
      if (response.data.success) {
        return response.data;
      } else {
        toast.error(response.data.message || "Failed to fetch home counts");
        return rejectWithValue(response.data.message);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Error fetching home counts"
      );
      return rejectWithValue(error.response?.data?.message);
    }
  }
);
