import { createSlice, type PayloadAction, } from '@reduxjs/toolkit';
import { getProfile, reqToLogin, reqToSignUp } from '../../services/auth/authService';
import type { LoginResponse, LoginResponseData, ProfileResponse } from '../../services/auth/authInterface';

interface AuthState {
  loader: boolean;
  admin: LoginResponseData | null;
  error: string | null;
  profile: ProfileResponse['data'] | null;
}

const initialState: AuthState = {
  loader: false,
  admin: null,
  error: '',
  profile: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    signOut: (state) => {
      state.admin = null;
      state.error = null;
      state.loader = false;
      state.profile = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(reqToLogin.pending, (state) => {
      state.loader = true;
    });
    builder.addCase(reqToLogin.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
      state.loader = false;
      state.admin = action.payload.data;
      state.error = null;
    });
    builder.addCase(reqToLogin.rejected, (state, action: PayloadAction<any>) => {
      state.loader = false;
      state.error = action.payload ?? 'Login failed!';
    });

    builder.addCase(reqToSignUp.pending, (state) => {
      state.loader = true;
    });
    builder.addCase(reqToSignUp.fulfilled, (state) => {
      state.loader = false;
      state.error = null;
    });
    builder.addCase(reqToSignUp.rejected, (state, action: PayloadAction<any>) => {
      state.loader = false;
      state.error = action.payload ?? 'Login failed!';
    });

    builder.addCase(getProfile.pending, (state) => {
      state.loader = true;
    });
    builder.addCase(getProfile.fulfilled, (state, action: PayloadAction<ProfileResponse>) => {
      state.loader = false;
      state.profile = action.payload.data;
      state.error = null;
    });
    builder.addCase(getProfile.rejected, (state, action: PayloadAction<any>) => {
      state.loader = false;
      state.error = action.payload ?? 'Failed to fetch profile.';
    });
  },
});

export const { signOut } = adminSlice.actions;
export default adminSlice.reducer;
