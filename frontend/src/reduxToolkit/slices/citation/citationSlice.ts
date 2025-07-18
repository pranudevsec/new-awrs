import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CreateCitationResponse } from "../../services/citation/citationInterface";
import {
  createCitation,
  fetchCitationById,
} from "../../services/citation/citationService";

interface CitationState {
  loading: boolean;
  success: boolean;
  error: string | null;
  data: any;
  draftData: any;
}

const initialState: CitationState = {
  loading: false,
  success: false,
  error: null,
  data: null,
  draftData: null,
};

const citationSlice = createSlice({
  name: "citations",
  initialState,
  reducers: {
    resetCitationState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(createCitation.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.success = false;
    });
    builder.addCase(
      createCitation.fulfilled,
      (state, action: PayloadAction<CreateCitationResponse>) => {
        state.loading = false;
        state.success = action.payload.success;
        state.data = action.payload.data;
        state.error = null;
      }
    );
    builder.addCase(
      createCitation.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload ?? "Failed to create citation";
      }
    );

    builder.addCase(fetchCitationById.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.success = false;
    });
    builder.addCase(
      fetchCitationById.fulfilled,
      (state, action: PayloadAction<CreateCitationResponse>) => {
        state.loading = false;
        state.success = action.payload.success;
        state.draftData = action.payload.data;
        state.error = null;
      }
    );
    builder.addCase(
      fetchCitationById.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload ?? "Failed to fetch citation";
      }
    );
  },
});

export const { resetCitationState } = citationSlice.actions;
export default citationSlice.reducer;
