import axiosClient from "../axios/axiosClient";

type UploadResp = { url: string };

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file); // <-- key phải khớp BE: [FromForm] IFormFile file

  const  {url}  = await axiosClient.post<UploadResp>("/uploads", form, { withCredentials: true });
  return url;
}