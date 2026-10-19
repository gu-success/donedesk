'use strict';
// 悬浮球/气泡窗口定位：只改 x/y，宽高恒定，坐标取整。
// 不用 setPosition/getSize 累积：Windows 分数缩放（125%/150%）下 setPosition 会因 DIP↔像素取整让窗口逐次变大。
function moveFixed(win, x, y, w, h) {
  if (!win || win.isDestroyed()) return;
  win.setBounds({ x: Math.round(x), y: Math.round(y), width: w, height: h });
}
function lockSize(win, w, h) {
  win.setMinimumSize(w, h); win.setMaximumSize(w, h); win.setResizable(false);
}
// 拖动：以按下时的窗口位置 + 光标位移计算，不读取当前窗口尺寸
function dragStart(win, cursor) { const b = win.getBounds(); return { x0: b.x, y0: b.y, cx: cursor.x, cy: cursor.y }; }
function dragPos(st, cursor) { return { x: Math.round(st.x0 + cursor.x - st.cx), y: Math.round(st.y0 + cursor.y - st.cy) }; }
module.exports = { moveFixed, lockSize, dragStart, dragPos };
