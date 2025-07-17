import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ParameterResponse,
  Parameter,
} from "../../services/parameter/parameterInterface";
import {
  deleteParameter,
  fetchParameters,
} from "../../services/parameter/parameterService";

interface ParameterState {
  loading: boolean;
  parameters: Parameter[];
  error: string | null;
  meta: Meta;
}

const initialState: ParameterState = {
  loading: false,
  parameters: [],
  error: null,
  meta: {
    totalItems: 1,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
  },
};

const parameterSlice = createSlice({
  name: "parameters",
  initialState,
  reducers: {
    clearParameters: (state) => {
      state.parameters = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchParameters.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchParameters.fulfilled,
      (state, action: PayloadAction<ParameterResponse>) => {
        state.loading = false;
        state.parameters = action.payload.data;
        state.meta = action.payload.meta;
        state.error = null;
      }
    );
    builder.addCase(
      fetchParameters.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch parameters";
      }
    );

    builder.addCase(deleteParameter.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteParameter.fulfilled, (state) => {
      state.loading = false;
      state.error = null;
    });
    builder.addCase(
      deleteParameter.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to delete parameters";
      }
    );
  },
});

export const { clearParameters } = parameterSlice.actions;
export default parameterSlice.reducer;
