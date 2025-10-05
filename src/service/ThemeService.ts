import axiosClient from "../axios/axiosClient";
import type { ThemeDto } from "../applyTheme";

const THEM_URL = "/theme"
export const getTheme = async () => (await axiosClient.get<ThemeDto>(`${THEM_URL}`));
export const updateTheme = async (dto: ThemeDto) => (await axiosClient.put(`${THEM_URL}`, dto)).data;
