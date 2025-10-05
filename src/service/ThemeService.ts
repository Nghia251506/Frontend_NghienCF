import axios from "axios";
import type { ThemeDto } from "../applyTheme";

const API = import.meta.env.VITE_API_BASE; // https://backend.../api
export const getTheme = async () => (await axios.get<ThemeDto>(`${API}/theme`)).data;
export const updateTheme = async (dto: ThemeDto) => (await axios.put(`${API}/theme`, dto)).data;
