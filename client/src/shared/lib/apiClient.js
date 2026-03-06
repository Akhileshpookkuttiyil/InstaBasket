import axios from "axios";
import { env } from "../config/env";

const apiClient = axios.create({
  baseURL: env.baseUrl || undefined,
  withCredentials: true,
});

export default apiClient;
