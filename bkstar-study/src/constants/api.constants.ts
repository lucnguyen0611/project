export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: "/login/",
  REGISTER: "/master/user/",
  REFRESH_TOKEN: "/login/get_new_token/",

  // User endpoints
  USER_PROFILE: "/user/profile/",
  UPDATE_PROFILE: "/master/user/:id",
  CHANGE_PASSWORD: "/master/user/change_password",

  // Class endpoints
  CLASSES: "/master/class/",
  CLASS_DETAIL: "/master/class/:id/",
  CLASS_UPDATE: "/master/class/:id/",
  CLASS_DELETE: "/master/class/:id/",

  // Exam Group endpoints
  EXAMS_GROUP: "/exam_group/:classId/",
  EXAM_GROUP_DETAIL: "/exam_group/:id/",
  EXAM_GROUP_CREATE: "/exam_group/",
  EXAM_GROUP_UPDATE: "/exam_group/:id/",
  EXAM_GROUP_DELETE: "/exam_group/:id/",

  // Exam Detail endpoints
  EXAMS: "/exam/:id",
  EXAM_DETAIL: "/exam/:id/",
  EXAM_CREATE: "/exam/",
  EXAM_UPDATE: "/exam/:id",
  EXAM_DELETE: "/exam/:id/",

  // Exam Result endpoints
  EXAM_RESULT_CREATE: "/exam_result/",
  EXAM_RESULT_UPDATE: "/exam_result/:id",





  EXAM_QUESTIONS: "/exams/:id/questions/",
  EXAM_RESULTS: "/exams/:id/results/",
} as const;

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://b1u9y178ok.execute-api.ap-southeast-1.amazonaws.com";
