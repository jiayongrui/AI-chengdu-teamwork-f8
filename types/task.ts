export type TaskStatus = "pool" | "sent" | "replied" | "interview"

export interface Task {
  id: string
  title: string
  status: TaskStatus
  ord: number
  note?: string | null
  created_at?: string
}
