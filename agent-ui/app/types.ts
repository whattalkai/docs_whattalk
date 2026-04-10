export interface Task {
  id: string;
  name: string;
  status: "idle" | "running" | "done" | "error";
  type: "assistant" | "tool" | "campaign" | "phone" | "general";
  createdAt: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ApiAction {
  id: string;
  method: string;
  endpoint: string;
  status: "pending" | "success" | "error";
  statusCode?: number;
  requestBody?: string;
  responseBody?: string;
  timestamp: string;
}

export interface Settings {
  autocallsApiKey: string;
}
