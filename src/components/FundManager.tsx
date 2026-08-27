import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Download,
  Share2,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

import html2canvas from 'html2canvas';
import { useApp } from '../context/AppContext';
import { db, onDatabaseChanged } from '../db/db';
import type { Student, FundTransaction } from '../types';
import { exportFundToExcel } from '../utils/excelExporter';

export const FundManager: React.FC = () => {
  const { currentClass, teacherName, triggerConfetti } = useApp();

  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<FundTransaction[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'history' | 'tracking'>('history');

  // Modal Add Transaction
  const [showAddModal, setShowAddModal] = useState(false);
  const [transType, setTransType] = useState<'income' | 'expense'>('expense');
  const [transCategory, setTransCategory] = useState<any>('Quỹ lớp');
  const [transTitle, setTransTitle] = useState('');
  const [transAmount, setTransAmount] = useState<number>(100000);
  const [transDate, setTransDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [transPerson, setTransPerson] = useState('');
  const [transNote, setTransNote] = useState('');
  const [targetPerStudent, setTargetPerStudent] = useState<number>(0);

  // Zalo report preview modal
  const [showReportModal, setShowReportModal] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const loadFundData = async () => {
    if (!currentClass) return;

    const studentList = await db.students
      .where('classId')
      .equals(currentClass.id)
      .sortBy('rollNumber');
    setStudents(studentList);

    const transList = await db.fundTransactions
      .where('classId')
      .equals(currentClass.id)
      .reverse()
      .toArray();
    setTransactions(transList);
  };

  useEffect(() => {
    loadFundData();
    const unsub = onDatabaseChanged(() => {
      loadFundData();
    });
    return () => {
      unsub();
    };
  }, [currentClass]);


  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transTitle.trim() || !currentClass) return;

    const newTrans: FundTransaction = {
      id: `fund-${Date.now()}`,
      classId: currentClass.id,
      type: transType,
      category: transCategory,
      title: transTitle.trim(),
      amount: Number(transAmount) || 0,
      date: transDate,
      payerOrReceiver: transPerson.trim(),
      note: transNote.trim(),
      targetAmountPerStudent: transType === 'income' && targetPerStudent > 0 ? targetPerStudent : undefined,
      paidStudentIds: transType === 'income' && targetPerStudent > 0 ? [] : undefined,
    };

    await db.fundTransactions.add(newTrans);
    setShowAddModal(false);
    triggerConfetti();
    setTransTitle('');
    setTransNote('');
    setTransPerson('');
    await loadFundData();
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('Cô có chắc muốn xóa khoản thu chi này không?')) {
      await db.fundTransactions.delete(id);
      await loadFundData();
    }
  };

  // Toggle student paid status for a specific collection campaign
  const handleToggleStudentPaid = async (transactionId: string, studentId: string) => {
    const trans = transactions.find((t) => t.id === transactionId);
    if (!trans) return;

    const currentPaid = trans.paidStudentIds || [];
    const isPaid = currentPaid.includes(studentId);
    const updatedPaid = isPaid
      ? currentPaid.filter((id) => id !== studentId)
      : [...currentPaid, studentId];

    // Auto-update transaction amount based on paid students * perStudent
    const newTotalAmount = updatedPaid.length * (trans.targetAmountPerStudent || 0);

    await db.fundTransactions.update(transactionId, {
      paidStudentIds: updatedPaid,
      amount: newTotalAmount > 0 ? newTotalAmount : trans.amount,
    });

    if (!isPaid) triggerConfetti();
    await loadFundData();
  };

  // Calculate totals
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Campaigns for student tracking
  const collectionCampaigns = transactions.filter((t) => t.type === 'income' && t.targetAmountPerStudent);

  // Export report as image for Zalo
  const handleExportImageForZalo = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = imgData;
      a.download = `BaoCao_QuyLop_${currentClass?.name || 'Data'}_${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      triggerConfetti();
      alert('Đã tải ảnh báo cáo! Cô có thể gửi trực tiếp vào nhóm Zalo Phụ Huynh.');
    } catch (err) {
      alert('Có lỗi khi tạo ảnh báo cáo!');
    }
  };

  const handleExportExcel = async () => {
    if (!currentClass) return;
    await exportFundToExcel(
      transactions,
      currentClass.name,
      totalIncome,
      totalExpense,
      balance,
      teacherName || currentClass.homeroomTeacher || 'Giáo viên'
    );
    triggerConfetti();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Bar */}
      <div className="glass-panel p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-500" /> Quản lý thu - chi quỹ lớp
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Minh bạch từng đồng, dễ dàng xuất ảnh báo cáo gửi Zalo phụ huynh hoặc xuất file Excel
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Excel Export Button */}
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Xuất file Excel báo cáo quỹ lớp chuẩn Times New Roman 14"
          >
            <Download className="w-4 h-4" /> Xuất Excel
          </button>

          <button
            onClick={() => setShowReportModal(true)}
            className="px-3.5 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" /> Tạo báo cáo Zalo
          </button>


          <button
            onClick={() => {
              setTransType('expense');
              setShowAddModal(true);
            }}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-300/50 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Thêm thu / chi
          </button>
        </div>
      </div>

      {/* 3 Metric Cards: Income, Expense, Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Income */}
        <div className="glass-card p-5 rounded-3xl border-emerald-200 bg-emerald-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Tổng đã thu</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">
              +{totalIncome.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs font-bold text-emerald-600">đ</span>
          </div>
          <div className="mt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Quỹ đóng góp từ CMHS
          </div>
        </div>

        {/* Total Expense */}
        <div className="glass-card p-5 rounded-3xl border-rose-200 bg-rose-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Tổng đã chi</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-rose-700">
              -{totalExpense.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs font-bold text-rose-600">đ</span>
          </div>
          <div className="mt-2 text-xs font-semibold text-rose-700 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" /> Hoạt động, quà thưởng, mua sắm
          </div>
        </div>

        {/* Remaining Balance */}
        <div className="glass-card p-5 rounded-3xl border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Số dư quỹ hiện tại</span>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-purple-800">
              {balance.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs font-bold text-purple-600">đ</span>
          </div>
          <div className="mt-2 text-xs font-semibold text-purple-700">
            {balance >= 0 ? 'Số dư an toàn ✅' : 'Cần bổ sung quỹ ⚠️'}
          </div>
        </div>

      </div>

      {/* Sub Tabs: Sổ Giao Dịch vs Theo Dõi Đóng Tiền Học Sinh */}
      <div className="flex gap-2 border-b border-pink-200/80 pb-2">
        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'history'
              ? 'bg-pink-500 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-pink-50'
          }`}
        >
          Sổ giao dịch thu - chi ({transactions.length})
        </button>

        <button
          onClick={() => setActiveSubTab('tracking')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'tracking'
              ? 'bg-pink-500 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-pink-50'
          }`}
        >
          Theo dõi đóng tiền từng học sinh ({collectionCampaigns.length} đợt)
        </button>
      </div>


      {/* View 1: History Transactions */}
      {activeSubTab === 'history' ? (
        <div className="glass-card rounded-3xl overflow-hidden shadow-xs border border-pink-200/80">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-semibold">
              Chưa có khoản thu chi nào. Bấm nút "Thêm Thu / Chi" để bắt đầu ghi chép.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-pink-100/70 text-pink-900 uppercase font-extrabold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Ngày</th>
                    <th className="py-3 px-4">Loại</th>
                    <th className="py-3 px-4">Khoản thu / chi</th>
                    <th className="py-3 px-4">Danh mục</th>
                    <th className="py-3 px-4">Người giao dịch</th>
                    <th className="py-3 px-4 text-right">Số tiền</th>
                    <th className="py-3 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-100 font-medium text-slate-700">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-pink-50/40 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{t.date}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.type === 'income'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {t.type === 'income' ? 'Khoản Thu 💰' : 'Khoản Chi 🛍️'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {t.title}
                        {t.note && <div className="text-[11px] text-slate-400 font-normal">{t.note}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-pink-50 text-pink-700 border border-pink-100 text-xs font-semibold">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{t.payerOrReceiver || '—'}</td>
                      <td
                        className={`py-3 px-4 text-right font-black whitespace-nowrap ${
                          t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {t.type === 'income' ? '+' : '-'}
                        {t.amount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa giao dịch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* View 2: Student Collection Tracking Checklist */
        <div className="space-y-6">
          {collectionCampaigns.length === 0 ? (
            <div className="glass-card p-8 rounded-3xl text-center text-slate-400 text-xs font-semibold">
              Chưa có đợt thu tiền học sinh nào. Khi tạo "Khoản Thu", cô hãy điền "Mức thu mỗi học sinh" để kích hoạt tính năng này!
            </div>
          ) : (
            collectionCampaigns.map((camp) => {
              const paidIds = camp.paidStudentIds || [];
              const paidCount = paidIds.length;
              const unpaidCount = students.length - paidCount;

              return (
                <div key={camp.id} className="glass-card p-6 rounded-3xl space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-pink-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <span>📢 {camp.title}</span>
                        <span className="text-xs font-semibold text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200">
                          {camp.targetAmountPerStudent?.toLocaleString('vi-VN')} đ / học sinh
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Đã đóng: <strong className="text-emerald-600">{paidCount} em</strong> • Chưa đóng: <strong className="text-rose-600">{unpaidCount} em</strong>
                      </p>
                    </div>

                    <div className="text-right font-black text-sm text-emerald-600">
                      Thu được: {(paidCount * (camp.targetAmountPerStudent || 0)).toLocaleString('vi-VN')} đ
                    </div>
                  </div>

                  {/* Student Checkboxes Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                    {students.map((st) => {
                      const isPaid = paidIds.includes(st.id);
                      return (
                        <div
                          key={st.id}
                          onClick={() => handleToggleStudentPaid(camp.id, st.id)}
                          className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isPaid
                              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 shadow-2xs'
                              : 'bg-white border-pink-100 hover:border-pink-300 text-slate-600'
                          }`}
                        >
                          <div className="truncate text-xs font-bold">
                            <span className="text-[10px] text-slate-400 mr-1">{st.rollNumber}.</span>
                            {st.fullName}
                          </div>
                          {isPaid ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300 shrink-0 ml-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal Add Transaction */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-pink-200 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-pink-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-pink-500" /> Thêm khoản thu / chi mới
            </h3>

            <form onSubmit={handleSaveTransaction} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTransType('income')}
                  className={`py-2 rounded-xl font-bold text-xs transition-all ${
                    transType === 'income'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Khoản thu (+)
                </button>
                <button
                  type="button"
                  onClick={() => setTransType('expense')}
                  className={`py-2 rounded-xl font-bold text-xs transition-all ${
                    transType === 'expense'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Khoản chi (-)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tiêu đề khoản thu / chi *</label>
                <input
                  type="text"
                  required
                  value={transTitle}
                  onChange={(e) => setTransTitle(e.target.value)}
                  placeholder="Ví dụ: Thu quỹ học kỳ 1, Mua hoa 20/11..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Số tiền (VNĐ) *</label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    required
                    value={transAmount}
                    onChange={(e) => setTransAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-bold text-pink-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Ngày giao dịch</label>
                  <input
                    type="date"
                    required
                    value={transDate}
                    onChange={(e) => setTransDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Danh mục</label>
                  <select
                    value={transCategory}
                    onChange={(e) => setTransCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold"
                  >
                    <option value="Quỹ lớp">Quỹ lớp</option>
                    <option value="Hoạt động">Hoạt động, dã ngoại</option>
                    <option value="Khen thưởng">Khen thưởng, quà tặng</option>
                    <option value="Cơ sở vật chất">Cơ sở vật chất</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Người nộp / nhận</label>
                  <input
                    type="text"
                    value={transPerson}
                    onChange={(e) => setTransPerson(e.target.value)}
                    placeholder="Ban CMHS, Nhà sách..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold"
                  />
                </div>
              </div>

              {transType === 'income' && (
                <div className="p-3 rounded-2xl bg-pink-50/80 border border-pink-200">
                  <label className="block text-xs font-bold text-pink-800 mb-1">
                    🎯 Mức thu mỗi học sinh (nếu chia đều cả lớp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={targetPerStudent}
                    onChange={(e) => setTargetPerStudent(Number(e.target.value))}
                    placeholder="Ví dụ: 300000 (để mở bảng tích tên đóng tiền)"
                    className="w-full px-3.5 py-2 rounded-xl border border-pink-300 bg-white font-bold text-xs"
                  />
                  <span className="text-[10px] text-pink-600 mt-1 block">
                    Điền mục này sẽ tự động tạo bảng kiểm tra học sinh nào đã đóng/chưa đóng.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú chi tiết / Hóa đơn</label>
                <input
                  type="text"
                  value={transNote}
                  onChange={(e) => setTransNote(e.target.value)}
                  placeholder="Ghi chú thêm..."
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
                  Lưu giao dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Zalo Report Preview */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-pink-200 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between mb-4 border-b border-pink-100 pb-3">
              <h3 className="text-base font-bold text-pink-800 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-pink-500" /> Báo cáo thu chi quỹ lớp (gửi Zalo)
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                Đóng
              </button>
            </div>

            {/* Printable & Capture Area */}
            <div
              ref={reportRef}
              className="p-6 bg-gradient-to-b from-pink-50/80 via-white to-rose-50/50 rounded-2xl border-2 border-pink-300 shadow-xs space-y-4 text-slate-800"
            >
              <div className="text-center border-b-2 border-pink-200 pb-3">
                <div className="text-lg font-black text-pink-700 uppercase tracking-tight">
                  🌸 BÁO CÁO THU CHI QUỸ LỚP {currentClass?.name} 🌸
                </div>
                <div className="text-xs font-bold text-slate-500 mt-1">
                  GVCN: {currentClass?.homeroomTeacher || 'Cô giáo'} • Ngày xuất: {new Date().toLocaleDateString('vi-VN')}
                </div>
              </div>

              {/* Summary table */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold py-2 bg-white rounded-xl border border-pink-200">
                <div className="p-2 border-r border-pink-100">
                  <div className="text-slate-500 text-[10px]">TỔNG THU</div>
                  <div className="text-emerald-600 font-extrabold text-sm">+{totalIncome.toLocaleString('vi-VN')} đ</div>
                </div>
                <div className="p-2 border-r border-pink-100">
                  <div className="text-slate-500 text-[10px]">TỔNG CHI</div>
                  <div className="text-rose-600 font-extrabold text-sm">-{totalExpense.toLocaleString('vi-VN')} đ</div>
                </div>
                <div className="p-2">
                  <div className="text-slate-500 text-[10px]">SỐ DƯ QUỸ</div>
                  <div className="text-purple-700 font-extrabold text-sm">{balance.toLocaleString('vi-VN')} đ</div>
                </div>
              </div>

              {/* Recent detailed records */}
              <div className="space-y-1.5 text-xs">
                <div className="font-extrabold text-pink-800 text-[11px] uppercase tracking-wider">
                  Chi tiết các khoản gần nhất:
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1 bg-white p-2 rounded-xl border border-pink-100">
                  {transactions.slice(0, 10).map((t) => (
                    <div key={t.id} className="flex justify-between items-center py-1 border-b border-slate-50 text-[11px]">
                      <span className="truncate max-w-[240px]">
                        <strong>{t.date}:</strong> {t.title}
                      </span>
                      <span className={`font-black shrink-0 ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center text-[10px] text-pink-600/80 italic pt-2">
                "Kính chúc quý phụ huynh và các con học sinh luôn mạnh khỏe, hạnh phúc và gặt hái nhiều thành công!"
              </div>
            </div>

            {/* Actions: Download Image */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={handleExportImageForZalo}
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-pink-300/50"
              >
                <Download className="w-4 h-4" /> Tải ảnh báo cáo gửi Zalo phụ huynh
              </button>
            </div>


          </div>
        </div>
      )}

    </div>
  );
};
