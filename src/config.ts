import { latestLesson } from '@/data/lessons/registry'

// Firebase 設定（沿用原版 legacy/js/config.js，寫死）
export const firebaseConfig = {
  apiKey: 'AIzaSyA1LC4UkefoGzZDhM62c-vgdBW7BrM_Qps',
  authDomain: 'learning-9fd6c.firebaseapp.com',
  projectId: 'learning-9fd6c',
  storageBucket: 'learning-9fd6c.firebasestorage.app',
  messagingSenderId: '989349641284',
  appId: '1:989349641284:web:21fb236dbcf0c3ec27d011',
}

// 允許登入的 Email 白名單
export const allowedEmails = [
  'chipang59@gmail.com',
  'a950399@gmail.com',
  'olga59.wu@gmail.com',
  'chaoyafang@gmail.com',
  'perpledodo@gmail.com',
]

// 管理員（原版寫在 index.html）
export const adminEmails = ['chipang59@gmail.com', 'olga59.wu@gmail.com']

export interface LanguageModule {
  id: string
  abbr: string
  title: string
  link: string
  desc: string
  colorClass: string
  shadowClass: string
  bgCircleClass: string
  iconBgClass: string
  hoverTextClass: string
  actionColorClass: string
  tags: { text: string; class: string }[]
}

const latest = latestLesson()
const latestLessonTag = latest
  ? {
      text: `第${latest.no}課 ${latest.title}`,
      class: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
    }
  : null

// 大廳語言卡片（只保留泰文）
export const languageModules: LanguageModule[] = [
  {
    id: 'th',
    abbr: 'TH',
    title: '泰語學習機',
    link: '/thai',
    desc: '「聲調計算機」，輸入文字即刻分析高中低輔音規則。支援手寫描紅練習，輕鬆破解泰語聲調難關。',
    colorClass: 'bg-emerald-500',
    shadowClass: 'hover:shadow-emerald-200/50 dark:hover:shadow-emerald-900/30',
    bgCircleClass: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconBgClass: 'bg-emerald-100 dark:bg-emerald-900/50',
    hoverTextClass:
      'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
    actionColorClass: 'text-emerald-500',
    tags: [
      {
        text: '聲調計算',
        class:
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
      },
      {
        text: '手寫練習',
        class: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      },
    ],
  },
  // 新增：每週課程（標籤顯示最新一課）
  {
    id: 'lessons',
    abbr: '📘',
    title: '每週課程',
    link: '/lessons',
    desc: '每週泰語課的上課內容、練習與考試，下次上課前複習用。',
    colorClass: 'bg-indigo-500',
    shadowClass: 'hover:shadow-indigo-200/50 dark:hover:shadow-indigo-900/30',
    bgCircleClass: 'bg-indigo-50 dark:bg-indigo-900/20',
    iconBgClass: 'bg-indigo-100 dark:bg-indigo-900/50',
    hoverTextClass:
      'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
    actionColorClass: 'text-indigo-500',
    tags: [
      ...(latestLessonTag ? [latestLessonTag] : []),
      {
        text: '課前小考',
        class: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      },
    ],
  },
]
