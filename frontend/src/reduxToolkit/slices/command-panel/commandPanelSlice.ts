import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  getDashboardStats,
  getDashboardUnitScores,
  getScoreBoards,
} from "../../services/command-panel/commandPanelService";
import type {
  Application,
  CommandPanelResponse,
  DashboardResponse,
  DashboardStats,
  DashboardUnitScoreResponse,
} from "../../services/command-panel/commandPanelInterface";

interface CommandPanelState {
  loading: boolean;
  success: boolean;
  error: string | null;
  dashboardStats: DashboardStats | null;
  unitScores: {
    name: string;
    score: number;
  }[];
  scoreboard: Application[];
  meta: Meta;
}

const initialState: CommandPanelState = {
  loading: false,
  success: false,
  error: null,
  dashboardStats: null,
  unitScores: [],
  scoreboard: [],
  meta: {
    totalItems: 1,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
  },
};

const commandPanelSlice = createSlice({
  name: "commandPanel",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // ✅ Get Clarifications for Units
    builder.addCase(getScoreBoards.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(
      getScoreBoards.fulfilled,
      (state, action: PayloadAction<CommandPanelResponse>) => {
        state.loading = false;
        state.scoreboard = action.payload.data || [];
        state.meta = action.payload.meta;
      }
    );
    builder.addCase(
      getScoreBoards.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch scoreboard";
      }
    );

    // getDashboardStats
    builder.addCase(getDashboardStats.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(
      getDashboardStats.fulfilled,
      (state, action: PayloadAction<DashboardResponse>) => {
        state.loading = false;
        state.dashboardStats = action.payload.data;
        state.error = null;
      }
    );
    builder.addCase(
      getDashboardStats.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong!";
      }
    );

    // getDashboardUnitScores
    builder.addCase(getDashboardUnitScores.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(
      getDashboardUnitScores.fulfilled,
      (state, action: PayloadAction<DashboardUnitScoreResponse>) => {
        state.loading = false;
        state.unitScores = action.payload.data;
        state.error = null;
      }
    );
    builder.addCase(
      getDashboardUnitScores.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong!";
      }
    );
  },
});

export default commandPanelSlice.reducer;
