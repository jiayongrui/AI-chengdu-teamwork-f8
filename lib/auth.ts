import { getSupabaseClient } from "@/lib/supabase-client"
import { md5 } from "@/lib/md5"
import type { User } from "@/types/user"
import type { Task, TaskStatus } from "@/types/task"
import { demoTasksSeed } from "@/lib/demo-tasks"

export const LS_USER_KEY = "ci_user"
export const LS_TASKS_PREFIX = "ci_tasks_"

export function getLocalUser(): User | null {
  try {
    const raw = localStorage.getItem(LS_USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}
export function setLocalUser(u: User | null) {
  if (!u) {
    localStorage.removeItem(LS_USER_KEY)
    return
    }
  localStorage.setItem(LS_USER_KEY, JSON.stringify(u))
}

export async function signUp(username: string, password: string): Promise<User> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY")

  // 唯一用户名检查
  const { data: exists, error: existsErr } = await supabase.from("users").select("id").eq("username", username).maybeSingle()
  if (existsErr) throw existsErr
  if (exists) throw new Error("用户名已存在")

  const password_md5 = md5(password)
  const { data: created, error: insErr } = await supabase.from("users").insert({ username, password_md5 }).select("*").single()
  if (insErr) throw insErr
  const user = created as User

  // 为新用户初始化任务列表（拷贝 demo 种子）
  const toInsert: Array<Pick<Task, "title" | "status" | "ord" | "note"> & { user_id: string }> = demoTasksSeed.map((t) => ({
    title: t.title,
    status: t.status as TaskStatus,
    ord: t.ord,
    note: t.note ?? null,
    user_id: user.id,
  }))
  const { error: taskSeedErr } = await supabase.from("tasks").insert(toInsert)
  if (taskSeedErr) throw taskSeedErr

  return user
}

export async function signIn(username: string, password: string): Promise<User> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY")
  const { data: row, error } = await supabase.from("users").select("*").eq("username", username).maybeSingle()
  if (error) throw error
  if (!row) throw new Error("用户不存在")
  const ok = row.password_md5 === md5(password)
  if (!ok) throw new Error("用户名或密码错误")
  return { id: row.id, username: row.username, created_at: row.created_at }
}

export async function fetchTasksForUser(userId: string): Promise<Task[]> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY")
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("ord", { ascending: true })
  if (error) throw error
  return (data ?? []) as Task[]
}

export async function updateTaskForUser(taskId: string, patch: Partial<Pick<Task, "status" | "ord">>) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY")
  const { error } = await supabase.from("tasks").update(patch).eq("id", taskId)
  if (error) throw error
}

// local fallback (按用户维度)
export function getLocalTasks(userId: string): Task[] {
  const key = LS_TASKS_PREFIX + userId
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as Task[]) : []
  } catch {
    return []
  }
}
export function setLocalTasks(userId: string, tasks: Task[]) {
  const key = LS_TASKS_PREFIX + userId
  localStorage.setItem(key, JSON.stringify(tasks))
}
