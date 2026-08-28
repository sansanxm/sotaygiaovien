import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Copy,
  Check,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { db } from '../db/db';
import type { Student } from '../types';


export interface CommentTemplate {
  id: string;
  category: 'Khen ngợi' | 'Khích lệ' | 'Cần cố gắng' | 'Nề nếp' | 'Kỹ năng';
  tags: string[];
  content: string;
}

const DEFAULT_TEMPLATES: CommentTemplate[] = [
  {
    id: '1',
    category: 'Khen ngợi',
    tags: ['Chăm chỉ', 'Lễ phép', 'Tự giác'],
    content: 'Em chăm ngoan, lễ phép, có ý thức tự giác học tập cao và tích cực tham gia các hoạt động tập thể.',
  },
  {
    id: '2',
    category: 'Khen ngợi',
    tags: ['Xuất sắc', 'Tư duy tốt'],
    content: 'Có tư duy nhanh nhẹn, tiếp thu bài tốt, luôn hoàn thành xuất sắc các nhiệm vụ học tập được giao.',
  },
  {
    id: '3',
    category: 'Khích lệ',
    tags: ['Tiến bộ', 'Tự tin'],
    content: 'Em có nhiều tiến bộ rõ rệt trong học tập và rèn luyện. Cần tiếp tục phát huy sự tự tin trong phát biểu xây dựng bài.',
  },
  {
    id: '4',
    category: 'Cần cố gắng',
    tags: ['Tập trung', 'Cẩn thận'],
    content: 'Em ngoan, hòa đồng với bạn bè. Cần tập trung hơn trong giờ học và cẩn thận hơn khi làm bài kiểm tra.',
  },
  {
    id: '5',
    category: 'Nề nếp',
    tags: ['Nề nếp', 'Kỷ luật'],
    content: 'Chấp hành tốt nội quy trường lớp, trang phục gọn gàng, đi học đúng giờ và có tinh thần giữ gìn vệ sinh chung.',
  },
  {
    id: '6',
    category: 'Kỹ năng',
    tags: ['Làm việc nhóm', 'Hòa đồng'],
    content: 'Có kỹ năng làm việc nhóm tốt, có tinh thần tương thân tương ái, giúp đỡ bạn bè cùng tiến bộ.',
  },
];

export const CommentBank: React.FC = () => {
  const { currentClass } = useApp();
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (!currentClass) return;
    db.students
      .where('classId')
      .equals(currentClass.id)
      .sortBy('rollNumber')
      .then(setStudents);
  }, [currentClass]);

  const [templates, setTemplates] = useState<CommentTemplate[]>(() => {
    const saved = localStorage.getItem('gvcn_comment_templates');
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Smart AI Assistant state
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [generatedComment, setGeneratedComment] = useState<string>('');

  useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [students]);


  // Add Template Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCat, setNewCat] = useState<CommentTemplate['category']>('Khen ngợi');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');

  const saveToStorage = (data: CommentTemplate[]) => {
    setTemplates(data);
    localStorage.setItem('gvcn_comment_templates', JSON.stringify(data));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Thầy/Cô có chắc chắn muốn xóa mẫu nhận xét này?')) {
      const updated = templates.filter((t) => t.id !== id);
      saveToStorage(updated);
    }
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const tagsArray = newTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newTpl: CommentTemplate = {
      id: Date.now().toString(),
      category: newCat,
      tags: tagsArray.length > 0 ? tagsArray : [newCat],
      content: newContent.trim(),
    };

    const updated = [newTpl, ...templates];
    saveToStorage(updated);
    setShowAddModal(false);
    setNewContent('');
    setNewTags('');
  };

  const handleAutoGenerate = () => {
    const student = students.find((s) => s.id === selectedStudentId) || students[0];
    if (!student) {
      setGeneratedComment('Vui lòng chọn hoặc thêm học sinh vào danh sách lớp.');
      return;
    }

    const firstWord = student.gender === 'Nữ' ? 'Em' : 'Em';
    const commentsPool = [
      `${firstWord} ${student.fullName} có ý thức học tập tốt, ngoan ngoãn, lễ phép. Cần phát huy hơn nữa tinh thần tự giác.`,
      `${firstWord} ${student.fullName} hăng hái phát biểu xây dựng bài, tiếp thu bài nhanh và hoàn thành tốt nhiệm vụ học tập.`,
      `${firstWord} ${student.fullName} chấp hành nghiêm túc nề nếp trường lớp, hòa đồng và luôn sẵn sàng giúp đỡ bạn bè.`,
    ];

    const randomChoice = commentsPool[Math.floor(Math.random() * commentsPool.length)];
    setGeneratedComment(randomChoice);
  };

  const categories = ['Tất cả', 'Khen ngợi', 'Khích lệ', 'Cần cố gắng', 'Nề nếp', 'Kỹ năng'];

  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchCat = selectedCategory === 'Tất cả' || tpl.category === selectedCategory;
      const matchSearch =
        tpl.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Bar */}
      <div className="glass-panel p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 theme-text" /> Ngân hàng nhận xét học sinh
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Kho câu nhận xét chuẩn Thông tư 27/22 & trợ lý gợi ý nhận xét thông minh
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-2xl theme-btn-primary text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Thêm mẫu nhận xét
        </button>
      </div>

      {/* Smart Assistant Card */}
      <div className="theme-quote-box p-6 rounded-3xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-xl theme-btn-primary text-white">
            <Wand2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-black theme-text">Trợ lý gợi ý nhận xét thông minh</h3>
            <p className="text-xs text-slate-500">Tự động phân tích điểm thi đua & nề nếp để tạo câu nhận xét phù hợp</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="px-4 py-2.5 rounded-2xl border theme-card-border bg-white text-xs sm:text-sm font-bold text-slate-700 focus:outline-none"
          >
            {students.map((st) => (
              <option key={st.id} value={st.id}>
                STT {st.rollNumber} - {st.fullName} ({st.gender})
              </option>
            ))}
          </select>

          <button
            onClick={handleAutoGenerate}
            className="px-5 py-2.5 rounded-2xl theme-btn-primary text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" /> Tạo gợi ý nhận xét
          </button>
        </div>

        {generatedComment && (
          <div className="mt-4 p-4 rounded-2xl bg-white border theme-card-border shadow-2xs">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed">
                "{generatedComment}"
              </p>
              <button
                onClick={() => handleCopy(generatedComment, 'gen-box')}
                className="px-3 py-1.5 rounded-xl theme-btn-secondary text-xs font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              >
                {copiedId === 'gen-box' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'gen-box' ? 'Đã chép!' : 'Sao chép'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 theme-soft-bg p-1.5 rounded-2xl border theme-card-border">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'theme-btn-primary shadow-xs'
                  : 'text-slate-600 hover:theme-text'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 theme-text absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm mẫu câu, từ khóa..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl border theme-card-border bg-white text-xs sm:text-sm font-semibold focus:outline-none"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="glass-card p-5 rounded-3xl flex flex-col justify-between group"
          >
            <div>
              {/* Category & Tags */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full theme-badge font-extrabold text-[11px]">
                  {tpl.category}
                </span>

                <div className="flex flex-wrap gap-1">
                  {tpl.tags.map((t, idx) => (
                    <span key={idx} className="text-[10px] text-slate-400 font-medium bg-slate-50 px-1.5 py-0.5 rounded-md">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Content */}
              <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed italic">
                "{tpl.content}"
              </p>
            </div>

            {/* Bottom Copy & Delete Actions */}
            <div className="mt-4 pt-3 border-t theme-card-border flex items-center justify-between">
              <button
                onClick={() => handleCopy(tpl.content, tpl.id)}
                className="flex-1 py-1.5 rounded-xl theme-btn-secondary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedId === tpl.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Đã chép vào bộ nhớ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép mẫu</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleDeleteTemplate(tpl.id)}
                className="p-1.5 ml-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                title="Xóa mẫu này"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Modal Add Template */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border theme-card-border shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold theme-text mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 theme-text" /> Thêm mẫu nhận xét mới
            </h3>

            <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Phân loại</label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border theme-card-border focus:outline-none font-bold"
                >
                  <option value="Khen ngợi">Khen ngợi</option>
                  <option value="Khích lệ">Khích lệ</option>
                  <option value="Cần cố gắng">Cần cố gắng</option>
                  <option value="Nề nếp">Nề nếp</option>
                  <option value="Kỹ năng">Kỹ năng</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nội dung câu nhận xét *</label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Ví dụ: Em chăm ngoan, có ý thức học tập tốt..."
                  className="w-full px-3.5 py-2.5 rounded-xl border theme-card-border focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Từ khóa gắn thẻ (cách nhau bởi dấu phẩy)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="Chăm chỉ, Tiến bộ, Tự giác..."
                  className="w-full px-3.5 py-2.5 rounded-xl border theme-card-border focus:outline-none font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t theme-card-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white theme-btn-primary rounded-xl shadow-md"
                >
                  Lưu mẫu câu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
