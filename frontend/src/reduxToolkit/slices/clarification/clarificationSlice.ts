import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  createClarification,
  getClarifications,
  getSubordinateClarifications,
} from "../../services/clarification/clarificationService";
import type {
  CreateClarificationResponse,
  GetClarificationListResponse,
} from "../../services/clarification/clarificationInterface";

interface ClarificationState {
  loading: boolean;
  success: boolean;
  error: string | null;
  data: any;
  unitClarifications: any[];
  subordinateClarifications: any[];
  meta: Meta;
}

const initialState: ClarificationState = {
  loading: false,
  success: false,
  error: null,
  data: null,
  unitClarifications: [],
  subordinateClarifications: [],
  meta: {
    totalItems: 1,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
  },
};

const clarificationSlice = createSlice({
  name: "clarifications",
  initialState,
  reducers: {
    resetClarificationState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(createClarification.pending, (state) => {
      state.loading = true;
      state.success = false;
      state.error = null;
    });
    builder.addCase(
      createClarification.fulfilled,
      (state, action: PayloadAction<CreateClarificationResponse>) => {
        state.loading = false;
        state.success = action.payload.success;
        state.data = action.payload.data ?? null;
      }
    );
    builder.addCase(
      createClarification.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload ?? "Failed to create clarification";
      }
    );

    builder.addCase(getClarifications.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(
      getClarifications.fulfilled,
      (state, action: PayloadAction<GetClarificationListResponse>) => {
        state.loading = false;
        state.unitClarifications = action.payload.data ?? [];
        state.meta = action.payload.meta;
      }
    );
    builder.addCase(
      getClarifications.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch clarifications";
      }
    );

    builder.addCase(getSubordinateClarifications.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(
      getSubordinateClarifications.fulfilled,
      (state, action: PayloadAction<GetClarificationListResponse>) => {
        state.loading = false;
        state.unitClarifications = action.payload.data ?? [];
        state.meta = action.payload.meta;
      }
    );
    builder.addCase(
      getSubordinateClarifications.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error =
          action.payload ?? "Failed to fetch subordinate clarifications";
      }
    );
  },
});

export const { resetClarificationState } = clarificationSlice.actions;
export default clarificationSlice.reducer;
