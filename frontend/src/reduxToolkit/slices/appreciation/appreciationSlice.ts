import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  createAppreciation,
  fetchAppreciationById,
  updateAppreciation,
} from "../../services/appreciation/appreciationService";
import type { CreateAppreciationResponse } from "../../services/appreciation/appreciationInterface";

interface AppreciationState {
  loading: boolean;
  success: boolean;
  error: string | null;
  data: any;
  draftData: any;
}

const initialState: AppreciationState = {
  loading: false,
  success: false,
  error: null,
  data: null,
  draftData: null,
};

const appreciationSlice = createSlice({
  name: "appreciations",
  initialState,
  reducers: {
    resetAppreciationState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createAppreciation.pending, (state: AppreciationState) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(
        createAppreciation.fulfilled,
        (
          state: AppreciationState,
          action: PayloadAction<CreateAppreciationResponse>
        ) => {
          state.loading = false;
          state.success = action.payload.success;
          state.data = action.payload.data ?? null;
        }
      )
      .addCase(
        createAppreciation.rejected,
        (state: AppreciationState, action: PayloadAction<any>) => {
          state.loading = false;
          state.success = false;
          state.error = action.payload ?? "Failed to create appreciation";
        }
      )
      .addCase(fetchAppreciationById.pending, (state: AppreciationState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAppreciationById.fulfilled,
        (
          state: AppreciationState,
          action: PayloadAction<CreateAppreciationResponse>
        ) => {
          state.loading = false;
          state.success = action.payload.success;
          state.draftData = action.payload.data ?? null;
        }
      )
      .addCase(
        fetchAppreciationById.rejected,
        (state: AppreciationState, action: PayloadAction<any>) => {
          state.loading = false;
          state.error = action.payload ?? "Failed to fetch appreciation";
        }
      )
      .addCase(updateAppreciation.pending, (state: AppreciationState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateAppreciation.fulfilled,
        (
          state: AppreciationState,
          action: PayloadAction<CreateAppreciationResponse>
        ) => {
          state.loading = false;
          state.success = action.payload.success;
          state.data = action.payload.data ?? null;
        }
      )
      .addCase(
        updateAppreciation.rejected,
        (state: AppreciationState, action: PayloadAction<any>) => {
          state.loading = false;
          state.error = action.payload ?? "Failed to update appreciation";
        }
      );
  },
});

export const { resetAppreciationState } = appreciationSlice.actions;
export default appreciationSlice.reducer;
