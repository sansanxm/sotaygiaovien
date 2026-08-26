import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  ClipboardPaste,
  Download,
  Check,
  AlertCircle,
  Eye,
  FileDown,
} from 'lucide-react';

import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { db } from '../db/db';
import type { Student, Gender } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  existingCount: number;
}

export const ExcelImportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  existingCount,
}) => {
  const { currentClass, triggerConfetti } = useApp();

  const [activeMethod, setActiveMethod] = useState<'paste' | 'file' | 'template'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [parsedStudents, setParsedStudents] = useState<Student[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Download Template
  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        'STT': 1,
        'Họ và tên': 'Nguyễn Thảo An',
        'Giới tính': 'Nữ',
        'Ngày sinh': '2013-03-12',
        'Họ tên phụ huynh': 'Nguyễn Thị Mai',
        'Số điện thoại': '0912345601',
        'Địa chỉ': '128 Cầu Giấy, Hà Nội',
        'Ghi chú sức khỏe': 'Cận 1.5 độ (ngồi bàn đầu)',
        'Ghi chú khác': 'Lớp phó',
      },
      {
        'STT': 2,
        'Họ và tên': 'Trần Gia Bảo',
        'Giới tính': 'Nam',
        'Ngày sinh': '2013-05-18',
        'Họ tên phụ huynh': 'Trần Văn Hùng',
        'Số điện thoại': '0912345602',
        'Địa chỉ': '45 Trần Thái Tông, Hà Nội',
        'Ghi chú sức khỏe': '',
        'Ghi chú khác': '',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh_Sach_Mau');
    XLSX.writeFile(workbook, 'Mau_Danh_Sach_Hoc_Sinh_GVCN.xlsx');
    triggerConfetti();
  };

  // 2. Parse Pasted TSV/Excel text
  const handleParsePastedText = () => {
    setParseError(null);
    if (!pastedText.trim() || !currentClass) return;

    try {
      const lines = pastedText.trim().split('\n');
      if (lines.length === 0) {
        setParseError('Không có dữ liệu văn bản để phân tích!');
        return;
      }

      const results: Student[] = [];

      lines.forEach((line, idx) => {
        const cols = line.split('\t').map((c) => c.trim());
        if (cols.length === 0 || !cols.some(Boolean)) return;

        // Skip header row if contains "Họ tên" or "Họ và tên"
        const firstCol = cols[0].toLowerCase();
        const secondCol = (cols[1] || '').toLowerCase();
        if (
          firstCol.includes('stt') ||
          firstCol.includes('họ và tên') ||
          secondCol.includes('họ và tên') ||
          secondCol.includes('họ tên')
        ) {
          return;
        }

        let roll = existingCount + idx + 1;
        let name = '';
        let gender: Gender = 'Nữ';
        let dob = '2013-01-01';
        let parentName = '';
        let parentPhone = '';
        let address = '';
        let healthNote = '';

        if (!isNaN(Number(cols[0])) && cols.length > 1) {
          // Format with STT as first col: STT | Họ tên | Giới tính | Ngày sinh | PH | SĐT | Địa chỉ
          roll = Number(cols[0]);
          name = cols[1] || '';
          const gStr = (cols[2] || '').toLowerCase();
          gender = gStr.includes('nam') || gStr === 'm' || gStr === '1' ? 'Nam' : 'Nữ';
          dob = cols[3] || '2013-01-01';
          parentName = cols[4] || '';
          parentPhone = cols[5] || '';
          address = cols[6] || '';
          healthNote = cols[7] || '';
        } else {
          // Format starting with name: Họ tên | Giới tính | Ngày sinh | ...
          name = cols[0] || '';
          const gStr = (cols[1] || '').toLowerCase();
          gender = gStr.includes('nam') || gStr === 'm' || gStr === '1' ? 'Nam' : 'Nữ';
          dob = cols[2] || '2013-01-01';
          parentName = cols[3] || '';
          parentPhone = cols[4] || '';
          address = cols[5] || '';
          healthNote = cols[6] || '';
        }

        if (name.trim()) {
          results.push({
            id: `st-${Date.now()}-${idx}`,
            classId: currentClass.id,
            rollNumber: roll,
            fullName: name.trim(),
            gender,
            dob: dob.trim(),
            parentName: parentName.trim(),
            parentPhone: parentPhone.trim(),
            parentZalo: parentPhone.trim(),
            address: address.trim(),
            healthNote: healthNote.trim(),
            status: 'Đang học',
          });
        }
      });

      if (results.length === 0) {
        setParseError('Không nhận diện được học sinh nào. Cô hãy kiểm tra lại định dạng copy!');
      } else {
        setParsedStudents(results);
      }
    } catch (err) {
      setParseError('Có lỗi khi đọc văn bản dán!');
    }
  };

  // 3. Parse File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentClass) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

        if (!jsonData || jsonData.length === 0) {
          setParseError('File Excel không có dữ liệu!');
          return;
        }

        const results: Student[] = jsonData.map((row, idx) => {
          const name = row['Họ và tên'] || row['Họ tên'] || row['Ho va ten'] || row['Name'] || `Học sinh ${idx + 1}`;
          const g = (row['Giới tính'] || row['Gioi tinh'] || row['Gender'] || '').toString().toLowerCase().includes('nam') ? 'Nam' : 'Nữ';
          const dobVal = row['Ngày sinh'] || row['Ngay sinh'] || row['DOB'] || '2013-01-01';

          return {
            id: `st-${Date.now()}-${idx}`,
            classId: currentClass.id,
            rollNumber: Number(row['STT']) || (existingCount + idx + 1),
            fullName: name.toString().trim(),
            gender: g,
            dob: dobVal.toString(),
            address: (row['Địa chỉ'] || row['Dia chi'] || '').toString(),
            parentName: (row['Họ tên phụ huynh'] || row['Phụ huynh'] || '').toString(),
            parentPhone: (row['Số điện thoại'] || row['SĐT'] || '').toString(),
            parentZalo: (row['Số điện thoại'] || row['SĐT'] || '').toString(),
            healthNote: (row['Ghi chú sức khỏe'] || '').toString(),
            status: 'Đang học',
          };
        });

        setParsedStudents(results);
        setParseError(null);
      } catch (err) {
        setParseError('Có lỗi khi mở file Excel!');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // 4. Save parsed students to DB
  const handleSaveToDatabase = async () => {
    if (parsedStudents.length === 0) return;

    await db.students.bulkAdd(parsedStudents);
    await onSuccess();
    triggerConfetti();
    alert(`Đã thêm thành công ${parsedStudents.length} học sinh vào lớp! 🎉`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-pink-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black">
                Nhập Danh Sách Học Sinh Vào Lớp {currentClass?.name}
              </h3>
              <p className="text-xs text-pink-100 font-medium">
                Hỗ trợ dán trực tiếp từ Excel hoặc nạp từ file bảng tính
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Method Switcher Tabs */}
        <div className="flex border-b border-pink-100 bg-pink-50/50 px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => {
              setActiveMethod('paste');
              setParsedStudents([]);
            }}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeMethod === 'paste'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardPaste className="w-4 h-4" /> Dán Bảng Từ Excel (Ctrl+V)
          </button>

          <button
            onClick={() => {
              setActiveMethod('file');
              setParsedStudents([]);
            }}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeMethod === 'file'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload className="w-4 h-4" /> Tải File Excel Lên
          </button>

          <button
            onClick={() => setActiveMethod('template')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeMethod === 'template'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileDown className="w-4 h-4" /> Tải File Excel Mẫu Chuẩn
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
          
          {/* Method 1: Paste Clipboard */}
          {activeMethod === 'paste' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-600 leading-relaxed bg-pink-50/60 p-3 rounded-2xl border border-pink-100">
                💡 <strong>Cách làm:</strong> Mở file Excel của cô, chọn bôi đen các ô danh sách học sinh (bao gồm các cột: <em>STT, Họ tên, Giới tính, Ngày sinh, SĐT...</em>) rồi nhấn <strong>Ctrl+C</strong> (hoặc Cmd+C). Sau đó bấm vào ô dưới đây và nhấn <strong>Ctrl+V</strong>.
              </div>

              <textarea
                rows={5}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Dán nội dung bảng copy từ Excel vào đây..."
                className="w-full p-4 rounded-2xl border-2 border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 font-mono text-xs bg-slate-50/50"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleParsePastedText}
                  className="px-5 py-2.5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-md shadow-pink-300/50 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Eye className="w-4 h-4" /> Xem Trước Dữ Liệu
                </button>
              </div>
            </div>
          )}

          {/* Method 2: File Upload */}
          {activeMethod === 'file' && (
            <div className="space-y-4">
              <label className="border-3 border-dashed border-pink-300 rounded-3xl p-10 flex flex-col items-center justify-center gap-3 bg-pink-50/40 hover:bg-pink-100/50 transition-all cursor-pointer text-center">
                <div className="w-14 h-14 rounded-full bg-pink-200 text-pink-700 flex items-center justify-center">
                  <Upload className="w-7 h-7" />
                </div>
                <div className="font-extrabold text-sm text-pink-800">
                  Chọn file Excel từ máy tính (.xlsx, .xls, .csv)
                </div>
                <p className="text-xs text-slate-500">
                  Hỗ trợ trực tiếp file xuất từ VnEdu, SMAS hoặc CSDL ngành
                </p>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}

          {/* Method 3: Template Download */}
          {activeMethod === 'template' && (
            <div className="p-6 rounded-3xl bg-pink-50/80 border border-pink-200 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-pink-200 text-pink-700 mx-auto flex items-center justify-center">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-pink-900">
                Tải Bảng Mẫu Excel Nhập Học Sinh Chuẩn
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                File mẫu đã được thiết lập sẵn đầy đủ các cột chuẩn tiếng Việt: <em>STT, Họ và tên, Giới tính, Ngày sinh, Phụ huynh, SĐT, Địa chỉ, Sức khỏe...</em>
              </p>
              <button
                onClick={handleDownloadTemplate}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-200 inline-flex items-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" /> Tải File Excel Mẫu Về Máy (.xlsx)
              </button>
            </div>
          )}

          {/* Error notice */}
          {parseError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedStudents.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-pink-100">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">
                  ✅ Xem trước ({parsedStudents.length} học sinh được nhận diện):
                </div>
              </div>

              <div className="border border-pink-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-pink-100 text-pink-900 font-black">
                    <tr>
                      <th className="p-2 w-10">STT</th>
                      <th className="p-2">Họ và tên</th>
                      <th className="p-2">Giới tính</th>
                      <th className="p-2">Ngày sinh</th>
                      <th className="p-2">Phụ huynh & SĐT</th>
                      <th className="p-2">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-100 bg-white">
                    {parsedStudents.map((s, idx) => (
                      <tr key={idx} className="hover:bg-pink-50/50">
                        <td className="p-2 font-bold text-pink-600">{s.rollNumber}</td>
                        <td className="p-2 font-bold text-slate-800">{s.fullName}</td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded-md font-bold ${s.gender === 'Nữ' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'}`}>
                            {s.gender}
                          </span>
                        </td>
                        <td className="p-2">{s.dob}</td>
                        <td className="p-2">{s.parentPhone || s.parentName || '—'}</td>
                        <td className="p-2 text-slate-500 truncate max-w-xs">{s.healthNote || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Confirm Save Button */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={handleSaveToDatabase}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs shadow-md shadow-emerald-200 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" /> Xác Nhận Lưu {parsedStudents.length} Học Sinh Này
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
