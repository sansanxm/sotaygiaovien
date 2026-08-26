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
import { downloadStudentTemplateExcel } from '../utils/excelExporter';

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
  const handleDownloadTemplate = async () => {
    await downloadStudentTemplateExcel();
    triggerConfetti();
  };


  // Universal Date Normalizer
  const normalizeExcelDate = (val: any): string => {
    if (!val) return '2014-01-01';
    if (typeof val === 'number') {
      // Excel serial date number
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      return `${d}/${m}/${y}`;
    }
    return String(val).trim();
  };

  // Universal Robust Row Parser
  const parseRawRows = (rows: any[][]): Student[] => {
    if (!currentClass || rows.length === 0) return [];

    let headerRowIdx = -1;
    let colSTT = -1;
    let colName = -1;
    let colLastName = -1;
    let colFirstName = -1;
    let colGender = -1;
    let colDob = -1;
    let colParent = -1;
    let colPhone = -1;
    let colAddress = -1;
    let colHealth = -1;
    let colNote = -1;

    // 1. Scan rows to find the actual header row
    for (let r = 0; r < Math.min(rows.length, 10); r++) {
      const row = rows[r].map((cell) => String(cell || '').toLowerCase().trim());
      const hasName = row.some((c) => c.includes('họ') || c.includes('tên') || c.includes('học sinh'));
      const hasSTT = row.some((c) => c === 'stt' || c.includes('số tt'));
      const hasGender = row.some((c) => c.includes('giới tính') || c.includes('nam') || c.includes('nữ'));

      if (hasName || (hasSTT && hasGender)) {
        headerRowIdx = r;
        row.forEach((cell, idx) => {
          if (cell === 'stt' || cell.includes('số tt') || cell.includes('thứ tự')) colSTT = idx;
          else if (cell.includes('họ và tên') || cell.includes('họ tên') || cell.includes('họ và tên học sinh') || cell.includes('tên học sinh')) colName = idx;
          else if (cell.includes('họ đệm') || cell.includes('họ và chữ lót') || cell === 'họ') colLastName = idx;
          else if (cell === 'tên' || cell === 'ten') colFirstName = idx;
          else if (cell.includes('giới tính') || cell.includes('phái') || cell === 'nam/nữ' || cell === 'nam / nữ') colGender = idx;
          else if (cell.includes('ngày sinh') || cell.includes('năm sinh') || cell.includes('sinh ngày') || cell.includes('dob') || cell.includes('ngày, tháng, năm sinh')) colDob = idx;
          else if (cell.includes('phụ huynh') || cell.includes('cha mẹ') || cell.includes('bố mẹ') || cell.includes('người giám hộ') || cell.includes('họ tên cha') || cell.includes('họ tên mẹ')) colParent = idx;
          else if (cell.includes('điện thoại') || cell.includes('sđt') || cell.includes('phone') || cell.includes('liên hệ') || cell.includes('di động') || cell.includes('zalo')) colPhone = idx;
          else if (cell.includes('địa chỉ') || cell.includes('nơi ở') || cell.includes('thường trú') || cell.includes('tạm trú') || cell.includes('hộ khẩu') || cell.includes('chỗ ở')) colAddress = idx;
          else if (cell.includes('sức khỏe') || cell.includes('bệnh') || cell.includes('cận')) colHealth = idx;
          else if (cell.includes('ghi chú') || cell.includes('khác') || cell.includes('chức vụ') || cell.includes('lưu ý')) colNote = idx;
        });
        break;
      }
    }

    // Heuristic fallbacks if header not explicitly recognized
    const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;
    if (colName === -1 && colFirstName === -1) {
      colSTT = 0;
      colName = 1;
      colGender = 2;
      colDob = 3;
      colParent = 4;
      colPhone = 5;
      colAddress = 6;
      colNote = 7;
    }

    const students: Student[] = [];

    for (let r = startRow; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      let fullName = '';
      if (colName >= 0 && row[colName]) {
        fullName = String(row[colName]).trim();
      } else if (colLastName >= 0 && colFirstName >= 0) {
        const last = String(row[colLastName] || '').trim();
        const first = String(row[colFirstName] || '').trim();
        fullName = `${last} ${first}`.trim();
      } else if (colName === -1 && row[1]) {
        fullName = String(row[1]).trim();
      }

      // Filter out footer rows or title noise
      const lowerName = fullName.toLowerCase();
      if (
        !fullName ||
        lowerName.includes('tổng số') ||
        lowerName.includes('giáo viên') ||
        lowerName.includes('danh sách') ||
        lowerName.includes('năm học') ||
        lowerName.includes('hướng dẫn') ||
        lowerName.includes('chữ ký') ||
        lowerName.startsWith('(*)')
      ) {
        continue;
      }

      // Extract rollNumber
      let roll = existingCount + students.length + 1;
      if (colSTT >= 0 && row[colSTT] && !isNaN(Number(row[colSTT]))) {
        roll = Number(row[colSTT]);
      }

      // Extract gender
      let gender: Gender = 'Nữ';
      if (colGender >= 0 && row[colGender]) {
        const gStr = String(row[colGender]).toLowerCase().trim();
        if (gStr.includes('nam') || gStr === 'm' || gStr === '1') {
          gender = 'Nam';
        }
      }

      // Extract DOB
      let dob = '2014-01-01';
      if (colDob >= 0 && row[colDob]) {
        dob = normalizeExcelDate(row[colDob]);
      }

      // Extract Parent
      let parentName = '';
      if (colParent >= 0 && row[colParent]) {
        parentName = String(row[colParent]).trim();
      }

      // Extract Phone
      let parentPhone = '';
      if (colPhone >= 0 && row[colPhone]) {
        parentPhone = String(row[colPhone]).replace(/[^\d+]/g, '').trim();
      }

      // Extract Address
      let address = '';
      if (colAddress >= 0 && row[colAddress]) {
        address = String(row[colAddress]).trim();
      }

      // Extract Notes
      let note = '';
      if (colHealth >= 0 && row[colHealth]) {
        note = String(row[colHealth]).trim();
      }
      if (colNote >= 0 && row[colNote]) {
        const otherNote = String(row[colNote]).trim();
        note = note ? `${note} - ${otherNote}` : otherNote;
      }

      students.push({
        id: `st-${Date.now()}-${r}-${Math.random().toString(36).slice(2, 6)}`,
        classId: currentClass.id,
        rollNumber: roll,
        fullName,
        gender,
        dob,
        parentName,
        parentPhone,
        parentZalo: parentPhone,
        address,
        healthNote: note,
        status: 'Đang học',
      });
    }

    return students;
  };

  // 2. Parse Pasted TSV/Excel text
  const handleParsePastedText = () => {
    setParseError(null);
    if (!pastedText.trim() || !currentClass) return;

    try {
      const lines = pastedText.trim().split('\n');
      const rawRows = lines.map((line) => line.split('\t').map((c) => c.trim()));
      const results = parseRawRows(rawRows);

      if (results.length === 0) {
        setParseError('Không nhận diện được học sinh nào. Cô hãy kiểm tra lại bảng dữ liệu copy!');
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
        
        // Read as 2D Array of rows to handle any custom header layout accurately
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });

        if (!rawRows || rawRows.length === 0) {
          setParseError('File Excel không có dữ liệu!');
          return;
        }

        const results = parseRawRows(rawRows);

        if (results.length === 0) {
          setParseError('Không nhận diện được học sinh nào trong file Excel. Vui lòng kiểm tra lại file!');
        } else {
          setParsedStudents(results);
          setParseError(null);
        }
      } catch (err) {
        setParseError('Có lỗi khi đọc file Excel!');
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
