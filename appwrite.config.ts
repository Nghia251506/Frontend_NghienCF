import { Client, Storage } from 'appwrite';

// Kiểm tra sự tồn tại của các biến môi trường (Giúp ông không bị lỗi undefined khi chạy)
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID;

if (!endpoint || !projectId || !bucketId) {
    console.warn("⚠️ Cảnh báo: Các biến môi trường Appwrite chưa được cấu hình đầy đủ trong file .env");
}

const client = new Client()
    .setEndpoint(endpoint || 'https://cloud.appwrite.io/v1')
    .setProject(projectId || '');

export const storage = new Storage(client);
export const BUCKET_ID = bucketId || '';

// Xuất bản thêm thông tin Project Name nếu ông cần dùng để hiển thị trên UI
export const PROJECT_NAME = import.meta.env.VITE_APPWRITE_PROJECT_NAME;

/**
 * Service xử lý các thao tác với Storage
 */
export const AppwriteService = {
  /**
   * Upload file và trả về URL trực tiếp
   */
  uploadFile: async (file: File): Promise<string> => {
    try {
      const { ID } = await import('appwrite'); // Import ID động để tránh lỗi SSR nếu cần
      
      const response = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        file
      );

      // Trả về link view trực tiếp cho ảnh
      const fileUrl = storage.getFileView(BUCKET_ID, response.$id);
      return fileUrl.toString();
    } catch (error) {
      console.error("Appwrite upload error:", error);
      throw error;
    }
  },

  /**
   * Xóa file dựa trên URL (Dùng khi cập nhật ảnh mới, xóa ảnh cũ)
   */
  deleteFileByUrl: async (url: string) => {
    try {
      if (!url.includes(`/buckets/${BUCKET_ID}/files/`)) return;
      
      const parts = url.split('/files/');
      if (parts.length < 2) return;
      
      const fileId = parts[1].split('/')[0];
      await storage.deleteFile(BUCKET_ID, fileId);
    } catch (error) {
      console.error("Appwrite delete error:", error);
    }
  }
};