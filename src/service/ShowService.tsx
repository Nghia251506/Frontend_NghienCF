import axiosClient from "../axios/axiosClient";
import { Show , ShowCreateDto} from "../types/Show";

const SHOW_URL = "/show";

export const getAllShows = async (): Promise<Show[]> => {
  return await axiosClient.get(`${SHOW_URL}/getall`);
};

export const getShowByType = async (title: string): Promise<Show> => {
  return await axiosClient.get(`${SHOW_URL}/${title}`);
};

export const createShow = async (dto: ShowCreateDto): Promise<Show> => {
  return await axiosClient.post(SHOW_URL, dto);
};

export const updateShow = async (title: string, show: Show): Promise<void> => {
  await axiosClient.put(`${SHOW_URL}/${title}`, show);
};

export const deleteShow = async (id: number): Promise<void> => {
  await axiosClient.delete(`${SHOW_URL}/${id}`);
};

export const defaultShow = async (id: number): Promise<void> => {
  await axiosClient.put(`${SHOW_URL}/${id}/set-default`);
}