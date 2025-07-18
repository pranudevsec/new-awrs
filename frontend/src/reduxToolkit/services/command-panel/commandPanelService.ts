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

export const getScoreBoards = createAsyncThunk<
  CommandPanelResponse,
  {
    award_type: string;
    search: string;
    page?: number;
    limit?: number;
    isShortlisted?: boolean;
  }
>(
  "commandPanel/get",
  async (
    { award_type, search, page, limit, isShortlisted },
    { rejectWithValue }
  ) => {
    try {
      const response = await Axios.get(
        `${apiEndPoints.scoreBoard}?award_type=${
          award_type ?? ""
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

export const getDashboardStats = createAsyncThunk<DashboardResponse>(
  "commandDashboard/getStats",
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

export const getDashboardUnitScores =
  createAsyncThunk<DashboardUnitScoreResponse>(
    "commandDashboard/getUnitScoresChart",
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
        toast.error(
          error.response.data.message ??
            "An error occurred while fetching dashboard unit score."
        );
        return rejectWithValue(
          "Failed to fetch dashboard unit score chart due to an error."
        );
      }
    }
  );

export const getHomeCountStats = createAsyncThunk<HomeCountResponse>(
  "commandPanel/getHomeCounts",
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
