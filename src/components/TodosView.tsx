import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { db, onDatabaseChanged } from '../db/db';
import type { TeacherTodo } from '../types';

export const TodosView: React.FC = () => {
  const { currentClass, triggerConfetti } = useApp();

  const [todos, setTodos] = useState<TeacherTodo[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('Tất cả');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'done'>('all');

  // New Todo State
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState('Chủ nhiệm');

  const loadTodos = async () => {
    if (!currentClass) return;
    const list = await db.todos.where('classId').equals(currentClass.id).toArray();
    setTodos(list);
  };

  useEffect(() => {
    loadTodos();
    const unsub = onDatabaseChanged(() => {
      loadTodos();
    });
    return () => {
      unsub();
    };
  }, [currentClass]);


  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentClass) return;

    const newTodo: TeacherTodo = {
      id: `todo-${Date.now()}`,
      classId: currentClass.id,
      title: title.trim(),
      dueDate,
      priority,
      category,
      isDone: false,
    };

    await db.todos.add(newTodo);
    setTitle('');
    triggerConfetti();
    await loadTodos();
  };

  const handleToggleDone = async (todo: TeacherTodo) => {
    const isDone = !todo.isDone;
    await db.todos.update(todo.id, { isDone });
    if (isDone) triggerConfetti();
    await loadTodos();
  };

  const handleDeleteTodo = async (id: string) => {
    await db.todos.delete(id);
    await loadTodos();
  };

  const categories = ['Tất cả', 'Chủ nhiệm', 'Hành chính', 'Phong trào', 'Giảng dạy', 'Khác'];

  const filteredTodos = todos.filter((t) => {
    const matchCat = filterCategory === 'Tất cả' || t.category === filterCategory;
    const matchStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'pending'
        ? !t.isDone
        : t.isDone;
    return matchCat && matchStatus;
  });

  const pendingCount = todos.filter((t) => !t.isDone).length;
  const doneCount = todos.filter((t) => t.isDone).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Bar */}
      <div className="glass-panel p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 theme-text" /> Sổ tay việc cần làm của cô
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Lên kế hoạch tuần, theo dõi lịch nộp báo cáo và công việc chủ nhiệm
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-3 py-1.5 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200">
            Chưa xong: {pendingCount}
          </span>
          <span className="px-3 py-1.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200">
            Đã hoàn thành: {doneCount}
          </span>
        </div>
      </div>

      {/* Grid: Form (1 Col) & List (2 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Add Todo Form */}
        <div className="glass-card p-6 rounded-3xl h-fit">
          <h3 className="text-sm font-extrabold theme-text uppercase tracking-wider mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 theme-text" /> Thêm việc cần làm
          </h3>

          <form onSubmit={handleAddTodo} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Tên công việc *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Nộp sổ điểm, họp phụ huynh..."
                className="w-full px-3.5 py-2.5 rounded-xl border theme-card-border focus:outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Hạn hoàn thành</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border theme-card-border focus:outline-none font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Danh mục</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border theme-card-border focus:outline-none font-bold"
                >
                  <option value="Chủ nhiệm">Chủ nhiệm</option>
                  <option value="Hành chính">Hành chính</option>
                  <option value="Phong trào">Phong trào</option>
                  <option value="Giảng dạy">Giảng dạy</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Độ ưu tiên</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border theme-card-border focus:outline-none font-bold"
                >
                  <option value="high">Gấp 🔥</option>
                  <option value="medium">Bình thường ⚡</option>
                  <option value="low">Thong thả ☕</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-2xl theme-btn-primary font-black text-xs shadow-md transition-all cursor-pointer mt-2 active:scale-98"
            >
              Lưu Công Việc Ngay
            </button>
          </form>
        </div>

        {/* Todo List */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filters Bar */}
          <div className="glass-card p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-1">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setFilterCategory(c)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterCategory === c
                      ? 'theme-btn-primary shadow-xs'
                      : 'text-slate-600 hover:theme-text'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex theme-soft-bg p-1 rounded-xl border theme-card-border text-xs font-bold">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterStatus === 'all' ? 'bg-white theme-text shadow-2xs' : 'text-slate-500'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterStatus === 'pending' ? 'bg-white theme-text shadow-2xs' : 'text-slate-500'
                }`}
              >
                Chưa làm
              </button>
              <button
                onClick={() => setFilterStatus('done')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterStatus === 'done' ? 'bg-white theme-text shadow-2xs' : 'text-slate-500'
                }`}
              >
                Đã xong
              </button>
            </div>
          </div>

          {/* List Display */}
          {filteredTodos.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl text-center text-slate-400 text-xs font-semibold">
              Không có công việc nào trong danh mục này. Thảnh thơi uống trà thôi cô giáo ơi! 🍵
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTodos.map((t) => {
                const priorityBadge =
                  t.priority === 'high'
                    ? 'bg-rose-100 text-rose-700 border-rose-200'
                    : t.priority === 'medium'
                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200';

                return (
                  <div
                    key={t.id}
                    className={`p-4 rounded-3xl border transition-all flex items-center justify-between gap-3 ${
                      t.isDone
                        ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                        : 'bg-white theme-card-border shadow-2xs text-slate-800'
                    }`}
                  >
                    <div
                      onClick={() => handleToggleDone(t)}
                      className="flex items-center gap-3.5 flex-1 cursor-pointer"
                    >
                      {t.isDone ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="w-6 h-6 theme-text shrink-0 transition-colors" />
                      )}

                      <div>
                        <div className="text-xs sm:text-sm font-bold">{t.title}</div>
                        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 mt-0.5">
                          <span>📁 {t.category}</span>
                          {t.dueDate && <span>• 📅 Hạn: {t.dueDate}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${priorityBadge}`}>
                        {t.priority === 'high' ? 'GẤP' : t.priority === 'medium' ? 'Vừa' : 'Thường'}
                      </span>

                      <button
                        onClick={() => handleDeleteTodo(t.id)}
                        className="p-1.5 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Xóa công việc"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
