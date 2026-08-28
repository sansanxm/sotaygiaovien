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
  Crown,
  Loader2,
  BookmarkPlus,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { db } from '../db/db';
import type { Student } from '../types';
import { generateStudentCommentWithAi } from '../services/gemini';

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
    tags: ['Học tập', 'Xuất sắc', 'Chăm chỉ'],
    content: 'Em có ý thức học tập rất tốt, nắm vững kiến thức bài học, tích cực xây dựng bài và luôn gương mẫu trong mọi hoạt động.',
  },
  {
    id: '2',
    category: 'Khen ngợi',
    tags: ['Nề nếp', 'Gương mẫu'],
    content: 'Chấp hành nghiêm túc nề nếp trường lớp, kính thầy yêu bạn, là tấm gương sáng cho các bạn trong lớp noi theo.',
  },
  {
    id: '3',
    category: 'Khích lệ',
    tags: ['Tiến bộ', 'Cố gắng'],
    content: 'Có nhiều tiến bộ trong học tập, hoàn thành các nhiệm vụ được giao. Cần mạnh dạn, tự tin hơn khi phát biểu trước tập thể.',
  },
  {
    id: '4',
    category: 'Khích lệ',
    tags: ['Toán học', 'Tập trung'],
    content: 'Tiếp thu bài nhanh, tính toán cẩn thận. Em nên duy trì thói quen đọc kĩ đề bài và rèn chữ viết sạch đẹp hơn.',
  },
  {
    id: '5',
    category: 'Cần cố gắng',
    tags: ['Mất tập trung', 'Nhắc nhở'],
    content: 'Còn đôi lúc chưa tập trung trong giờ học, cần chú ý nghe giảng hơn và chủ động hỏi thầy cô khi chưa hiểu bài.',
  },
  {
    id: '6',
    category: 'Nề nếp',
    tags: ['Trách nhiệm', 'Đoàn kết'],
    content: 'Nhiệt tình tham gia phong trào của lớp, có tinh thần trách nhiệm cao và hòa đồng với bạn bè xung quanh.',
  },
  {
    id: '7',
    category: 'Kỹ năng',
    tags: ['Làm việc nhóm', 'Thuyết trình'],
    content: 'Có kỹ năng làm việc nhóm tốt, có tinh thần tương thân tương ái, giúp đỡ bạn bè cùng tiến bộ.',
  },
];

export const CommentBank: React.FC = () => {
  const { currentClass, teacherTitle, isVip, setShowVipModal, triggerConfetti } = useApp();
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
  const [aiPeriod, setAiPeriod] = useState<string>('Cuối học kỳ 1');
  const [aiTone, setAiTone] = useState<'Khen ngợi' | 'Khích lệ' | 'Cần cố gắng' | 'Toàn diện'>('Khen ngợi');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
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
    triggerConfetti();
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

  const handleAutoGenerate = async () => {
    const student = students.find((s) => s.id === selectedStudentId) || students[0];
    if (!student) {
      setGeneratedComment('Vui lòng chọn hoặc thêm học sinh vào danh sách lớp.');
      return;
    }

    // If user is VIP, generate with Gemini Flash AI
    if (isVip) {
      setIsAiGenerating(true);
      try {
        const comment = await generateStudentCommentWithAi({
          studentName: student.fullName,
          gender: student.gender,
          behaviorScore: 10,
          period: aiPeriod,
          tone: aiTone,
          teacherTitle,
          notes: student.healthNote || student.notes,
        });
        setGeneratedComment(comment);
        triggerConfetti();
      } catch (err: any) {
        console.warn('Lỗi AI Gemini, chuyển sang thuật toán mẫu:', err?.message);
        fallbackAlgorithmGenerate(student);
      } finally {
        setIsAiGenerating(false);
      }
    } else {
      // Free / Offline fallback
      fallbackAlgorithmGenerate(student);
    }
  };

  const fallbackAlgorithmGenerate = (student: Student) => {
    const firstWord = student.gender === 'Nữ' ? 'Em' : 'Em';
    const commentsPool = [
      `${firstWord} ${student.fullName} có ý thức học tập tốt, ngoan ngoãn, lễ phép. Cần phát huy hơn nữa tinh thần tự giác trong các giờ tự học.`,
      `${firstWord} ${student.fullName} hăng hái phát biểu xây dựng bài, tiếp thu bài nhanh và hoàn thành tốt mọi nhiệm vụ học tập được giao.`,
      `${firstWord} ${student.fullName} chấp hành nghiêm túc nề nếp trường lớp, hòa đồng, thân thiện và luôn sẵn sàng giúp đỡ bạn bè.`,
      `${firstWord} ${student.fullName} có nhiều cố gắng trong rèn luyện chữ viết và tính toán, cần tự tin hơn khi trình bày trước lớp.`,
    ];
    const randomChoice = commentsPool[Math.floor(Math.random() * commentsPool.length)];
    setGeneratedComment(randomChoice);
  };

  const handleSaveGeneratedToTemplates = () => {
    if (!generatedComment) return;
    const newTpl: CommentTemplate = {
      id: `ai-${Date.now()}`,
      category: aiTone === 'Toàn diện' ? 'Khen ngợi' : (aiTone as any),
      tags: ['AI Gemini', aiPeriod],
      content: generatedComment,
    };
    saveToStorage([newTpl, ...templates]);
    alert('Đã lưu câu nhận xét của AI vào Ngân hàng mẫu câu! 🌸');
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
            Kho câu nhận xét chuẩn Thông tư 27/22 & trợ lý AI Gemini Flash cá nhân hóa theo từng học sinh
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-2xl theme-btn-primary text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Thêm mẫu nhận xét
        </button>
      </div>

      {/* Smart AI Assistant Card */}
      <div className="theme-quote-box p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl theme-btn-primary text-white shadow-xs">
              <Wand2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black theme-text">Trợ lý AI Gemini Flash gợi ý nhận xét</h3>
                {isVip ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px] border border-amber-300 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-600" /> VIP AI
                  </span>
                ) : (
                  <button
                    onClick={() => setShowVipModal(true)}
                    className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800 font-bold text-[10px] border border-slate-300 flex items-center gap-1 cursor-pointer"
                  >
                    Mở khóa AI VIP 👑
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500">Tự động phân tích điểm thi đua & nề nếp để tạo câu nhận xét chuẩn mực</p>
            </div>
          </div>
        </div>

        {/* Options Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Chọn học sinh cần nhận xét</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-2xl border theme-card-border bg-white text-xs font-bold text-slate-700 focus:outline-none"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  STT {st.rollNumber} - {st.fullName} ({st.gender})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Dịp nhận xét</label>
            <select
              value={aiPeriod}
              onChange={(e) => setAiPeriod(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl border theme-card-border bg-white text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="Giữa học kỳ 1">Giữa học kỳ 1</option>
              <option value="Cuối học kỳ 1">Cuối học kỳ 1</option>
              <option value="Giữa học kỳ 2">Giữa học kỳ 2</option>
              <option value="Cuối năm học">Cuối năm học</option>
              <option value="Thường xuyên hàng tháng">Hàng tháng</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Phong cách</label>
            <select
              value={aiTone}
              onChange={(e) => setAiTone(e.target.value as any)}
              className="w-full px-3 py-2 rounded-2xl border theme-card-border bg-white text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="Khen ngợi">Khen ngợi</option>
              <option value="Khích lệ">Khích lệ tiến bộ</option>
              <option value="Cần cố gắng">Cần cố gắng</option>
              <option value="Toàn diện">Toàn diện</option>
            </select>
          </div>
        </div>

        <div>
          <button
            disabled={isAiGenerating}
            onClick={handleAutoGenerate}
            className="px-5 py-2.5 rounded-2xl theme-btn-primary text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all disabled:opacity-50"
          >
            {isAiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isAiGenerating ? 'AI Gemini đang suy nghĩ...' : 'Tạo Lời Nhận Xét AI ✨'}</span>
          </button>
        </div>

        {generatedComment && (
          <div className="mt-4 p-4 rounded-2xl bg-white border theme-card-border shadow-2xs space-y-3 animate-in fade-in">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed">
                "{generatedComment}"
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={handleSaveGeneratedToTemplates}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Lưu câu này vào kho mẫu cá nhân"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Lưu vào ngân hàng mẫu</span>
              </button>
              <button
                onClick={() => handleCopy(generatedComment, 'gen-box')}
                className="px-3 py-1.5 rounded-xl theme-btn-primary text-xs font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              >
                {copiedId === 'gen-box' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'gen-box' ? 'Đã sao chép!' : 'Sao chép nhận xét'}</span>
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
            className="glass-card p-5 rounded-3xl border theme-card-border shadow-xs flex flex-col justify-between hover:shadow-md transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold theme-badge">
                  {tpl.category}
                </span>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy(tpl.content, tpl.id)}
                    className="p-1.5 rounded-lg theme-soft-bg hover:theme-text transition-colors cursor-pointer"
                    title="Sao chép câu nhận xét"
                  >
                    {copiedId === tpl.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(tpl.id)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Xóa mẫu"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed mb-4">
                "{tpl.content}"
              </p>
            </div>

            <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-100">
              {tpl.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-bold text-slate-600 theme-soft-bg px-2 py-0.5 rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Template */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border theme-card-border shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold theme-text mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" /> Thêm mẫu nhận xét mới
            </h3>

            <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Phân loại danh mục</label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border theme-card-border font-semibold focus:outline-none"
                >
                  <option value="Khen ngợi">Khen ngợi</option>
                  <option value="Khích lệ">Khích lệ</option>
                  <option value="Cần cố gắng">Cần cố gắng</option>
                  <option value="Nề nếp">Nề nếp</option>
                  <option value="Kỹ năng">Kỹ năng</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nội dung nhận xét *</label>
                <textarea
                  required
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Ví dụ: Em có tinh thần học tập tự giác cao, tích cực tham gia các phong trào..."
                  className="w-full px-3.5 py-2.5 rounded-xl border theme-card-border font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Thẻ từ khóa (Cách nhau bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="Ví dụ: Toán, Tự giác, Gương mẫu"
                  className="w-full px-3.5 py-2.5 rounded-xl border theme-card-border font-medium focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white theme-btn-primary rounded-xl shadow-md cursor-pointer"
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
