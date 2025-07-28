import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  getBrigadeDashboardStats,
  getBrigadeDashboardUnitScores,
  getBrigadeHomeCountStats,
  getBrigadeScoreBoards,
} from "../../services/command-panel/BrigadePanelService";
import type {
  Application,
  CommandPanelResponse,
  DashboardResponse,
  DashboardStats,
  DashboardUnitScoreResponse,
  HomeCountResponse,
  HomeCountData,
} from "../../services/command-panel/commandPanelInterface";

interface Meta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

interface BrigadePanelState {
  loading: boolean;
  success: boolean;
  error: string | null;
  dashboardStats: DashboardStats | null;
  homeCounts: HomeCountData | null;
  unitScores: { name: string; score: number }[];
  scoreboard: Application[];
  meta: Meta;
}

const initialState: BrigadePanelState = {
  loading: false,
  success: false,
  error: null,
  dashboardStats: null,
  homeCounts: null,
  unitScores: [],
  scoreboard: [],
  meta: {
    totalItems: 1,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
  },
};

const brigadePanelSlice = createSlice({
  name: "brigadePanel",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getBrigadeScoreBoards.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(
      getBrigadeScoreBoards.fulfilled,
      (state, action: PayloadAction<CommandPanelResponse>) => {
        state.loading = false;
        state.scoreboard = action.payload.data ?? [];
        state.meta = action.payload.meta ?? initialState.meta;
        state.error = null;
      }
    );
    builder.addCase(
      getBrigadeScoreBoards.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch scoreboard";
      }
    );

    builder.addCase(getBrigadeDashboardStats.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(
      getBrigadeDashboardStats.fulfilled,
      (state, action: PayloadAction<DashboardResponse>) => {
        state.loading = false;
        state.dashboardStats = action.payload.data;
        state.error = null;
      }
    );
    builder.addCase(
      getBrigadeDashboardStats.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload ?? "Something went wrong!";
      }
    );

    builder.addCase(getBrigadeDashboardUnitScores.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(
      getBrigadeDashboardUnitScores.fulfilled,
      (state, action: PayloadAction<DashboardUnitScoreResponse>) => {
        state.loading = false;
        state.unitScores = action.payload.data;
        state.error = null;
      }
    );
    builder.addCase(
      getBrigadeDashboardUnitScores.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload ?? "Something went wrong!";
      }
    );

    builder.addCase(getBrigadeHomeCountStats.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(
      getBrigadeHomeCountStats.fulfilled,
      (state, action: PayloadAction<HomeCountResponse>) => {
        state.loading = false;
        state.homeCounts = action.payload.data;
        state.error = null;
      }
    );
    builder.addCase(
      getBrigadeHomeCountStats.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch home count data.";
      }
    );
  },
});

export default brigadePanelSlice.reducer; 