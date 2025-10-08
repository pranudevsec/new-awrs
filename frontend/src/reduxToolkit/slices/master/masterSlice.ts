import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import {
  getBrigades,
  getCorps,
  getCommands,
  getDivisions,
  getArmsServices,
  getRoles,
  getDeployments,
  getUnits,
  type BrigadeItem,
  type CorpsItem,
  type CommandItem,
  type DivisionItem,
  type ArmsServiceItem,
  type RoleItem,
  type DeploymentItem,
  type UnitItem
} from "../../services/master/masterService";

interface MasterState {
  brigades: BrigadeItem[];
  corps: CorpsItem[];
  commands: CommandItem[];
  divisions: DivisionItem[];
  armsServices: ArmsServiceItem[];
  roles: RoleItem[];
  deployments: DeploymentItem[];
  units: UnitItem[];
  loading: boolean;
  error: string | null;
}

const initialState: MasterState = {
  brigades: [],
  corps: [],
  commands: [],
  divisions: [],
  armsServices: [],
  roles: [],
  deployments: [],
  units: [],
  loading: false,
  error: null,
};

// Async thunks for fetching master data
export const fetchBrigades = createAsyncThunk(
  "master/fetchBrigades",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getBrigades();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch brigades");
    }
  }
);

export const fetchCorps = createAsyncThunk(
  "master/fetchCorps",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getCorps();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch corps");
    }
  }
);

export const fetchCommands = createAsyncThunk(
  "master/fetchCommands",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getCommands();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch commands");
    }
  }
);

export const fetchDivisions = createAsyncThunk(
  "master/fetchDivisions",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getDivisions();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch divisions");
    }
  }
);

export const fetchArmsServices = createAsyncThunk(
  "master/fetchArmsServices",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getArmsServices();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch arms services");
    }
  }
);

export const fetchRoles = createAsyncThunk(
  "master/fetchRoles",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getRoles();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch roles");
    }
  }
);

export const fetchDeployments = createAsyncThunk(
  "master/fetchDeployments",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getDeployments();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch deployments");
    }
  }
);

export const fetchUnits = createAsyncThunk(
  "master/fetchUnits",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getUnits();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch units");
    }
  }
);

// Fetch all master data at once
export const fetchAllMasterData = createAsyncThunk(
  "master/fetchAllMasterData",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await Promise.all([
        dispatch(fetchBrigades()),
        dispatch(fetchCorps()),
        dispatch(fetchCommands()),
        dispatch(fetchDivisions()),
        dispatch(fetchArmsServices()),
        dispatch(fetchRoles()),
        dispatch(fetchDeployments()),
        dispatch(fetchUnits())
      ]);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch master data");
    }
  }
);

const masterSlice = createSlice({
  name: "master",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetMasterState: () => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // Brigades
      .addCase(fetchBrigades.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBrigades.fulfilled, (state, action: PayloadAction<BrigadeItem[]>) => {
        state.loading = false;
        state.brigades = action.payload;
      })
      .addCase(fetchBrigades.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Corps
      .addCase(fetchCorps.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCorps.fulfilled, (state, action: PayloadAction<CorpsItem[]>) => {
        state.loading = false;
        state.corps = action.payload;
      })
      .addCase(fetchCorps.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Commands
      .addCase(fetchCommands.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCommands.fulfilled, (state, action: PayloadAction<CommandItem[]>) => {
        state.loading = false;
        state.commands = action.payload;
      })
      .addCase(fetchCommands.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Divisions
      .addCase(fetchDivisions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDivisions.fulfilled, (state, action: PayloadAction<DivisionItem[]>) => {
        state.loading = false;
        state.divisions = action.payload;
      })
      .addCase(fetchDivisions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Arms Services
      .addCase(fetchArmsServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchArmsServices.fulfilled, (state, action: PayloadAction<ArmsServiceItem[]>) => {
        state.loading = false;
        state.armsServices = action.payload;
      })
      .addCase(fetchArmsServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Roles
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action: PayloadAction<RoleItem[]>) => {
        state.loading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Deployments
      .addCase(fetchDeployments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeployments.fulfilled, (state, action: PayloadAction<DeploymentItem[]>) => {
        state.loading = false;
        state.deployments = action.payload;
      })
      .addCase(fetchDeployments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Units
      .addCase(fetchUnits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUnits.fulfilled, (state, action: PayloadAction<UnitItem[]>) => {
        state.loading = false;
        state.units = action.payload;
      })
      .addCase(fetchUnits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearError, resetMasterState } = masterSlice.actions;
export default masterSlice.reducer;
