import api from "./axios";

export const uploadResume = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append("resume", file);

  const response = await api.post(
    "/resume/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(percent);
        }
      },
    }
  );

  return response.data;
};

export const getResume = async () => {
  const response = await api.get("/resume");
  return response.data;
};

export const deleteResume = async () => {
  const response = await api.delete("/resume");
  return response.data;
};