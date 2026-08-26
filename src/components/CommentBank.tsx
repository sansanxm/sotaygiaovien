import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Copy,
  Check,
  Plus,
  Trash2,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../db/db';
import type { CommentTemplate, Student } from '../types';


export const CommentBank: React.FC = () => {
  const { currentClass, triggerConfetti } = useApp();

  const [templates, setTemplates] = useState<CommentTemplate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto Generate Generator states
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [generatedComment, setGeneratedComment] = useState<string>('');

  // Modal Add Template
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCat, setNewCat] = useState<any>('Khen ngợi');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');

  const loadData = async () => {
    const list = await db.commentTemplates.toArray();
    setTemplates(list);

    if (currentClass) {
      const studentList = await db.students
        .where('classId')
        .equals(currentClass.id)
        .sortBy('rollNumber');
      setStudents(studentList);
      if (studentList.length > 0 && !selectedStudentId) {
        setSelectedStudentId(studentList[0].id);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [currentClass]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    triggerConfetti();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const tagsArray = newTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newTpl: CommentTemplate = {
      id: `cmt-${Date.now()}`,
      category: newCat,
      gradeLevel: 'Chung',
      content: newContent.trim(),
      tags: tagsArray.length > 0 ? tagsArray : ['Chung'],
    };

    await db.commentTemplates.add(newTpl);
    setShowAddModal(false);
    setNewContent('');
    setNewTags('');
    triggerConfetti();
    await loadData();
  };

  const handleDeleteTemplate = async (id: string) => {
    if (window.confirm('Cô có muốn xóa mẫu nhận xét này không?')) {
      await db.commentTemplates.delete(id);
      await loadData();
    }
  };

  // Smart Auto-Generator for Student Comment
  const handleAutoGenerate = async () => {
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student || !currentClass) return;

    const logs = await db.behaviorLogs
      .where('classId')
      .equals(currentClass.id)
      .and((l) => l.studentId === student.id)
      .toArray();

    const totalPoints = logs.reduce((sum, l) => sum + l.points, 0);
    const praises = logs.filter((l) => l.type === 'praise').length;
    const violations = logs.filter((l) => l.type === 'violation').length;

    let comment = `Em ${student.fullName} `;

    if (totalPoints >= 15 || praises >= 3) {
      comment += 'chăm ngoan, lễ phép, có ý thức tự giác học tập rất cao. Luôn tích cực phát biểu xây dựng bài và gương mẫu trong các phong trào của lớp. ';
    } else if (totalPoints >= 0 && violations === 0) {
      comment += 'ngoan ngoãn, hòa đồng với bạn bè, chấp hành tốt nội quy trường lớp. Có tiến bộ và nỗ lực trong học tập. ';
    } else if (violations > 0) {
      comment += 'ngoan ngoãn, lễ phép với thầy cô. Cần tập trung chú ý nghe giảng hơn trong giờ học và rèn luyện tính tự giác làm bài tập về nhà. ';
    } else {
      comment += 'có tinh thần học tập tốt, đi học chuyên cần và thân thiện với bạn bè. Cần tự tin phát biểu nhiều hơn trước tập thể. ';
    }

    if (student.healthNote) {
      comment += `(Lưu ý: ${student.healthNote}).`;
    }

    setGeneratedComment(comment);
    triggerConfetti();
  };

  const categories = ['Tất cả', 'Khen ngợi', 'Khích lệ', 'Cần cố gắng', 'Nề nếp', 'Kỹ năng'];

  const filteredTemplates = templates.filter((tpl) => {
    const matchesCategory = selectedCategory === 'Tất cả' || tpl.category === selectedCategory;
    const matchesSearch =
      tpl.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Bar */}
      <div className="glass-panel p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-pink-500" /> Ngân Hàng Nhận Xét Học Sinh
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Kho câu nhận xét chuẩn Thông tư 27/22 & Trợ lý gợi ý nhận xét thông minh
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-300/50 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Thêm Mẫu Nhận Xét
        </button>
      </div>

      {/* Smart Assistant Card */}
      <div className="glass-card p-6 rounded-3xl border-pink-300 bg-gradient-to-r from-pink-50/70 via-rose-50/40 to-white">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-xl bg-pink-500 text-white">
            <Wand2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-pink-900">Trợ Lý Gợi Ý Nhận Xét Thông Minh</h3>
            <p className="text-xs text-slate-500">Tự động phân tích điểm thi đua & nề nếp để tạo câu nhận xét phù hợp</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="px-4 py-2.5 rounded-2xl border border-pink-200 bg-white text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-400"
          >
            {students.map((st) => (
              <option key={st.id} value={st.id}>
                STT {st.rollNumber} - {st.fullName} ({st.gender})
              </option>
            ))}
          </select>

          <button
            onClick={handleAutoGenerate}
            className="px-5 py-2.5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-pink-300/50 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Tạo Gợi Ý Nhận Xét
          </button>
        </div>

        {generatedComment && (
          <div className="mt-4 p-4 rounded-2xl bg-white border border-pink-200 shadow-2xs">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed">
                "{generatedComment}"
              </p>
              <button
                onClick={() => handleCopy(generatedComment, 'gen-box')}
                className="px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
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
        <div className="flex flex-wrap gap-1.5 bg-pink-50 p-1.5 rounded-2xl border border-pink-200">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-pink-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-pink-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-pink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm mẫu câu, từ khóa..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-pink-200 bg-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="glass-card p-5 rounded-3xl flex flex-col justify-between group hover:border-pink-300"
          >
            <div>
              {/* Category & Tags */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 font-extrabold text-[11px]">
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
            <div className="mt-4 pt-3 border-t border-pink-100 flex items-center justify-between">
              <button
                onClick={() => handleCopy(tpl.content, tpl.id)}
                className="flex-1 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-pink-200 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-pink-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-pink-500" /> Thêm Mẫu Nhận Xét Mới
            </h3>

            <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Phân loại</label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-bold"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Từ khóa gắn thẻ (cách nhau bởi dấu phẩy)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="Chăm chỉ, Tiến bộ, Tự giác..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-pink-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-pink-500 hover:bg-pink-600 rounded-xl shadow-md shadow-pink-300/50"
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
