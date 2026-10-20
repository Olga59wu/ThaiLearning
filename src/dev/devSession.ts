import type { User } from 'firebase/auth'

// 開發用跳過登入的假使用者（只會被 import.meta.env.DEV 內的動態 import 載入）
// 白名單、管理員檢查都視為通過；不是 Firebase 的使用者，auth.currentUser 仍是 null，services/db.ts 另外擋掉雲端讀寫
export const DEV_USER = {
  uid: 'dev-local',
  email: 'dev@local',
  displayName: '開發模式',
  emailVerified: true,
  photoURL: null,
} as unknown as User
