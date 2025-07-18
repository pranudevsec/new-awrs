import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Config } from '../../services/config/configInterface';
import { getConfig, updateConfig } from '../../services/config/configService';

interface ConfigState {
  config: Config | null;
  loader: boolean;
  error: string | null;
}

const initialState: ConfigState = {
  config: null,
  loader: false,
  error: null,
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getConfig.pending, (state) => {
      state.loader = true;
    });
    builder.addCase(getConfig.fulfilled, (state, action: PayloadAction<{ data: Config }>) => {
      state.loader = false;
      state.config = action.payload.data;
      state.error = null;
    });
    builder.addCase(getConfig.rejected, (state, action: PayloadAction<any>) => {
      state.loader = false;
      state.error = action.payload ?? 'Failed to load config';
    });

    builder.addCase(updateConfig.pending, (state) => {
      state.loader = true;
    });
    builder.addCase(updateConfig.fulfilled, (state, action: PayloadAction<{ data: Config }>) => {
      state.loader = false;
      state.config = action.payload.data;
      state.error = null;
    });
    builder.addCase(updateConfig.rejected, (state, action: PayloadAction<any>) => {
      state.loader = false;
      state.error = action.payload ?? 'Failed to update config';
    });
  },
});

export default configSlice.reducer;
