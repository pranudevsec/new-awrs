import { createAsyncThunk } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import Axios from "../../helper/axios";
import type {
  CreateAppreciationPayload,
  CreateAppreciationResponse,
} from "./appreciationInterface";
import { apiEndPoints } from "../../../constants";

export const createAppreciation = createAsyncThunk<
  CreateAppreciationResponse,
  CreateAppreciationPayload
>("appreciations/create", async (payload, { rejectWithValue }) => {
  try {
    const response = await Axios.post(apiEndPoints.appreciation, payload);
    if (response.data.success) {
      toast.success("Appreciation created successfully!");
      return response.data;
    } else {
      toast.error(response.data.message || "Failed to submit appreciation");
      return rejectWithValue(response.data.message);
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Submission error");
    return rejectWithValue(
      error.response?.data?.message || "Failed to submit appreciation"
    );
  }
});
