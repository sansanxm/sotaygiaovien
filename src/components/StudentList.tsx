import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Download,
  Edit2,
  Trash2,
  Phone,
  MessageCircle,
  Cake,
  HeartPulse,
  LayoutGrid,
  List,
  Eye,
  Camera,
  FileSpreadsheet,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { db, onDatabaseChanged } from '../db/db';


import type { Student, Gender } from '../types';
import { GroupPhotoTaggingModal } from './GroupPhotoTaggingModal';
import { ExcelImportModal } from './ExcelImportModal';
import { getStudentInitial } from '../utils/studentHelper';
import { exportStudentsToExcel } from '../utils/excelExporter';


export const StudentList: React.FC = () => {
  const { currentClass, currentYear, teacherName, triggerConfetti } = useApp();

  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState<'All' | 'Nam' | 'Nữ'>('All');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGroupPhotoModal, setShowGroupPhotoModal] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<Gender>('Nữ');
  const [dob, setDob] = useState('');
  const [rollNumber, setRollNumber] = useState<number>(1);
  const [address, setAddress] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentZalo, setParentZalo] = useState('');
  const [healthNote, setHealthNote] = useState('');
  const [notes, setNotes] = useState('');

  const loadStudents = async () => {
    if (!currentClass) return;
    const list = await db.students
      .where('classId')
      .equals(currentClass.id)
      .sortBy('rollNumber');
    setStudents(list);
  };

  useEffect(() => {
    loadStudents();
    const unsub = onDatabaseChanged(() => {
      loadStudents();
    });
    return () => {
      unsub();
    };
  }, [currentClass]);


  const resetForm = () => {
    setFullName('');
    setGender('Nữ');
    setDob('2013-01-01');
    setRollNumber(students.length + 1);
    setAddress('');
    setParentName('');
    setParentPhone('');
    setParentZalo('');
    setHealthNote('');
    setNotes('');
    setEditingStudent(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setRollNumber(students.length + 1);
    setShowAddModal(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFullName(student.fullName);
    setGender(student.gender);
    setDob(student.dob);
    setRollNumber(student.rollNumber);
    setAddress(student.address || '');
    setParentName(student.parentName || '');
    setParentPhone(student.parentPhone || '');
    setParentZalo(student.parentZalo || '');
    setHealthNote(student.healthNote || '');
    setNotes(student.notes || '');
    setShowAddModal(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !currentClass) return;

    if (editingStudent) {
      await db.students.update(editingStudent.id, {
        fullName: fullName.trim(),
        gender,
        dob,
        rollNumber: Number(rollNumber) || 1,
        address: address.trim(),
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        parentZalo: parentZalo.trim() || parentPhone.trim(),
        healthNote: healthNote.trim(),
        notes: notes.trim(),
      });
    } else {
      const newId = `st-${Date.now()}`;
      await db.students.add({
        id: newId,
        classId: currentClass.id,
        rollNumber: Number(rollNumber) || (students.length + 1),
        fullName: fullName.trim(),
        gender,
        dob,
        address: address.trim(),
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        parentZalo: parentZalo.trim() || parentPhone.trim(),
        healthNote: healthNote.trim(),
        notes: notes.trim(),
        status: 'Đang học',
      });
      triggerConfetti();
    }

    setShowAddModal(false);
    resetForm();
    await loadStudents();
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (window.confirm(`Cô có chắc chắn muốn xóa học sinh "${name}" khỏi danh sách lớp không?`)) {
      await db.students.delete(id);
      await loadStudents();
    }
  };

  const handleExportExcel = async () => {
    if (students.length === 0 || !currentClass) {
      alert('Chưa có học sinh nào để xuất file!');
      return;
    }

    await exportStudentsToExcel(
      students,
      currentClass.name,
      currentYear?.name || '2025 - 2026',
      teacherName || currentClass.homeroomTeacher || 'Giáo viên'
    );
    triggerConfetti();
  };


  const filteredStudents = students.filter((st) => {
    const matchesQuery =
      st.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (st.parentPhone && st.parentPhone.includes(searchQuery)) ||
      (st.rollNumber && st.rollNumber.toString().includes(searchQuery));
    const matchesGender = filterGender === 'All' || st.gender === filterGender;
    return matchesQuery && matchesGender;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Bar: Actions & Search */}
      <div className="glass-panel p-5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Search & Filter */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-pink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên, SĐT, STT..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl border theme-card-border focus:outline-none text-xs sm:text-sm font-semibold bg-white/90"
            />
          </div>

          {/* Gender Filter Buttons */}
          <div className="flex theme-soft-bg p-1 rounded-2xl border theme-card-border">
            {(['All', 'Nam', 'Nữ'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setFilterGender(g)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterGender === g
                    ? 'theme-btn-primary shadow-xs'
                    : 'text-slate-600 hover:theme-text'
                }`}
              >
                {g === 'All' ? 'Tất cả' : g}
              </button>
            ))}
          </div>

          {/* View Mode */}
          <div className="flex theme-soft-bg p-1 rounded-2xl border theme-card-border">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-white theme-text shadow-xs' : 'text-slate-500'
              }`}
              title="Xem dạng thẻ"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white theme-text shadow-xs' : 'text-slate-500'
              }`}
              title="Xem dạng bảng"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Import/Export, Face Tagging & Add Student */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          
          {/* Smart Group Photo Face Cropper */}
          <button
            onClick={() => setShowGroupPhotoModal(true)}
            className="px-3 py-2 rounded-2xl theme-btn-secondary text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Tải ảnh tập thể lớp và click vào mặt học sinh để gán avatar"
          >
            <Camera className="w-4 h-4 theme-text" />
            <span>Gán ảnh tập thể 📸</span>
          </button>

          {/* Import / Paste Excel Modal trigger */}
          <button
            onClick={() => setShowExcelImportModal(true)}
            className="px-3 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Dán hoặc nạp danh sách từ Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Dán / Nạp Excel</span>
          </button>

          {/* Excel Export */}
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Xuất file Excel danh sách học sinh"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>

          {/* Add Student Button */}
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-2xl theme-btn-primary text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer transform hover:scale-105"
          >
            <Plus className="w-4 h-4" /> Thêm học sinh
          </button>

        </div>

      </div>

      {/* Student List View */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-16 bg-white/70 rounded-3xl border border-pink-200/60 p-8">
          <Users className="w-12 h-12 text-pink-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Không tìm thấy học sinh nào</h3>
          <p className="text-xs text-slate-500 mt-1">Cô có thể bấm nút "Thêm học sinh" hoặc "Dán / nạp Excel" để thêm dữ liệu.</p>
        </div>

      ) : viewMode === 'cards' ? (
        
        /* Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredStudents.map((st) => (
            <div
              key={st.id}
              className="glass-card rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between group"
            >
              {/* Top Bar: RollNumber & Gender Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-xl theme-avatar font-extrabold text-xs flex items-center justify-center shadow-2xs">
                  {st.rollNumber}
                </span>

                <div className="flex items-center gap-1">
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      st.gender === 'Nữ'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-sky-100 text-sky-700 border border-sky-200'
                    }`}
                  >
                    {st.gender}
                  </span>
                </div>
              </div>

              {/* Center Info: Avatar & Name */}
              <div className="text-center my-2">
                {st.avatarUrl ? (
                  <img
                    src={st.avatarUrl}
                    alt={st.fullName}
                    className="w-16 h-16 mx-auto rounded-full object-cover shadow-sm border-2 theme-card-border"
                  />
                ) : (
                  <div
                    className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center font-black text-base shadow-sm border-2 ${
                      st.gender === 'Nữ'
                        ? 'theme-avatar border-pink-200'
                        : 'bg-gradient-to-tr from-sky-200 to-blue-100 text-sky-700 border-sky-200'
                    }`}
                  >
                    {getStudentInitial(st.fullName)}
                  </div>
                )}

                <h4 className="text-sm font-bold text-slate-800 mt-2 truncate group-hover:theme-text transition-colors">
                  {st.fullName}
                </h4>
                <div className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1 mt-0.5">
                  <Cake className="w-3 h-3 theme-text" />
                  <span>{st.dob}</span>
                </div>
              </div>

              {/* Parent & Health Badges */}
              <div className="space-y-1.5 my-3 pt-2 border-t theme-card-border text-xs">
                {st.parentPhone && (
                  <div className="flex items-center justify-between text-slate-600 theme-soft-bg px-2 py-1 rounded-xl">
                    <span className="font-semibold truncate">{st.parentName || 'PH'}</span>
                    <a
                      href={`tel:${st.parentPhone}`}
                      className="theme-text font-bold hover:underline flex items-center gap-1 shrink-0"
                    >
                      <Phone className="w-3 h-3" /> {st.parentPhone}
                    </a>
                  </div>
                )}

                {st.healthNote && (
                  <div className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-xl border border-amber-200/60 flex items-center gap-1">
                    <HeartPulse className="w-3 h-3 text-amber-500 shrink-0" />
                    <span className="truncate">{st.healthNote}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-1 pt-2 border-t theme-card-border">
                <button
                  onClick={() => setViewingStudent(st)}
                  className="flex-1 py-1.5 rounded-xl theme-btn-secondary font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Chi tiết
                </button>
                <button
                  onClick={() => handleOpenEdit(st)}
                  className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Sửa thông tin"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteStudent(st.id, st.fullName)}
                  className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Xóa học sinh"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      ) : (

        /* Table View */
        <div className="glass-card rounded-3xl overflow-hidden shadow-xs border theme-card-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="theme-soft-bg theme-text uppercase font-extrabold text-[11px]">
                <tr>
                  <th className="py-3 px-4">STT</th>
                  <th className="py-3 px-4">Họ và tên</th>
                  <th className="py-3 px-4">Giới tính</th>
                  <th className="py-3 px-4">Ngày sinh</th>
                  <th className="py-3 px-4">Phụ huynh & SĐT</th>
                  <th className="py-3 px-4">Địa chỉ</th>
                  <th className="py-3 px-4">Ghi chú sức khỏe</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:theme-soft-bg transition-colors font-medium text-slate-700">
                    <td className="py-3 px-4 font-bold theme-text">{st.rollNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        {st.avatarUrl ? (
                          <img src={st.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover border theme-card-border" />
                        ) : (
                          <span className="w-6 h-6 rounded-full theme-avatar font-bold text-[10px] flex items-center justify-center">
                            {getStudentInitial(st.fullName)}
                          </span>
                        )}
                        {st.fullName}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.gender === 'Nữ' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'}`}>
                        {st.gender}
                      </span>
                    </td>
                    <td className="py-3 px-4">{st.dob}</td>
                    <td className="py-3 px-4">
                      <div>{st.parentName || 'Chưa cập nhật'}</div>
                      {st.parentPhone && (
                        <a href={`tel:${st.parentPhone}`} className="theme-text font-bold hover:underline text-xs flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {st.parentPhone}
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{st.address || '—'}</td>
                    <td className="py-3 px-4">
                      {st.healthNote ? (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-xs">
                          {st.healthNote}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingStudent(st)}
                          className="p-1.5 rounded-lg hover:theme-soft-bg theme-text"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(st)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(st.id, st.fullName)}
                          className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Student */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-pink-200 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-pink-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-500" />
              {editingStudent ? 'Chỉnh sửa thông tin học sinh' : 'Thêm học sinh mới'}
            </h3>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Họ và tên học sinh *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn An"
                    className="w-full px-3.5 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">STT sổ *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={rollNumber}
                    onChange={(e) => setRollNumber(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Giới tính</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3.5 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold"
                  >
                    <option value="Nữ">Nữ 👧</option>
                    <option value="Nam">Nam 👦</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Ngày sinh (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Họ tên phụ huynh</label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Bố/Mẹ học sinh..."
                    className="w-full px-3.5 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Số điện thoại phụ huynh</label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full px-3.5 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Địa chỉ thường trú</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Số nhà, đường, phường/xã..."
                  className="w-full px-3.5 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Lưu ý sức khỏe (Cận thị, dị ứng, bệnh lý...)</label>
                <input
                  type="text"
                  value={healthNote}
                  onChange={(e) => setHealthNote(e.target.value)}
                  placeholder="Ví dụ: Cận 2 độ (ngồi bàn đầu), dị ứng hải sản..."
                  className="w-full px-3.5 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú thêm</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Năng khiếu, hoàn cảnh, đặc điểm tính cách..."
                  className="w-full px-3.5 py-2 rounded-xl border theme-card-border focus:outline-none font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t theme-card-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white theme-btn-primary rounded-xl shadow-md"
                >
                  {editingStudent ? 'Lưu thay đổi' : 'Lưu học sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Student Profile 360 */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border theme-card-border shadow-2xl animate-in zoom-in-95">
            <div className="text-center">
              {viewingStudent.avatarUrl ? (
                <img
                  src={viewingStudent.avatarUrl}
                  alt={viewingStudent.fullName}
                  className="w-24 h-24 mx-auto rounded-full object-cover shadow-md border-4 theme-card-border"
                />
              ) : (
                <div
                  className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center font-black text-2xl shadow-md border-4 ${
                    viewingStudent.gender === 'Nữ'
                      ? 'theme-avatar border-pink-100'
                      : 'bg-gradient-to-tr from-sky-300 to-blue-200 text-sky-800 border-sky-100'
                  }`}
                >
                  {getStudentInitial(viewingStudent.fullName)}
                </div>
              )}

              <h3 className="text-lg font-black text-slate-800 mt-3">{viewingStudent.fullName}</h3>
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 mt-1">
                <span>STT: {viewingStudent.rollNumber}</span> •
                <span>Giới tính: {viewingStudent.gender}</span> •
                <span>Sinh nhật: {viewingStudent.dob}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3 theme-soft-bg p-4 rounded-2xl border theme-card-border text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Phụ huynh:</span>
                <span className="font-bold text-slate-800">{viewingStudent.parentName || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">SĐT liên hệ:</span>
                {viewingStudent.parentPhone ? (
                  <div className="flex gap-2">
                    <a
                      href={`tel:${viewingStudent.parentPhone}`}
                      className="px-2.5 py-1 rounded-lg theme-btn-primary text-white font-bold text-xs flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" /> Gọi
                    </a>
                    <a
                      href={`https://zalo.me/${viewingStudent.parentPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-blue-500 text-white font-bold text-xs flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" /> Zalo
                    </a>
                  </div>
                ) : (
                  <span className="text-slate-400 font-semibold">—</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Địa chỉ:</span>
                <span className="font-semibold text-slate-700 text-right">{viewingStudent.address || '—'}</span>
              </div>
              {viewingStudent.healthNote && (
                <div className="flex justify-between">
                  <span className="text-amber-600 font-medium">Sức khỏe:</span>
                  <span className="font-bold text-amber-700 text-right">{viewingStudent.healthNote}</span>
                </div>
              )}
              {viewingStudent.notes && (
                <div className="pt-2 border-t theme-card-border">
                  <span className="text-slate-500 font-medium block mb-1">Ghi chú của cô:</span>
                  <p className="text-slate-700 italic bg-white p-2 rounded-xl border theme-card-border">{viewingStudent.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  const target = viewingStudent;
                  setViewingStudent(null);
                  handleOpenEdit(target);
                }}
                className="flex-1 py-2.5 rounded-2xl theme-btn-primary text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-4 h-4" /> Sửa thông tin
              </button>


              <button
                onClick={() => setViewingStudent(null)}
                className="px-6 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Group Photo Tagging Modal */}
      <GroupPhotoTaggingModal
        isOpen={showGroupPhotoModal}
        onClose={() => setShowGroupPhotoModal(false)}
        students={students}
        onUpdated={loadStudents}
      />

      {/* Excel Import / Paste Clipboard Modal */}
      <ExcelImportModal
        isOpen={showExcelImportModal}
        onClose={() => setShowExcelImportModal(false)}
        onSuccess={loadStudents}
        existingCount={students.length}
      />

    </div>
  );
};
