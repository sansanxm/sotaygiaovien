import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FolderPlus,
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit3,
  Calendar,
  Copy,
  Printer,
  Sparkles,
  CheckCircle2,
  X,
  Check,
  BookOpen,
  ListTodo,
  List,
  Quote,
  Bold,
  Italic,
  FolderOpen,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { db } from '../db/db';
import type { NoteFolder, TeacherNote } from '../types';

const PRESET_TEMPLATES = [
  {
    label: '📋 Biên bản Họp hội đồng sư phạm',
    title: 'Biên bản Họp hội đồng sư phạm tháng ...',
    folderName: 'Họp hội đồng sư phạm',
    content: `## 🏛️ BIÊN BẢN HỌP HỘI ĐỒNG SƯ PHẠM
- **Thời gian**: ... giờ ... ngày .../.../2026
- **Địa điểm**: Hội trường / Phòng hội đồng
- **Chủ trì**: Thầy/Cô Hiệu trưởng
- **Thư ký**: ...
- **Thành phần**: Toàn thể cán bộ, giáo viên, nhân viên nhà trường.

### I. NỘI DUNG CUỘC HỌP
1. **Đánh giá công tác tháng trước**:
   - Ưu điểm: ...
   - Hạn chế & tồn đọng: ...

2. **Triển khai kế hoạch công tác tháng tới**:
   - Chuyên môn giảng dạy: ...
   - Công tác chủ nhiệm & quản lý nề nếp: ...
   - Hoạt động đoàn thể & phong trào: ...

3. **Ý kiến đóng góp & thảo luận**:
   - ...

### II. KẾT LUẬN VÀ PHÂN CÔNG NHIỆM VỤ
- [ ] Nhiệm vụ 1: ... (Hạn chót: ...)
- [ ] Nhiệm vụ 2: ... (Hạn chót: ...)
- [ ] Hoàn thiện hồ sơ giáo án và sổ điểm trước ngày ...`,
  },
  {
    label: '📚 Biên bản Sinh hoạt chuyên môn',
    title: 'Biên bản Sinh hoạt chuyên môn Tổ ... - Tuần ...',
    folderName: 'Sinh hoạt chuyên môn',
    content: `## 📚 BIÊN BẢN SINH HOẠT TỔ CHUYÊN MÔN
- **Thời gian**: ... ngày .../.../2026
- **Tổ chuyên môn**: ...
- **Chủ trì**: Tổ trưởng chuyên môn
- **Thành viên tham dự**: ...

### I. NỘI DUNG SINH HOẠT
1. **Nghiên cứu bài học / Thống nhất nội dung giảng dạy**:
   - Bài học / Chuyên đề: ...
   - Phương pháp dạy học tích cực áp dụng: ...
   - Ứng dụng công nghệ thông tin & thiết bị dạy học: ...

2. **Thảo luận về phương pháp kiểm tra, đánh giá học sinh**:
   - Rút kinh nghiệm các tiết dạy tuần qua: ...
   - Thống nhất ma trận đề và nội dung ôn tập: ...

### II. PHÂN CÔNG THỰC HIỆN
- [ ] Giáo viên dạy thể nghiệm: Thầy/Cô ... (Tiết ..., Lớp ...)
- [ ] Chuẩn bị kế hoạch bài dạy & học liệu: ...`,
  },
  {
    label: '👨‍👩‍👧‍👦 Trao đổi & Gặp gỡ phụ huynh',
    title: 'Ghi chép Trao đổi với Phụ huynh học sinh ...',
    folderName: 'Gặp gỡ & trao đổi phụ huynh',
    content: `## 👨‍👩‍👧‍👦 BIÊN BẢN TRAO ĐỔI VỚI PHỤ HUYNH
- **Thời gian**: ... ngày .../.../2026
- **Hình thức**: Trực tiếp tại trường / Qua điện thoại / Zalo
- **Học sinh**: ... (Lớp ...)
- **Phụ huynh (Bố/Mẹ)**: ... (SĐT: ...)

### I. NỘI DUNG TRAO ĐỔI
1. **Tình hình học tập & rèn luyện của học sinh**:
   - Tinh thần học tập trên lớp: ...
   - Kết quả các bài kiểm tra gần nhất: ...
   - Nề nếp kỷ luật & mối quan hệ bạn bè: ...

2. **Ý kiến & phản hồi từ phía gia đình**:
   - Tình hình sinh hoạt và tự học ở nhà: ...
   - Tâm tư, nguyện vọng của phụ huynh: ...

### II. BIỆN PHÁP PHỐI HỢP GIỮA GIA ĐÌNH VÀ NHÀ TRƯỜNG
- [ ] Gia đình phối hợp nhắc nhở học sinh tự học 2 tiếng mỗi tối.
- [ ] Giáo viên chủ nhiệm cập nhật tình hình học tập hàng tuần qua Zalo.`,
  },
  {
    label: '📝 Kế hoạch & Công tác tuần',
    title: 'Kế hoạch công tác Tuần ... (Từ ... đến ...)',
    folderName: 'Kế hoạch công tác tuần',
    content: `## 📝 KẾ HOẠCH CÔNG TÁC TUẦN
- **Thời gian**: Từ ngày .../... đến ngày .../.../2026
- **Chủ đề tuần**: ...

### I. CÁC CÔNG VIỆC TRỌNG TÂM
- [ ] Hoàn thành giáo án và lịch báo giảng tuần mới.
- [ ] Kiểm tra nề nếp và sổ đầu bài lớp chủ nhiệm.
- [ ] Thu và chốt thu - chi quỹ lớp tháng ...
- [ ] Chấm và trả bài kiểm tra định kỳ môn ...

### II. LỊCH CÔNG TÁC TRONG TUẦN
- **Thứ Hai**: Chào cờ đầu tuần, sinh hoạt lớp.
- **Thứ Ba**: ...
- **Thứ Tư**: Sinh hoạt tổ chuyên môn (14h00).
- **Thứ Năm**: ...
- **Thứ Sáu**: ...
- **Thứ Bảy**: Tổng kết nề nếp tuần, sinh hoạt cuối tuần.

### III. GHI CHÚ PHÁT SINH
- ...`,
  },
];

const FOLDER_COLORS = [
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#64748b', // Slate
];

const FOLDER_ICONS = ['🏛️', '📚', '👨‍👩‍👧‍👦', '📝', '💡', '📌', '⭐', '📂', '🎯', '📖', '🔔', '💼'];

export const TeacherNotebook: React.FC = () => {
  const { triggerConfetti, user, syncWithCloud } = useApp();

  // State
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [notes, setNotes] = useState<TeacherNote[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all'); // 'all' | 'pinned' | folder.id
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Folder Modal
  const [showFolderModal, setShowFolderModal] = useState<boolean>(false);
  const [editingFolder, setEditingFolder] = useState<NoteFolder | null>(null);
  const [folderName, setFolderName] = useState<string>('');
  const [folderIcon, setFolderIcon] = useState<string>('📂');
  const [folderColor, setFolderColor] = useState<string>('#ec4899');

  // Mobile View State ('folders' | 'list' | 'editor')
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list');

  // Editor Auto-save Status
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const saveTimeoutRef = useRef<any>(null);

  // Load Data
  const loadData = async () => {
    try {
      const dbFolders = await db.noteFolders.toArray();
      const dbNotes = await db.teacherNotes.toArray();
      setFolders(dbFolders);
      setNotes(dbNotes);

      // Auto-select first note if none selected
      if (!selectedNoteId && dbNotes.length > 0) {
        setSelectedNoteId(dbNotes[0].id);
      }
    } catch (err) {
      console.error('Error loading notebook data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        // Folder filter
        if (selectedFolderId === 'pinned') {
          if (!note.isPinned) return false;
        } else if (selectedFolderId !== 'all') {
          if (note.folderId !== selectedFolderId) return false;
        }

        // Tag filter
        if (selectedTag && (!note.tags || !note.tags.includes(selectedTag))) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = note.title.toLowerCase().includes(q);
          const matchContent = note.content.toLowerCase().includes(q);
          const matchTag = note.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchContent && !matchTag) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned notes first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // Then by updated date desc
        return new Date(b.updatedAt || b.date).getTime() - new Date(a.updatedAt || a.date).getTime();
      });
  }, [notes, selectedFolderId, selectedTag, searchQuery]);

  // Currently Selected Note
  const currentNote = useMemo(() => {
    return notes.find((n) => n.id === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  // All unique tags across all notes
  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      n.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [notes]);

  // Count notes per folder
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = { all: notes.length, pinned: notes.filter((n) => n.isPinned).length };
    folders.forEach((f) => {
      counts[f.id] = notes.filter((n) => n.folderId === f.id).length;
    });
    return counts;
  }, [notes, folders]);

  // Folder Actions
  const handleOpenCreateFolder = () => {
    setEditingFolder(null);
    setFolderName('');
    setFolderIcon('📂');
    setFolderColor(FOLDER_COLORS[0]);
    setShowFolderModal(true);
  };

  const handleOpenEditFolder = (folder: NoteFolder, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderIcon(folder.icon || '📂');
    setFolderColor(folder.color || FOLDER_COLORS[0]);
    setShowFolderModal(true);
  };

  const handleSaveFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    if (editingFolder) {
      const updated: NoteFolder = {
        ...editingFolder,
        name: folderName.trim(),
        icon: folderIcon,
        color: folderColor,
        updatedAt: new Date().toISOString(),
      };
      await db.noteFolders.put(updated);
    } else {
      const newFolder: NoteFolder = {
        id: `folder-${Date.now()}`,
        name: folderName.trim(),
        icon: folderIcon,
        color: folderColor,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.noteFolders.add(newFolder);
      setSelectedFolderId(newFolder.id);
    }

    setShowFolderModal(false);
    await loadData();
    triggerConfetti();
    if (user && navigator.onLine) syncWithCloud('upload');
  };

  const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      window.confirm(
        'Bạn có chắc chắn muốn xóa thư mục này? Các ghi chép bên trong sẽ được chuyển về "Ghi chú chung".'
      )
    ) {
      await db.noteFolders.delete(folderId);
      // Move notes to default folder or keep without folder
      const notesInFolder = notes.filter((n) => n.folderId === folderId);
      for (const n of notesInFolder) {
        await db.teacherNotes.update(n.id, { folderId: 'folder-ghi-chu-chung' });
      }
      if (selectedFolderId === folderId) {
        setSelectedFolderId('all');
      }
      await loadData();
      if (user && navigator.onLine) syncWithCloud('upload');
    }
  };

  // Note Actions
  const handleCreateNote = async (template?: (typeof PRESET_TEMPLATES)[0]) => {
    let targetFolderId = selectedFolderId !== 'all' && selectedFolderId !== 'pinned' ? selectedFolderId : '';

    // If template specified, find corresponding folder or default to first folder
    if (template) {
      const matched = folders.find((f) => f.name.toLowerCase().includes(template.folderName.toLowerCase()));
      if (matched) targetFolderId = matched.id;
    }

    if (!targetFolderId && folders.length > 0) {
      targetFolderId = folders[0].id;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const newNote: TeacherNote = {
      id: `note-${Date.now()}`,
      folderId: targetFolderId || 'folder-ghi-chu-chung',
      title: template ? template.title : 'Ghi chép mới ngày ' + new Date().toLocaleDateString('vi-VN'),
      content: template ? template.content : '',
      date: todayStr,
      tags: template ? ['Họp', 'Quan trọng'] : [],
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.teacherNotes.add(newNote);
    await loadData();
    setSelectedNoteId(newNote.id);
    setMobileView('editor');
    if (user && navigator.onLine) syncWithCloud('upload');
  };

  const handleUpdateNote = (field: keyof TeacherNote, value: any) => {
    if (!currentNote) return;

    const updated = {
      ...currentNote,
      [field]: value,
      updatedAt: new Date().toISOString(),
    };

    // Update local state immediately for snappy typing
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    setSaveStatus('saving');

    // Debounced database write
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await db.teacherNotes.put(updated);
      setSaveStatus('saved');
      if (user && navigator.onLine) syncWithCloud('upload');
    }, 600);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa ghi chép này không?')) {
      await db.teacherNotes.delete(noteId);
      const remaining = notes.filter((n) => n.id !== noteId);
      setNotes(remaining);
      if (selectedNoteId === noteId) {
        setSelectedNoteId(remaining.length > 0 ? remaining[0].id : null);
      }
      setMobileView('list');
      if (user && navigator.onLine) syncWithCloud('upload');
    }
  };

  const handleTogglePin = async (note: TeacherNote, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = { ...note, isPinned: !note.isPinned, updatedAt: new Date().toISOString() };
    await db.teacherNotes.put(updated);
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    if (user && navigator.onLine) syncWithCloud('upload');
  };

  // Editor formatting insert helpers
  const insertTextAtCursor = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('note-editor-textarea') as HTMLTextAreaElement;
    if (!textarea || !currentNote) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const oldContent = currentNote.content || '';
    const selected = oldContent.substring(start, end);
    const replacement = prefix + selected + suffix;
    const newContent = oldContent.substring(0, start) + replacement + oldContent.substring(end);

    handleUpdateNote('content', newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  // Print Note
  const handlePrintNote = () => {
    if (!currentNote) return;
    const folder = folders.find((f) => f.id === currentNote.folderId);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${currentNote.title}</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; padding: 40px; color: #111; line-height: 1.6; }
          h1 { font-size: 20pt; text-align: center; margin-bottom: 5px; text-transform: uppercase; }
          .meta { text-align: center; font-style: italic; color: #555; margin-bottom: 25px; font-size: 11pt; }
          .content { font-size: 13pt; white-space: pre-wrap; word-break: break-word; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>${currentNote.title}</h1>
        <div class="meta">Thư mục: ${folder ? folder.name : 'Ghi chú'} • Ngày ghi: ${new Date(
      currentNote.date
    ).toLocaleDateString('vi-VN')}</div>
        <div class="content">${currentNote.content}</div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Copy Note content
  const handleCopyNote = () => {
    if (!currentNote) return;
    navigator.clipboard.writeText(`${currentNote.title}\n\n${currentNote.content}`);
    triggerConfetti();
    alert('✅ Đã sao chép nội dung ghi chép vào bộ nhớ tạm!');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* 1. Header & Quick Templates */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border theme-card-border shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl theme-avatar flex items-center justify-center text-2xl shadow-xs shrink-0">
              📖
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                Sổ Ghi Chép Giáo Viên
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 border border-pink-200">
                  {notes.length} ghi chép
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Quản lý biên bản họp hội đồng, sinh hoạt chuyên môn, trao đổi phụ huynh & kế hoạch tuần
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCreateNote()}
              className="px-4 py-2.5 rounded-2xl theme-btn-primary font-black text-xs flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Viết Ghi Chép Mới
            </button>
          </div>
        </div>

        {/* Quick Template Selector Chips */}
        <div className="mt-4 pt-3 border-t theme-card-border flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          <span className="text-xs font-black text-slate-500 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Mẫu biên bản nhanh:
          </span>
          {PRESET_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              onClick={() => handleCreateNote(tmpl)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-pink-50 hover:text-pink-700 border theme-card-border text-xs font-bold text-slate-700 shrink-0 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <span>{tmpl.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main 3-Column Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-280px)] min-h-[580px]">
        
        {/* Column 1: Folders List (lg:col-span-3) */}
        <div
          className={`lg:col-span-3 bg-white rounded-3xl border theme-card-border shadow-xs flex flex-col overflow-hidden ${
            mobileView === 'editor' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-3.5 border-b theme-card-border flex items-center justify-between bg-slate-50/70">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 theme-text" /> Danh mục thư mục
            </span>
            <button
              onClick={handleOpenCreateFolder}
              className="p-1.5 rounded-xl hover:bg-white text-slate-600 hover:theme-text transition-colors cursor-pointer"
              title="Thêm thư mục mới"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Folder Buttons */}
          <div className="p-2 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
            {/* All Notes */}
            <button
              onClick={() => {
                setSelectedFolderId('all');
                setSelectedTag(null);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedFolderId === 'all' && !selectedTag
                  ? 'theme-btn-primary shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="text-base">📑</span>
                <span className="truncate">Tất cả ghi chép</span>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                  selectedFolderId === 'all' && !selectedTag
                    ? 'bg-white/30 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {folderCounts.all || 0}
              </span>
            </button>

            {/* Pinned Notes */}
            <button
              onClick={() => {
                setSelectedFolderId('pinned');
                setSelectedTag(null);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedFolderId === 'pinned'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="text-base">📌</span>
                <span className="truncate">Ghim quan trọng</span>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                  selectedFolderId === 'pinned' ? 'bg-white/30 text-white' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {folderCounts.pinned || 0}
              </span>
            </button>

            <div className="pt-2 pb-1 px-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Thư mục cá nhân</span>
            </div>

            {/* Custom Folders */}
            {folders.map((folder) => {
              const isSelected = selectedFolderId === folder.id;
              const count = folderCounts[folder.id] || 0;
              return (
                <div
                  key={folder.id}
                  onClick={() => {
                    setSelectedFolderId(folder.id);
                    setSelectedTag(null);
                  }}
                  className={`group w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                    isSelected ? 'theme-soft-bg theme-text font-black shadow-2xs' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-base">{folder.icon || '📂'}</span>
                    <span className="truncate">{folder.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                        isSelected ? 'bg-white theme-text border theme-card-border' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {count}
                    </span>

                    {/* Edit / Delete actions on hover */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={(e) => handleOpenEditFolder(folder, e)}
                        className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800"
                        title="Sửa thư mục"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteFolder(folder.id, e)}
                        className="p-1 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600"
                        title="Xóa thư mục"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tags list at bottom of folder panel */}
          {allTags.length > 0 && (
            <div className="p-3 border-t theme-card-border bg-slate-50/50">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                Thẻ gắn kèm (#tags)
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                      selectedTag === tag
                        ? 'bg-slate-800 text-white'
                        : 'bg-white text-slate-600 border theme-card-border hover:bg-slate-100'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Column 2: Note List (lg:col-span-4) */}
        <div
          className={`lg:col-span-4 bg-white rounded-3xl border theme-card-border shadow-xs flex flex-col overflow-hidden ${
            mobileView === 'editor' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Search bar */}
          <div className="p-3 border-b theme-card-border bg-slate-50/70">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm tiêu đề, nội dung, #thẻ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border theme-card-border text-xs font-semibold focus:outline-hidden focus:border-pink-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Notes Cards List */}
          <div className="p-2 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
            {filteredNotes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <FileText className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
                <span className="text-xs font-bold">Chưa có ghi chép nào</span>
                <p className="text-[11px] text-slate-400 mt-1">Bấm nút "Viết Ghi Chép Mới" để tạo ngay</p>
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = selectedNoteId === note.id;
                const folder = folders.find((f) => f.id === note.folderId);
                const snippet = note.content ? note.content.replace(/[#*`_\[\]-]/g, '').trim().slice(0, 90) : 'Chưa có nội dung...';

                return (
                  <div
                    key={note.id}
                    onClick={() => {
                      setSelectedNoteId(note.id);
                      setMobileView('editor');
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'border-pink-400 bg-pink-50/40 shadow-xs'
                        : 'border-slate-100 hover:border-pink-200 hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Top row: Title + Pin */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 leading-snug line-clamp-2">
                        {note.title || 'Chưa đặt tiêu đề'}
                      </h3>
                      <button
                        onClick={(e) => handleTogglePin(note, e)}
                        className={`p-1 rounded-lg shrink-0 transition-colors ${
                          note.isPinned
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300 hover:text-amber-500 opacity-0 group-hover:opacity-100'
                        }`}
                        title={note.isPinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
                      >
                        <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-amber-500 text-amber-500' : ''}`} />
                      </button>
                    </div>

                    {/* Snippet preview */}
                    <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-1 leading-relaxed">
                      {snippet}
                    </p>

                    {/* Meta row: Date + Folder tag */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(note.date).toLocaleDateString('vi-VN')}
                      </span>

                      {folder && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 truncate max-w-[120px]">
                          {folder.icon} {folder.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: Note Editor / Reader (lg:col-span-5) */}
        <div
          className={`lg:col-span-5 bg-white rounded-3xl border theme-card-border shadow-xs flex flex-col overflow-hidden ${
            mobileView === 'list' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {currentNote ? (
            <>
              {/* Editor Top Bar */}
              <div className="p-3 border-b theme-card-border bg-slate-50/70 flex items-center justify-between gap-2">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setMobileView('list')}
                  className="lg:hidden p-1.5 rounded-xl bg-white border theme-card-border text-xs font-bold flex items-center gap-1"
                >
                  ← Danh sách
                </button>

                {/* Auto-save status */}
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  {saveStatus === 'saving' ? (
                    <span className="text-amber-500 animate-pulse">● Đang lưu...</span>
                  ) : (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Đã lưu Cloud
                    </span>
                  )}
                </span>

                {/* Actions: Print, Copy, Pin, Delete */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrintNote}
                    className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border theme-card-border transition-colors cursor-pointer shadow-2xs"
                    title="In biên bản / Xuất PDF"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCopyNote}
                    className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border theme-card-border transition-colors cursor-pointer shadow-2xs"
                    title="Sao chép nội dung"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleTogglePin(currentNote)}
                    className={`p-2 rounded-xl bg-white hover:bg-slate-100 border theme-card-border transition-colors cursor-pointer shadow-2xs ${
                      currentNote.isPinned ? 'text-amber-500' : 'text-slate-400'
                    }`}
                    title={currentNote.isPinned ? 'Bỏ ghim' : 'Ghim ghi chép'}
                  >
                    <Pin className={`w-4 h-4 ${currentNote.isPinned ? 'fill-amber-500' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(currentNote.id)}
                    className="p-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 transition-colors cursor-pointer shadow-2xs"
                    title="Xóa ghi chép"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Note Metadata Bar */}
              <div className="p-3 border-b theme-card-border bg-white grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Folder Selector */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400 shrink-0">Thư mục:</span>
                  <select
                    value={currentNote.folderId}
                    onChange={(e) => handleUpdateNote('folderId', e.target.value)}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-50 border theme-card-border font-bold text-slate-700 focus:outline-hidden"
                  >
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.icon} {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Picker */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400 shrink-0">Ngày ghi:</span>
                  <input
                    type="date"
                    value={currentNote.date}
                    onChange={(e) => handleUpdateNote('date', e.target.value)}
                    className="flex-1 py-1 px-2.5 rounded-xl bg-slate-50 border theme-card-border font-bold text-slate-700 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Formatting Toolbar */}
              <div className="px-3 py-1.5 border-b theme-card-border bg-slate-50/50 flex items-center gap-1 overflow-x-auto custom-scrollbar">
                <button
                  onClick={() => insertTextAtCursor('**', '**')}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600 font-bold"
                  title="In đậm (**text**)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => insertTextAtCursor('*', '*')}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600 italic"
                  title="In nghiêng (*text*)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => insertTextAtCursor('## ')}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600 font-bold text-xs"
                  title="Tiêu đề mục (##)"
                >
                  H2
                </button>
                <button
                  onClick={() => insertTextAtCursor('### ')}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600 font-bold text-xs"
                  title="Tiêu đề phụ (###)"
                >
                  H3
                </button>
                <button
                  onClick={() => insertTextAtCursor('- ')}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600"
                  title="Danh sách gạch đầu dòng (- )"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => insertTextAtCursor('- [ ] ')}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600"
                  title="Danh sách việc cần làm (- [ ] )"
                >
                  <ListTodo className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => insertTextAtCursor('> ')}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600"
                  title="Trích dẫn (> )"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => insertTextAtCursor('\n---\n')}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600 text-xs font-bold"
                  title="Đường kẻ phân cách (---)"
                >
                  —
                </button>
              </div>

              {/* Title & Body Inputs */}
              <div className="p-4 flex-1 flex flex-col overflow-hidden space-y-3">
                {/* Title Input */}
                <input
                  type="text"
                  placeholder="Nhập tiêu đề cuộc họp / ghi chép..."
                  value={currentNote.title}
                  onChange={(e) => handleUpdateNote('title', e.target.value)}
                  className="w-full text-base sm:text-lg font-black text-slate-900 focus:outline-hidden placeholder:text-slate-300 border-b pb-2 border-slate-100"
                />

                {/* Content Textarea */}
                <textarea
                  id="note-editor-textarea"
                  placeholder="Nhập nội dung biên bản, ý kiến thảo luận, nhiệm vụ được giao..."
                  value={currentNote.content}
                  onChange={(e) => handleUpdateNote('content', e.target.value)}
                  className="w-full flex-1 resize-none font-sans text-xs sm:text-sm text-slate-700 leading-relaxed focus:outline-hidden custom-scrollbar bg-transparent"
                />
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <BookOpen className="w-12 h-12 mb-3 stroke-1 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-700">Chọn hoặc tạo một ghi chép để bắt đầu</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                Tất cả các ghi chép và biên bản sẽ được tự động lưu trữ và đồng bộ hóa an toàn lên Cloud.
              </p>
              <button
                onClick={() => handleCreateNote()}
                className="mt-4 px-4 py-2 rounded-2xl theme-btn-primary font-black text-xs flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <Plus className="w-4 h-4" /> Viết Ghi Chép Mới
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 3. Create / Edit Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border theme-card-border space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-800">
                {editingFolder ? 'Chỉnh Sửa Thư Mục' : 'Tạo Thư Mục Mới'}
              </h3>
              <button
                onClick={() => setShowFolderModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFolder} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Tên thư mục</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Họp hội đồng, Sinh hoạt chuyên môn..."
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border theme-card-border text-xs font-bold focus:outline-hidden focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Biểu tượng (Icon)</label>
                <div className="flex flex-wrap gap-2">
                  {FOLDER_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFolderIcon(icon)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all cursor-pointer ${
                        folderIcon === icon ? 'border-pink-500 bg-pink-50 scale-110 shadow-xs' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Màu sắc chủ đạo</label>
                <div className="flex items-center gap-2">
                  {FOLDER_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setFolderColor(col)}
                      style={{ backgroundColor: col }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        folderColor === col ? 'ring-3 ring-pink-300 scale-110' : ''
                      }`}
                    >
                      {folderColor === col && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl theme-btn-primary font-black text-xs shadow-xs cursor-pointer active:scale-95"
                >
                  {editingFolder ? 'Lưu Thay Đổi' : 'Tạo Thư Mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
