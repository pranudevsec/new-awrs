import { createSlice, type PayloadAction, } from '@reduxjs/toolkit';
import { reqToLogin } from '../../services/auth/authService';
import type { LoginResponse, LoginResponseData } from '../../services/auth/authInterface';

interface AuthState {
  loader: boolean;
  admin: LoginResponseData | null;
  error: string | null;
}

const initialState: AuthState = {
  loader: false,
  admin: null,
  error: '',
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    signOut: (state) => {
      state.admin = null;
      state.error = null;
      state.loader = false;
    },
  },
  extraReducers: (builder) => {
    // reqToLogin
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
      state.error = action.payload || 'Login failed!';
    });
  },
});

export const { signOut } = adminSlice.actions;
export default adminSlice.reducer;
