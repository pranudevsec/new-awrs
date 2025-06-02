import { createAsyncThunk } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import Axios from "../../helper/axios";
import type {
  CreateCitationRequest,
  CreateCitationResponse,
} from "./citationInterface";
import { apiEndPoints } from "../../../constants";

export const createCitation = createAsyncThunk<
  CreateCitationResponse,
  CreateCitationRequest
>("citations/create", async (payload, { rejectWithValue }) => {
  try {
    const response = await Axios.post(apiEndPoints.citation, payload);
    if (response.data.success) {
      return response.data;
    } else {
      toast.error("Failed to create citation");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Error creating citation");
    return rejectWithValue("Failed to create citation");
  }
});
