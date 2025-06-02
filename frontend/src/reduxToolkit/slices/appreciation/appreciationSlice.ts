import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { createAppreciation } from "../../services/appreciation/appreciationService";
import type { CreateAppreciationResponse } from "../../services/appreciation/appreciationInterface";

interface AppreciationState {
  loading: boolean;
  success: boolean;
  error: string | null;
  data: any;
}

const initialState: AppreciationState = {
  loading: false,
  success: false,
  error: null,
  data: null,
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
    builder.addCase(createAppreciation.pending, (state) => {
      state.loading = true;
      state.success = false;
      state.error = null;
    });
    builder.addCase(
      createAppreciation.fulfilled,
      (state, action: PayloadAction<CreateAppreciationResponse>) => {
        state.loading = false;
        state.success = action.payload.success;
        state.data = action.payload.data || null;
      }
    );
    builder.addCase(
      createAppreciation.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload || "Failed to create appreciation";
      }
    );
  },
});

export const { resetAppreciationState } = appreciationSlice.actions;
export default appreciationSlice.reducer;
