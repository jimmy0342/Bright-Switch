
import axios from "axios";

const IMGBB_API_KEY = "";

export interface ImgbbResponse {
  imageUrl: string;
  thumbnailUrl: string;
  deleteUrl: string;
  imageId: string;
}

/**
 * Uploads an image file to IMGBB and returns the hosted URLs.
 * In a production environment, this would be proxied through a 
 * Firebase Cloud Function to protect the API key.
 */
export const uploadToImgbb = async (file: File): Promise<ImgbbResponse> => {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (response.data && response.data.success) {
      const data = response.data.data;
      return {
        imageUrl: data.url,
        thumbnailUrl: data.thumb.url,
        deleteUrl: data.delete_url,
        imageId: data.id,
      };
    } else {
      throw new Error("IMGBB upload failed");
    }
  } catch (error: any) {
    console.error("IMGBB Upload Error:", error);
    throw new Error(error.response?.data?.error?.message || "Failed to upload image to IMGBB");
  }
};
