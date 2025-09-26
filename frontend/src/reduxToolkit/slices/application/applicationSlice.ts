import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  fetchApplicationHistory,
  fetchAllApplications,
  fetchApplicationsForHQ,
  fetchApplicationUnitDetail,
  fetchApplicationUnits,
  fetchSubordinates,
  fetchDashboardStats,
  fetchApplicationsGraph,
} from "../../services/application/applicationService";
import type {
  ApplicationDetail,
  ApplicationUnit,
  DashboardStats,
  FetchApplicationUnitDetailResponse,
  FetchApplicationUnitsResponse,
  Subordinate,
} from "../../services/application/applicationInterface";

interface ApplicationState {
  loading: boolean;
  success: boolean;
  error: string | null;
  units: ApplicationUnit[];
  unitDetail: ApplicationDetail | null;
  subordinates: Subordinate[];
  dashboardStats: DashboardStats | null;
  graphData: Array<{
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
  meta: Meta;
}

const initialState: ApplicationState = {
  loading: false,
  success: false,
  error: null,
  units: [],
  unitDetail: null,
  subordinates: [],
  dashboardStats: null,
  graphData: [],
  meta: {
    totalItems: 1,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
  },
};

const applicationSlice = createSlice({
  name: "applications",
  initialState,
  reducers: {
    resetApplicationState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.units = [];
      state.unitDetail = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchApplicationUnits.pending, (state) => {
      state.loading = true;
      state.success = false;
      state.error = null;
    });
    builder.addCase(
      fetchApplicationUnits.fulfilled,
      (state, action: PayloadAction<FetchApplicationUnitsResponse>) => {
        state.loading = false;
        state.success = action.payload.success;
        state.units = action.payload.data;
        state.meta = action.payload.meta;
      }
    );
    builder.addCase(
      fetchApplicationUnits.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload ?? "Failed to fetch application units";
      }
    );

    builder.addCase(fetchApplicationUnitDetail.pending, (state) => {
      state.loading = true;
      state.unitDetail = null;
    });
    builder.addCase(
      fetchApplicationUnitDetail.fulfilled,
      (state, action: PayloadAction<FetchApplicationUnitDetailResponse>) => {
        state.loading = false;
        state.unitDetail = action.payload.data;
      }
    );
    builder.addCase(
      fetchApplicationUnitDetail.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.unitDetail = null;
        state.error = action.payload ?? "Failed to fetch unit detail";
      }
    );

    builder.addCase(fetchSubordinates.pending, (state) => {
      state.loading = true;
      state.success = false;
      state.error = null;
    });
    builder.addCase(
      fetchSubordinates.fulfilled,
      (state, action: PayloadAction<FetchApplicationUnitsResponse>) => {
        state.loading = false;
        state.success = action.payload.success;
        state.units = action.payload.data;
        state.meta = action.payload.meta;
      }
    );
    builder.addCase(
      fetchSubordinates.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.success = false;
        state.error =
          action.payload ?? "Failed to fetch subordinate applications";
      }
    );

    builder.addCase(fetchApplicationsForHQ.pending, (state) => {
      state.loading = true;
      state.success = false;
      state.error = null;
    });
    builder.addCase(
      fetchApplicationsForHQ.fulfilled,
      (state, action: PayloadAction<FetchApplicationUnitsResponse>) => {
        state.loading = false;
        state.success = action.payload.success;
        state.units = action.payload.data;
        state.meta = action.payload.meta;
      }
    );
    builder.addCase(
      fetchApplicationsForHQ.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload ?? "Failed to fetch HQ applications";
      }
    );

    builder.addCase(fetchApplicationHistory.pending, (state) => {
      state.loading = true;
      state.success = false;
      state.error = null;
    });
    builder.addCase(
      fetchApplicationHistory.fulfilled,
      (state, action: PayloadAction<FetchApplicationUnitsResponse>) => {
        state.loading = false;
        state.success = action.payload.success;
        state.units = action.payload.data;
        state.meta = action.payload.meta;
      }
    );
    builder.addCase(
      fetchApplicationHistory.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload ?? "Failed to fetch application history";
      }
    );

    builder.addCase(fetchAllApplications.pending, (state) => {
      state.loading = true;
      state.success = false;
      state.error = null;
    });
    builder.addCase(
      fetchAllApplications.fulfilled,
      (state, action: PayloadAction<FetchApplicationUnitsResponse>) => {
        state.loading = false;
        state.success = action.payload.success;
        state.units = action.payload.data;
        state.meta = action.payload.meta;
      }
    );
    builder.addCase(
      fetchAllApplications.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload ?? "Failed to fetch application history";
      }
    );

    builder.addCase(fetchDashboardStats.pending, (state) => {
      state.loading = true;
      state.success = false;
      state.error = null;
    });
    builder.addCase(
      fetchDashboardStats.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.success = action.payload.success;
        state.dashboardStats = action.payload.data;
      }
    );
    builder.addCase(
      fetchDashboardStats.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload ?? "Failed to fetch dashboard stats";
      }
    );

    builder.addCase(fetchApplicationsGraph.pending, (state) => {
      state.loading = true;
      state.success = false;
      state.error = null;
    });
    builder.addCase(
      fetchApplicationsGraph.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.success = action.payload.success;
        state.graphData = action.payload.data;
      }
    );
    builder.addCase(
      fetchApplicationsGraph.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload ?? "Failed to fetch applications graph";
      }
    );
  },
});

export const { resetApplicationState } = applicationSlice.actions;
export default applicationSlice.reducer;
