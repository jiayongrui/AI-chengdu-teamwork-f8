import type { Task } from "@/types/task"

// 初始示例任务（与页面展示一致）
export const demoTasksSeed = [
  { title: "奇点无限", status: "pool", ord: 1 },
  { title: "像素跃动", status: "pool", ord: 2 },

  { title: "矩阵数据", status: "sent", ord: 1 },
  { title: "云端畅想", status: "sent", ord: 2, note: "跟进提醒: 3天后" },

  { title: "深空探索", status: "replied", ord: 1 },

  { title: "未来智能", status: "interview", ord: 1 },
] satisfies Array<Pick<Task, "title" | "status" | "ord" | "note">>

export const LS_KEY = "career-icebreaker-demo-tasks"
