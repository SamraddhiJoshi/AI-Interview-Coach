import api from "./axios";

export const generateInterview = async (interviewData) => {
  const response = await api.post("/interviews/generate", interviewData);
  return response.data;
};

export const getInterview = async (id) => {
  const response = await api.get(`/interviews/${id}`);
  return response.data;
};

export const submitInterview = async (id, answers) => {
  const response = await api.put(`/interviews/${id}/submit`, { answers });
  return response.data;
};

export const saveInterviewProgress = async (id, currentQuestionIndex, answers) => {
  const response = await api.put(`/interviews/${id}/progress`, {
    currentQuestionIndex,
    answers,
  });
  return response.data;
};

export const evaluateInterviewSession = async (id) => {
  const response = await api.post(`/interviews/${id}/evaluate`);
  return response.data;
};

export const getInterviewHistory = async () => {
  const response = await api.get("/interviews/history");
  return response.data;
};
