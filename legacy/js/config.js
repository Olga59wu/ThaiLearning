// 匯出 Firebase 設定
export const firebaseConfig = {
  apiKey: 'AIzaSyA1LC4UkefoGzZDhM62c-vgdBW7BrM_Qps',
  authDomain: 'learning-9fd6c.firebaseapp.com',
  projectId: 'learning-9fd6c',
  storageBucket: 'learning-9fd6c.firebasestorage.app',
  messagingSenderId: '989349641284',
  appId: '1:989349641284:web:21fb236dbcf0c3ec27d011',
}

// 匯出允許的 Email 白名單
export const allowedEmails = [
  'chipang59@gmail.com',
  'a950399@gmail.com',
  'olga59.wu@gmail.com',
  'chaoyafang@gmail.com',
  'perpledodo@gmail.com',
]

// 網站資訊（可選）
export const appInfo = {
  version: '1.0.0',
  title: '學習中心',
}

export const languageModules = [
  {
    id: 'th',
    abbr: 'TH',
    title: '泰語學習機',
    link: 'thai.html',
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
  {
    id: 'jp',
    abbr: 'JP',
    title: '日語學習機',
    link: 'japan.html',
    desc: '從五十音到日常會話。內建翻牌記憶遊戲與手寫練習，並完整收錄數字、日期、家人與形容詞等實用單字庫。',
    colorClass: 'bg-indigo-500',
    shadowClass: 'hover:shadow-indigo-200/50 dark:hover:shadow-indigo-900/30',
    bgCircleClass: 'bg-indigo-50 dark:bg-indigo-900/20',
    iconBgClass: 'bg-indigo-100 dark:bg-indigo-900/50',
    hoverTextClass:
      'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
    actionColorClass: 'text-indigo-500',
    tags: [
      {
        text: '翻牌遊戲',
        class:
          'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
      },
      {
        text: '生活單字',
        class:
          'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300',
      },
      {
        text: '手寫',
        class: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      },
    ],
  },
  {
    id: 'kr',
    abbr: 'KR',
    title: '韓語學習機',
    link: 'korean.html',
    desc: '獨家「韓字積木」拼字功能，視覺化學習子母音組合。特別收錄漢字/純韓雙套數字系統解析與收音特訓。',
    colorClass: 'bg-rose-500',
    shadowClass: 'hover:shadow-rose-200/50 dark:hover:shadow-rose-900/30',
    bgCircleClass: 'bg-rose-50 dark:bg-rose-900/20',
    iconBgClass: 'bg-rose-100 dark:bg-rose-900/50',
    hoverTextClass: 'group-hover:text-rose-600 dark:group-hover:text-rose-400',
    actionColorClass: 'text-rose-500',
    tags: [
      {
        text: '拼字積木',
        class:
          'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
      },
      {
        text: '雙套數字',
        class:
          'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
      },
    ],
  },
]