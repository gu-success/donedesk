const { contextBridge, ipcRenderer } = require('electron');
const call = async (ch, ...a) => { const r = await ipcRenderer.invoke(ch, ...a); if (!r.ok) { const e = new Error(r.err); e.code = r.code; throw e; } return r.v; };
contextBridge.exposeInMainWorld('api', {
  call: (ch, ...a) => call(ch, ...a),
  resize: (edge) => ipcRenderer.send('win:resize', edge), resizeEnd: () => ipcRenderer.send('win:resizeEnd'),
  ball: (ch, v) => { if (['ball:drag', 'ball:click', 'ball:menu', 'bubble:click', 'bubble:mouse'].includes(ch)) ipcRenderer.send(ch, v); },
  on: (ch, fn) => { if (['tasks:changed', 'vault:locked', 'vault:locking', 'settings:changed', 'notice', 'ball:update', 'open:settings', 'win:shown'].includes(ch)) ipcRenderer.on(ch, (_e, v) => fn(v)); },
});
