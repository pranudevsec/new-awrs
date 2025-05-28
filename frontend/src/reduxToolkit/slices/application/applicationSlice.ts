// applicationSlice.ts

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchApplicationUnits } from '../../services/application/applicationService';
import type { ApplicationUnit, FetchApplicationUnitsResponse } from '../../services/application/applicationInterface';

interface ApplicationState {
  loading: boolean;
  success: boolean;
  error: string | null;
  units: ApplicationUnit[];
}

const initialState: ApplicationState = {
  loading: false,
  success: false,
  error: null,
  units: [],
};

const applicationSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {
    resetApplicationState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.units = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchApplicationUnits.pending, (state) => {
      state.loading = true;
      state.success = false;
      state.error = null;
    });
    builder.addCase(fetchApplicationUnits.fulfilled, (state, action: PayloadAction<FetchApplicationUnitsResponse>) => {
      state.loading = false;
      state.success = action.payload.success;
      state.units = action.payload.data;
    });
    builder.addCase(fetchApplicationUnits.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.success = false;
      state.error = action.payload || 'Failed to fetch application units';
    });
  },
});

export const { resetApplicationState } = applicationSlice.actions;
export default applicationSlice.reducer;
