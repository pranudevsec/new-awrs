// clarificationService.ts

import { createAsyncThunk } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import Axios from "../../helper/axios";
import { apiEndPoints } from "../../../constants";
import type { CommandPanelResponse } from "./commandPanelInterface";

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
