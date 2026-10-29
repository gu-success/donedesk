'use strict';
// DoneDesk i18n — shared by renderer (<script>) and main process (require)
(function (root) {
  const zh = {
    'tab.tasks': '今日任务', 'tab.notes': '记事本', 'tab.history': '历史', 'h.title': '历史记录', 'h.search': '搜索历史任务', 'h.all': '清除日期', 'h.pick': '请选择日期', 'h.pickS': '选择一天后查看该日完成与结转情况', 'h.pickSub': '{n} 个有记录的日期', 'h.prev': '前一天', 'h.next': '后一天', 'h.done': '已完成', 'h.carried': '未完成 · 结转到 {d}', 'h.from': '从 {d} 结转', 'h.restore': '恢复到今天', 'h.restored': '已恢复到今天', 'h.more': '加载更多（剩余 {n} 条）', 'h.empty': '还没有历史记录', 'h.emptyS': '完成的任务会在第二天归档到这里', 'h.none': '没有匹配的记录', 'h.count': '共 {n} 条', 'h.dayStat': '完成 {d} · 结转 {c}', 'win.settings': '设置', 'win.pin': '窗口置顶', 'win.unpin': '取消置顶', 'win.min': '最小化', 'win.close': '隐藏到托盘',
    'today': '今天', 'empty.t': '今天还没有任务', 'empty.s': '在下方输入框写下第一件事吧', 'recur': '周期任务', 'recur.ph': '周期任务内容',
    'daily': '每天', 'weekly': '每周', 'monthly': '每月', 'urgent': '紧急', 'month.pre': '每月第', 'month.post': '日（超出当月天数取月末）', 'recur.add': '添加周期任务',
    'add.ph': '添加任务，回车保存', 'add.urgent': '标记紧急', 'add': '添加', 'add.expand': '添加任务', 'add.recur': '设为周期任务', 'add.recurNone': '不重复', 'add.recurOn': '周期：{s}', 'add.clearRecur': '取消周期', 'add.recurHint': '点底部「+」可为新任务设置周期',
    'v.setup': '设置记事本密码', 'v.setupSub': '记事本内容将使用 AES-256-GCM 加密保存在本机', 'v.warn': '密码无法找回！忘记密码将永久无法读取记事本内容。',
    'v.pw1': '设置密码', 'v.pw2': '再次输入密码', 'v.create': '创建加密记事本', 'v.creating': '正在创建…', 'v.mismatch': '两次输入的密码不一致',
    'v.locked': '记事本已锁定', 'v.lockedSub': '输入密码以查看笔记', 'v.pw': '输入密码', 'v.unlock': '解锁', 'v.unlocking': '解锁中…', 'v.forget': '忘记密码将无法恢复内容', 'v.timeout': '闲置超时，已自动锁定',
    'n.title': '笔记', 'n.new': '新建', 'n.lock': '锁定', 'n.back': '返回', 'n.del': '删除', 'n.titlePh': '标题', 'n.bodyPh': '开始书写…内容会自动加密保存',
    'n.count': '{n} 条 · 已加密', 'n.untitled': '（无标题）', 'n.blank': '空白笔记', 'n.enc': '已加密 · {t}', 'n.saved': '已加密保存 · {t}', 'n.saveFail': '保存失败：{e}', 'n.editing': '编辑中…', 'n.confirmDel': '永久删除这条笔记？',
    's.title': '设置', 's.appearance': '外观', 's.font': '界面字体', 's.font.system': '系统默认', 's.font.segoe': 'Segoe UI', 's.font.yahei': '微软雅黑', 's.font.pingfang': '苹方 / 冬青黑', 's.font.noto': 'Noto Sans CJK', 's.font.inter': 'Inter', 's.font.consolas': '等宽（Consolas）', 's.theme': '主题', 's.light': '浅色', 's.dark': '深色', 's.system': '跟随系统', 's.opacity': '窗口不透明度', 's.lang': '语言 / Language',
    's.window': '窗口', 's.top': '窗口始终置顶', 's.auto': '开机自动启动', 's.autoHint': '仅 Windows', 's.hotkey': '全局快捷键', 's.hotkeyFail': '{k} 注册失败', 's.hotkeyTip': '显示 / 隐藏窗口', 's.hotkeyBad': '可能已被其他程序占用，可通过托盘图标打开窗口',
    's.security': '记事本安全', 's.relock': '闲置自动锁定', 's.min': '{n} 分钟', 's.never': '从不（直到重启）', 's.cpw': '修改记事本密码', 's.cur': '当前密码', 's.newpw': '新密码', 's.newpw2': '再次输入新密码', 's.cpwBtn': '修改密码', 's.cpwing': '正在修改…', 's.cpwOk': '密码已修改', 's.cpwNeedVault': '请先解锁记事本，或在此输入当前密码即可修改', 's.mismatch': '两次输入的新密码不一致',
    's.foot': '数据仅保存在本机用户数据目录。关闭窗口会隐藏到系统托盘，退出请使用托盘菜单。', 's.close': '关闭',
    't.done': '标记为完成', 't.undone': '标记为未完成', 't.dbl': '双击编辑，拖动排序', 't.remind': '周期任务提醒时间', 't.carried': '从 {d} 结转', 't.unurgent': '取消紧急', 't.edit': '编辑', 't.del': '删除', 't.confirmDel': '删除“{t}”？',
    'r.del': '删除周期任务', 'r.confirmDel': '删除该周期任务？（已生成的今日任务保留）', 'r.next': '下次', 'r.monthly': '每月 {d} 日', 'r.sep': '、',
    'ring': '已完成 {d} / 共 {n}', 'remain': '剩余 {n} 项', 'wd': ['日', '一', '二', '三', '四', '五', '六'], 'wdPre': '星期',
    'tray.toggle': '显示/隐藏', 'tray.lock': '立即锁定记事本', 'tray.quit': '退出', 'notify.title': '任务提醒', 'ball.restore': '恢复窗口', 'bubble.allDone': '今日任务全部完成 🎉', 's.bubble': '悬浮球任务气泡', 's.bubbleHint': '最小化时在悬浮球旁轮播未完成任务', 's.bubbleSec': '气泡轮播间隔', 's.sec': '{n} 秒', 'ball.tip': 'DoneDesk · 单击恢复，拖动移动',
    'tab.recur': '周期', 'rp.title': '重复设置', 'rp.weekdays': '工作日', 'rp.weekends': '周末', 'rp.new': '新建周期任务', 'rp.edit': '编辑周期任务', 'rp.text': '任务内容', 'rp.once': '一次', 'rp.time': '提醒时间', 'rp.day': '每月日期', 'rp.dayN': '{n} 日', 'rp.week': '重复于', 'rp.cancel': '取消', 'rp.ok': '确定', 'rp.urgent': '紧急',
    'rc.title': '周期任务', 'rc.count': '{n} 条规则', 'rc.empty': '还没有周期任务', 'rc.emptyS': '点右下角 + 添加，或在今日输入栏左侧 + 设置重复', 'rc.pause': '暂停', 'rc.resume': '恢复', 'rc.paused': '已暂停', 'rc.added': '已添加到周期任务',
    'cele.t': '全部完成！', 'cele.s': '今天的任务都搞定了', 's.cele': '完成庆祝动画', 's.celeHint': '完成今天最后一项任务时播放', 'dlg.ok': '删除', 'dlg.cancel': '取消', 'add.clearChip': '取消重复',
    'hotkey.fail': '全局快捷键 {k} 注册失败（可能已被其他程序占用），可通过托盘图标显示窗口。',
  };
  const en = {
    'tab.tasks': 'Today', 'tab.notes': 'Notes', 'tab.history': 'History', 'h.title': 'History', 'h.search': 'Search past tasks', 'h.all': 'Clear date', 'h.pick': 'Pick a date', 'h.pickS': 'Choose a day to see what was done or carried', 'h.pickSub': '{n} days with records', 'h.prev': 'Previous day', 'h.next': 'Next day', 'h.done': 'Done', 'h.carried': 'Not done · carried to {d}', 'h.from': 'Carried over from {d}', 'h.restore': 'Restore to today', 'h.restored': 'Restored to today', 'h.more': 'Load more ({n} left)', 'h.empty': 'No history yet', 'h.emptyS': 'Completed tasks are archived here the next day', 'h.none': 'No matching tasks', 'h.count': '{n} items', 'h.dayStat': '{d} done · {c} carried', 'win.settings': 'Settings', 'win.pin': 'Always on top', 'win.unpin': 'Unpin', 'win.min': 'Minimize', 'win.close': 'Hide to tray',
    'today': 'Today', 'empty.t': 'No tasks yet today', 'empty.s': 'Type your first task in the box below', 'recur': 'Recurring', 'recur.ph': 'Recurring task',
    'daily': 'Daily', 'weekly': 'Weekly', 'monthly': 'Monthly', 'urgent': 'Urgent', 'month.pre': 'Day', 'month.post': 'of month (clamped to month end)', 'recur.add': 'Add recurring task',
    'add.ph': 'Add a task, press Enter', 'add.urgent': 'Mark urgent', 'add': 'Add', 'add.expand': 'Add a task', 'add.recur': 'Make recurring', 'add.recurNone': 'Does not repeat', 'add.recurOn': 'Repeats: {s}', 'add.clearRecur': 'Clear schedule', 'add.recurHint': 'Tap the + button below to schedule a new task',
    'v.setup': 'Set a notes password', 'v.setupSub': 'Notes are encrypted locally with AES-256-GCM', 'v.warn': 'The password cannot be recovered! If you forget it, your notes are lost forever.',
    'v.pw1': 'Password', 'v.pw2': 'Repeat password', 'v.create': 'Create encrypted notes', 'v.creating': 'Creating…', 'v.mismatch': 'Passwords do not match',
    'v.locked': 'Notes locked', 'v.lockedSub': 'Enter your password to view notes', 'v.pw': 'Password', 'v.unlock': 'Unlock', 'v.unlocking': 'Unlocking…', 'v.forget': 'Forgotten passwords cannot be recovered', 'v.timeout': 'Locked after inactivity',
    'n.title': 'Notes', 'n.new': 'New', 'n.lock': 'Lock', 'n.back': 'Back', 'n.del': 'Delete', 'n.titlePh': 'Title', 'n.bodyPh': 'Start writing… saved & encrypted automatically',
    'n.count': '{n} notes · encrypted', 'n.untitled': '(Untitled)', 'n.blank': 'Empty note', 'n.enc': 'Encrypted · {t}', 'n.saved': 'Encrypted & saved · {t}', 'n.saveFail': 'Save failed: {e}', 'n.editing': 'Editing…', 'n.confirmDel': 'Permanently delete this note?',
    's.title': 'Settings', 's.appearance': 'Appearance', 's.font': 'UI font', 's.font.system': 'System default', 's.font.segoe': 'Segoe UI', 's.font.yahei': 'Microsoft YaHei', 's.font.pingfang': 'PingFang / Hiragino', 's.font.noto': 'Noto Sans CJK', 's.font.inter': 'Inter', 's.font.consolas': 'Monospace (Consolas)', 's.theme': 'Theme', 's.light': 'Light', 's.dark': 'Dark', 's.system': 'System', 's.opacity': 'Window opacity', 's.lang': 'Language / 语言',
    's.window': 'Window', 's.top': 'Always on top', 's.auto': 'Launch at startup', 's.autoHint': 'Windows only', 's.hotkey': 'Global hotkey', 's.hotkeyFail': '{k} unavailable', 's.hotkeyTip': 'Show / hide window', 's.hotkeyBad': 'Probably taken by another app; use the tray icon instead',
    's.security': 'Notes security', 's.relock': 'Auto-lock when idle', 's.min': '{n} min', 's.never': 'Never (until restart)', 's.cpw': 'Change notes password', 's.cur': 'Current password', 's.newpw': 'New password', 's.newpw2': 'Repeat new password', 's.cpwBtn': 'Change password', 's.cpwing': 'Changing…', 's.cpwOk': 'Password changed', 's.cpwNeedVault': 'Unlock notes first, or enter the current password here to change it', 's.mismatch': 'New passwords do not match',
    's.foot': 'Data is stored only in your local user data folder. Closing the window hides it to the tray; quit from the tray menu.', 's.close': 'Close',
    't.done': 'Mark done', 't.undone': 'Mark not done', 't.dbl': 'Double-click to edit, drag to reorder', 't.remind': 'Reminder time', 't.carried': 'Carried over from {d}', 't.unurgent': 'Unmark urgent', 't.edit': 'Edit', 't.del': 'Delete', 't.confirmDel': 'Delete "{t}"?',
    'r.del': 'Delete recurring task', 'r.confirmDel': 'Delete this recurring task? (Today\'s generated task is kept)', 'r.next': 'next', 'r.monthly': 'Monthly on day {d}', 'r.sep': ', ',
    'ring': '{d} of {n} done', 'remain': '{n} left', 'wd': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], 'wdPre': '',
    'tray.toggle': 'Show / Hide', 'tray.lock': 'Lock notes now', 'tray.quit': 'Quit', 'notify.title': 'Task reminder', 'ball.restore': 'Restore window', 'bubble.allDone': 'All done for today 🎉', 's.bubble': 'Task bubble', 's.bubbleHint': 'Cycle open tasks next to the floating ball', 's.bubbleSec': 'Bubble interval', 's.sec': '{n} s', 'ball.tip': 'DoneDesk · click to restore, drag to move',
    'tab.recur': 'Recurring', 'rp.title': 'Repeat', 'rp.weekdays': 'Weekdays', 'rp.weekends': 'Weekends', 'rp.new': 'New recurring task', 'rp.edit': 'Edit recurring task', 'rp.text': 'Task', 'rp.once': 'Once', 'rp.time': 'Time', 'rp.day': 'Day of month', 'rp.dayN': 'Day {n}', 'rp.week': 'Repeat on', 'rp.cancel': 'Cancel', 'rp.ok': 'Confirm', 'rp.urgent': 'Urgent',
    'rc.title': 'Recurring', 'rc.count': '{n} rules', 'rc.empty': 'No recurring tasks yet', 'rc.emptyS': 'Tap + below to add one, or use the + in the Today add bar', 'rc.pause': 'Pause', 'rc.resume': 'Resume', 'rc.paused': 'Paused', 'rc.added': 'Added to Recurring',
    'cele.t': 'All done!', 'cele.s': 'Every task for today is complete', 's.cele': 'Celebration animation', 's.celeHint': 'Plays when you finish the last task of the day', 'dlg.ok': 'Delete', 'dlg.cancel': 'Cancel', 'add.clearChip': 'Remove repeat',
    'hotkey.fail': 'Global hotkey {k} could not be registered (maybe used by another app). Use the tray icon to show the window.',
  };
  // 主进程/模块抛出的中文错误 -> 英文
  const errs = {
    '任务内容不能为空': 'Task text cannot be empty', '任务不存在': 'Task not found', '重复 id': 'Duplicate id', '不能跨组排序': 'Cannot reorder across groups', '排序列表不完整': 'Incomplete order list',
    '无效的重复类型': 'Invalid repeat type', '时间格式应为 HH:MM': 'Time must be HH:MM', '请选择星期': 'Pick at least one weekday', '日期应为 1-31': 'Day must be 1-31', '找不到下一次': 'No next occurrence',
    '密码不能为空': 'Password cannot be empty', '密码错误': 'Wrong password', '不支持的记事本文件格式': 'Unsupported notes file format', '记事本已存在': 'Notes already exist', 
    '新密码不能为空': 'New password cannot be empty', '新密码不能与旧密码相同': 'New password must differ from the current one', '记事本文件不存在或损坏': 'Notes file missing or corrupted', '已锁定': 'Locked', '数据无效': 'Invalid data', '无效': 'Invalid value', '历史记录不存在': 'History item not found', '周期任务不存在': 'Recurring task not found', '未知设置': 'Unknown setting',
  };
  const dict = { zh, en };
  const resolveLang = (pref, sysLocale) => (pref === 'zh' || pref === 'en') ? pref : (/^zh/i.test(sysLocale || '') ? 'zh' : (sysLocale ? 'en' : 'zh'));
  function make(lang) {
    const d = dict[lang] || zh;
    const t = (k, p) => { let s = d[k] ?? zh[k] ?? k; if (p && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, (_, x) => (x in p ? p[x] : `{${x}}`)); return s; };
    t.lang = dict[lang] ? lang : 'zh';
    t.err = (m) => { if (t.lang !== 'en' || !m) return m; if (errs[m]) return errs[m]; const w = /^尝试过多，请 (\d+) 秒后再试$/.exec(m); return w ? `Too many attempts, try again in ${w[1]}s` : m; };
    return t;
  }
  const api = { dict, errs, make, resolveLang };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.I18N = api;
})(typeof window !== 'undefined' ? window : globalThis);
