import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getScoreBoards } from "../../services/command-panel/commandPanelService";
import type {
  Application,
  CommandPanelResponse,
} from "../../services/command-panel/commandPanelInterface";

interface CommandPanelState {
  loading: boolean;
  success: boolean;
  error: string | null;
  scoreboard: Application[];
  meta: Meta;
}

const initialState: CommandPanelState = {
  loading: false,
  success: false,
  error: null,
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
  },
});

export default commandPanelSlice.reducer;
