const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

app.name = 'Sổ Tay Giáo Viên 4.0';
if (app.setName) {
  app.setName('Sổ Tay Giáo Viên 4.0');
}

let mainWindow = null;

function setAppMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac
      ? [
          {
            label: 'Sổ Tay Giáo Viên 4.0',
            submenu: [
              { role: 'about', label: 'Về Sổ Tay Giáo Viên 4.0' },
              { type: 'separator' },
              { role: 'services', label: 'Dịch vụ' },
              { type: 'separator' },
              { role: 'hide', label: 'Ẩn Sổ Tay Giáo Viên 4.0' },
              { role: 'hideOthers', label: 'Ẩn các ứng dụng khác' },
              { role: 'unhide', label: 'Hiện tất cả' },
              { type: 'separator' },
              { role: 'quit', label: 'Thoát Sổ Tay Giáo Viên 4.0' },
            ],
          },
        ]
      : []),
    {
      label: 'Chỉnh sửa',
      submenu: [
        { role: 'undo', label: 'Hoàn tác' },
        { role: 'redo', label: 'Làm lại' },
        { type: 'separator' },
        { role: 'cut', label: 'Cắt' },
        { role: 'copy', label: 'Sao chép' },
        { role: 'paste', label: 'Dán' },
        { role: 'selectAll', label: 'Chọn tất cả' },
      ],
    },
    {
      label: 'Hiển thị',
      submenu: [
        { role: 'reload', label: 'Tải lại' },
        { role: 'forceReload', label: 'Tải lại toàn bộ' },
        { role: 'toggleDevTools', label: 'Công cụ phát triển' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Thu phóng mặc định' },
        { role: 'zoomIn', label: 'Phóng to' },
        { role: 'zoomOut', label: 'Thu nhỏ' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toàn màn hình' },
      ],
    },
    {
      label: 'Cửa sổ',
      submenu: [
        { role: 'minimize', label: 'Thu nhỏ cửa sổ' },
        { role: 'zoom', label: 'Phóng to cửa sổ' },
        ...(isMac
          ? [
              { type: 'separator' },
              { role: 'front', label: 'Đưa lên trên cùng' },
            ]
          : [{ role: 'close', label: 'Đóng' }]),
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'Sổ tay Giáo viên 4.0',
    icon: path.join(__dirname, '../build/icon.png'),
    backgroundColor: '#FFF5F7',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  setAppMenu();

  if (app.isPackaged) {
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath).catch(() => {
      mainWindow.loadFile(path.join(app.getAppPath(), 'dist/index.html'));
    });
  } else {
    const devUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
    mainWindow.loadURL(devUrl).catch(() => {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

