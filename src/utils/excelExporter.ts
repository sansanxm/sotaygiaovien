import ExcelJS from 'exceljs';
import type { Student, FundTransaction, TimetableEntry, DayOfWeek } from '../types';



/**
 * Standard Border Style for Cells in Excel
 */
const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } },
};

const FONT_FAMILY = 'Times New Roman';

/**
 * Helper to download workbook buffer in browser
 */
const saveWorkbook = async (workbook: ExcelJS.Workbook, fileName: string) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * 0. Tải File Mẫu Danh Sách Học Sinh Chuẩn Bộ Giáo Dục (Times New Roman, Kẻ Khung, Căn Lề Chuẩn)
 */
export const downloadStudentTemplateExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sổ Tay Giáo Viên 4.0';
  const worksheet = workbook.addWorksheet('Mau_Nhap_Hoc_Sinh');

  worksheet.pageSetup.paperSize = 9; // A4
  worksheet.pageSetup.orientation = 'landscape';

  // 1. Dòng tiêu đề chính
  worksheet.mergeCells('A1:H1');
  const titleRow = worksheet.getCell('A1');
  titleRow.value = 'DANH SÁCH HỌC SINH LỚP [TÊN LỚP] - NĂM HỌC 2026 - 2027';
  titleRow.font = { name: FONT_FAMILY, size: 15, bold: true, color: { argb: 'FF1E3A8A' } };
  titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 32;

  // 2. Dòng ghi chú hướng dẫn
  worksheet.mergeCells('A2:H2');
  const guideRow = worksheet.getCell('A2');
  guideRow.value = '(*) Hướng dẫn: Thầy/Cô nhập thông tin học sinh từ dòng số 4 hoặc sao chép toàn bộ bảng dán vào ứng dụng';
  guideRow.font = { name: FONT_FAMILY, size: 11, italic: true, color: { argb: 'FFDC2626' } };
  guideRow.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 20;

  // 3. Tiêu đề các cột (Header)
  const headers = [
    'STT',
    'Họ và tên học sinh',
    'Giới tính',
    'Ngày sinh',
    'Họ tên phụ huynh',
    'Số điện thoại',
    'Địa chỉ thường trú',
    'Ghi chú sức khỏe / Khác',
  ];

  const headerRow = worksheet.getRow(3);
  headerRow.values = headers;
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.font = { name: FONT_FAMILY, size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' }, // Blue 800
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = THIN_BORDER;
  });

  // 4. Mẫu 5 học sinh demo chuẩn
  const sampleStudents = [
    { stt: 1, name: 'Nguyễn Thảo An', gender: 'Nữ', dob: '15/03/2014', parent: 'Nguyễn Văn Nam', phone: '0912345601', addr: '128 Cầu Giấy, Hà Nội', note: 'Cận thị (ngồi bàn đầu)' },
    { stt: 2, name: 'Trần Gia Bảo', gender: 'Nam', dob: '22/07/2014', parent: 'Trần Văn Hùng', phone: '0912345602', addr: '45 Trần Thái Tông, Hà Nội', note: 'Lớp trưởng' },
    { stt: 3, name: 'Lê Minh Châu', gender: 'Nữ', dob: '05/11/2014', parent: 'Lê Thị Mai', phone: '0912345603', addr: '89 Xuân Thủy, Hà Nội', note: 'Lớp phó học tập' },
    { stt: 4, name: 'Phạm Đức Dũng', gender: 'Nam', dob: '18/02/2014', parent: 'Phạm Văn Dũng', phone: '0912345604', addr: '12 Dịch Vọng Hậu, Hà Nội', note: '' },
    { stt: 5, name: 'Hoàng Ngọc Hà', gender: 'Nữ', dob: '30/09/2014', parent: 'Hoàng Quốc Việt', phone: '0912345605', addr: '230 Hoàng Quốc Việt, Hà Nội', note: 'Dị ứng phấn hoa' },
  ];

  sampleStudents.forEach((st, idx) => {
    const rowNum = 4 + idx;
    const row = worksheet.getRow(rowNum);
    row.values = [st.stt, st.name, st.gender, st.dob, st.parent, st.phone, st.addr, st.note];
    row.height = 24;

    row.eachCell((cell, colNum) => {
      cell.font = { name: FONT_FAMILY, size: 12 };
      cell.border = THIN_BORDER;

      if (colNum === 1 || colNum === 3 || colNum === 4 || colNum === 6) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }

      if (idx % 2 === 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      }
    });
  });

  // Độ rộng cột tự động vừa văn bản
  worksheet.columns = [
    { width: 8 },  // STT
    { width: 26 }, // Họ tên
    { width: 12 }, // Giới tính
    { width: 16 }, // Ngày sinh
    { width: 24 }, // Phụ huynh
    { width: 18 }, // Số điện thoại
    { width: 34 }, // Địa chỉ
    { width: 30 }, // Ghi chú
  ];

  await saveWorkbook(workbook, 'Mau_Danh_Sach_Hoc_Sinh_GVCN_4.0.xlsx');
};

/**
 * 1. Xuất Danh Sách Học Sinh Chuẩn Times New Roman 14
 */

export const exportStudentsToExcel = async (
  students: Student[],
  className: string,
  yearName: string,
  teacherName: string
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sổ Tay Giáo Viên';
  const worksheet = workbook.addWorksheet('Danh Sách Học Sinh');


  // Set page setup
  worksheet.pageSetup.paperSize = 9; // A4
  worksheet.pageSetup.orientation = 'landscape';

  // 1. Tiêu đề chính in HOA
  worksheet.mergeCells('A1:H1');
  const titleRow = worksheet.getCell('A1');
  titleRow.value = `DANH SÁCH HỌC SINH LỚP ${className.toUpperCase()} - NĂM HỌC ${yearName.toUpperCase()}`;
  titleRow.font = { name: FONT_FAMILY, size: 16, bold: true, color: { argb: 'FF002060' } };
  titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  // 2. Thông tin phụ (GVCN, Sĩ số, Ngày in)
  worksheet.mergeCells('A2:H2');
  const subRow = worksheet.getCell('A2');
  subRow.value = `Giáo viên chủ nhiệm: ${teacherName}  |  Sĩ số: ${students.length} học sinh  |  Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`;
  subRow.font = { name: FONT_FAMILY, size: 13, italic: true };
  subRow.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 22;

  // Empty row 3
  worksheet.getRow(3).height = 10;

  // 3. Header Cột
  const headers = [
    'STT',
    'Họ và tên học sinh',
    'Giới tính',
    'Ngày sinh',
    'Họ tên phụ huynh',
    'Số điện thoại',
    'Địa chỉ thường trú',
    'Ghi chú sức khỏe / Khác',
  ];

  const headerRow = worksheet.getRow(4);
  headerRow.values = headers;
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' }, // Dark Navy Blue
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = THIN_BORDER;
  });

  // 4. Data Rows
  students.forEach((st, idx) => {
    const rowNum = 5 + idx;
    const row = worksheet.getRow(rowNum);
    row.values = [
      st.rollNumber || idx + 1,
      st.fullName,
      st.gender,
      st.dob,
      st.parentName || '',
      st.parentPhone || '',
      st.address || '',
      st.healthNote || st.notes || '',
    ];
    row.height = 24;

    row.eachCell((cell, colNum) => {
      cell.font = { name: FONT_FAMILY, size: 14 };
      cell.border = THIN_BORDER;

      // Center STT, Gender, DOB, Phone
      if (colNum === 1 || colNum === 3 || colNum === 4 || colNum === 6) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      }

      // Alternating row background
      if (idx % 2 === 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F6FA' },
        };
      }
    });
  });

  // Column Widths
  worksheet.columns = [
    { width: 8 },  // STT
    { width: 26 }, // Họ tên
    { width: 12 }, // Giới tính
    { width: 16 }, // Ngày sinh
    { width: 24 }, // Phụ huynh
    { width: 18 }, // SĐT
    { width: 32 }, // Địa chỉ
    { width: 28 }, // Ghi chú
  ];

  await saveWorkbook(workbook, `Danh_Sach_Hoc_Sinh_${className}.xlsx`);
};

/**
 * 2. Xuất Sổ Điểm Danh Theo Ngày
 */
export const exportAttendanceToExcel = async (
  records: { student: Student; status: string; note?: string }[],
  className: string,
  dateStr: string,
  session: string,
  teacherName: string
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Điểm Danh Ngày');

  worksheet.pageSetup.paperSize = 9;
  worksheet.pageSetup.orientation = 'portrait';

  // Tiêu đề in HOA
  worksheet.mergeCells('A1:F1');
  const titleRow = worksheet.getCell('A1');
  titleRow.value = `BẢNG THEO DÕI ĐIỂM DANH LỚP ${className.toUpperCase()}`;
  titleRow.font = { name: FONT_FAMILY, size: 16, bold: true, color: { argb: 'FF002060' } };
  titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  worksheet.mergeCells('A2:F2');
  const subRow = worksheet.getCell('A2');
  subRow.value = `Ngày: ${dateStr}  |  Buổi: ${session === 'morning' || session === 'Sáng' ? 'Sáng' : 'Chiều'}  |  GVCN: ${teacherName}`;
  subRow.font = { name: FONT_FAMILY, size: 13, italic: true };
  subRow.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 22;

  worksheet.getRow(3).height = 10;

  const headers = ['STT', 'Họ và tên học sinh', 'Giới tính', 'Trạng thái điểm danh', 'SĐT Phụ huynh', 'Ghi chú'];
  const headerRow = worksheet.getRow(4);
  headerRow.values = headers;
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.font = { name: FONT_FAMILY, size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = THIN_BORDER;
  });

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'Có mặt';
      case 'late': return 'Đi muộn';
      case 'excused': return 'Vắng có phép';
      case 'unexcused': return 'Vắng không phép';
      default: return 'Chưa điểm danh';
    }
  };

  records.forEach((rec, idx) => {
    const rowNum = 5 + idx;
    const row = worksheet.getRow(rowNum);
    row.values = [
      rec.student.rollNumber || idx + 1,
      rec.student.fullName,
      rec.student.gender,
      getStatusText(rec.status),
      rec.student.parentPhone || '',
      rec.note || '',
    ];
    row.height = 24;

    row.eachCell((cell, colNum) => {
      cell.font = { name: FONT_FAMILY, size: 13 };
      cell.border = THIN_BORDER;

      if (colNum === 1 || colNum === 3 || colNum === 4 || colNum === 5) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    });
  });

  worksheet.columns = [
    { width: 8 },
    { width: 28 },
    { width: 12 },
    { width: 22 },
    { width: 18 },
    { width: 26 },
  ];

  await saveWorkbook(workbook, `Diem_Danh_${className}_${dateStr}.xlsx`);
};

/**
 * 2.1 Xuất Sổ Điểm Danh THEO TUẦN (Ma trận Thứ 2 -> Thứ 7 & Thống kê P, K, M)
 */
export const exportAttendanceWeeklyReport = async (
  students: Student[],
  allRecords: { studentId: string; date: string; session: string; status: string }[],
  weekDays: { date: string; dayLabel: string }[],
  weekTitle: string,
  className: string,
  yearName: string,
  teacherName: string
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Diem_Danh_Tuan');

  worksheet.pageSetup.paperSize = 9;
  worksheet.pageSetup.orientation = 'landscape';

  const totalCols = 2 + weekDays.length * 2 + 4; // STT, Name, (Sang+Chieu)*days, CoMat, P, K, M

  // 1. Tiêu đề
  worksheet.mergeCells(1, 1, 1, totalCols);
  const title = worksheet.getCell('A1');
  title.value = `SỔ THEO DÕI ĐIỂM DANH HỌC SINH THEO TUẦN - ${weekTitle.toUpperCase()}`;
  title.font = { name: FONT_FAMILY, size: 15, bold: true, color: { argb: 'FF002060' } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  worksheet.mergeCells(2, 1, 2, totalCols);
  const sub = worksheet.getCell('A2');
  sub.value = `Lớp: ${className}  |  Năm học: ${yearName}  |  Giáo viên chủ nhiệm: ${teacherName}  |  Sĩ số: ${students.length}`;
  sub.font = { name: FONT_FAMILY, size: 12, italic: true };
  sub.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 20;

  // 2. Header Rows (2 Level Header)
  // Row 4: Day Names & General Categories
  worksheet.mergeCells('A4:A5');
  worksheet.getCell('A4').value = 'STT';
  worksheet.mergeCells('B4:B5');
  worksheet.getCell('B4').value = 'Họ và tên học sinh';

  let currentC = 3;
  weekDays.forEach((wd) => {
    worksheet.mergeCells(4, currentC, 4, currentC + 1);
    const dayCell = worksheet.getCell(4, currentC);
    dayCell.value = `${wd.dayLabel}\n(${wd.date.slice(5)})`;
    dayCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    worksheet.getCell(5, currentC).value = 'S';
    worksheet.getCell(5, currentC + 1).value = 'C';
    currentC += 2;
  });

  worksheet.mergeCells(4, currentC, 4, currentC + 3);
  worksheet.getCell(4, currentC).value = 'Tổng kết tuần';
  worksheet.getCell(5, currentC).value = 'Đủ';
  worksheet.getCell(5, currentC + 1).value = 'P';
  worksheet.getCell(5, currentC + 2).value = 'K';
  worksheet.getCell(5, currentC + 3).value = 'M';

  [4, 5].forEach((r) => {
    const row = worksheet.getRow(r);
    row.height = 24;
    row.eachCell((cell) => {
      cell.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = THIN_BORDER;
    });
  });

  // 3. Map student rows
  const recordMap = new Map<string, string>(); // `${studentId}_${date}_${session}` -> status
  allRecords.forEach((r) => {
    recordMap.set(`${r.studentId}_${r.date}_${r.session}`, r.status);
  });

  students.forEach((st, idx) => {
    const rowNum = 6 + idx;
    const row = worksheet.getRow(rowNum);
    const values: any[] = [st.rollNumber || idx + 1, st.fullName];

    let presentCount = 0;
    let excusedCount = 0;
    let unexcusedCount = 0;
    let lateCount = 0;

    weekDays.forEach((wd) => {
      ['Sáng', 'Chiều'].forEach((sess) => {
        const status = recordMap.get(`${st.id}_${wd.date}_${sess}`);
        if (status === 'present') {
          values.push('✓');
          presentCount++;
        } else if (status === 'excused') {
          values.push('P');
          excusedCount++;
        } else if (status === 'unexcused') {
          values.push('K');
          unexcusedCount++;
        } else if (status === 'late') {
          values.push('M');
          lateCount++;
        } else {
          values.push('');
        }
      });
    });

    values.push(presentCount, excusedCount, unexcusedCount, lateCount);
    row.values = values;
    row.height = 22;

    row.eachCell((cell, colNum) => {
      cell.font = { name: FONT_FAMILY, size: 11 };
      cell.border = THIN_BORDER;
      cell.alignment = { horizontal: colNum === 2 ? 'left' : 'center', vertical: 'middle' };

      // Highlight absences
      const val = cell.value;
      if (val === 'K') {
        cell.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: 'FFDC2626' } };
      } else if (val === 'P') {
        cell.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: 'FFD97706' } };
      } else if (val === 'M') {
        cell.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: 'FF2563EB' } };
      }
    });
  });

  // Column Widths
  const widths = [{ width: 6 }, { width: 24 }];
  weekDays.forEach(() => {
    widths.push({ width: 5 }, { width: 5 });
  });
  widths.push({ width: 6 }, { width: 6 }, { width: 6 }, { width: 6 });
  worksheet.columns = widths;

  await saveWorkbook(workbook, `Diem_Danh_Tuan_${className}_${weekTitle.replace(/\s+/g, '_')}.xlsx`);
};

/**
 * 2.2 Xuất Sổ Điểm Danh THEO THÁNG (Ma trận Ngày 1 -> 31)
 */
export const exportAttendanceMonthlyReport = async (
  students: Student[],
  allRecords: { studentId: string; date: string; session: string; status: string }[],
  monthNumber: number,
  yearNumber: number,
  className: string,
  yearName: string,
  teacherName: string
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`Thang_${monthNumber}`);

  worksheet.pageSetup.paperSize = 9;
  worksheet.pageSetup.orientation = 'landscape';

  const daysInMonth = new Date(yearNumber, monthNumber, 0).getDate();
  const totalCols = 2 + daysInMonth + 4; // STT, Name, 1..N, CoMat, P, K, M

  worksheet.mergeCells(1, 1, 1, totalCols);
  const title = worksheet.getCell('A1');
  title.value = `SỔ THEO DÕI ĐIỂM DANH HỌC SINH THÁNG ${monthNumber} NĂM ${yearNumber}`;
  title.font = { name: FONT_FAMILY, size: 15, bold: true, color: { argb: 'FF002060' } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  worksheet.mergeCells(2, 1, 2, totalCols);
  const sub = worksheet.getCell('A2');
  sub.value = `Lớp: ${className}  |  Năm học: ${yearName}  |  Giáo viên chủ nhiệm: ${teacherName}  |  Sĩ số: ${students.length} học sinh`;
  sub.font = { name: FONT_FAMILY, size: 12, italic: true };
  sub.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 20;

  // Header
  const headers = ['STT', 'Họ và tên học sinh'];
  for (let d = 1; d <= daysInMonth; d++) {
    headers.push(String(d));
  }
  headers.push('Tổng Đủ', 'Vắng P', 'Vắng K', 'Muộn');

  const headerRow = worksheet.getRow(4);
  headerRow.values = headers;
  headerRow.height = 26;

  headerRow.eachCell((cell) => {
    cell.font = { name: FONT_FAMILY, size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = THIN_BORDER;
  });

  const recordMap = new Map<string, string>();
  allRecords.forEach((r) => {
    recordMap.set(`${r.studentId}_${r.date}`, r.status);
  });

  students.forEach((st, idx) => {
    const rowNum = 5 + idx;
    const row = worksheet.getRow(rowNum);
    const values: any[] = [st.rollNumber || idx + 1, st.fullName];

    let present = 0;
    let pCount = 0;
    let kCount = 0;
    let mCount = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = String(d).padStart(2, '0');
      const mStr = String(monthNumber).padStart(2, '0');
      const fullDate = `${yearNumber}-${mStr}-${dStr}`;

      const status = recordMap.get(`${st.id}_${fullDate}`);
      if (status === 'present') {
        values.push('✓');
        present++;
      } else if (status === 'excused') {
        values.push('P');
        pCount++;
      } else if (status === 'unexcused') {
        values.push('K');
        kCount++;
      } else if (status === 'late') {
        values.push('M');
        mCount++;
      } else {
        values.push('');
      }
    }

    values.push(present, pCount, kCount, mCount);
    row.values = values;
    row.height = 20;

    row.eachCell((cell, colNum) => {
      cell.font = { name: FONT_FAMILY, size: 10 };
      cell.border = THIN_BORDER;
      cell.alignment = { horizontal: colNum === 2 ? 'left' : 'center', vertical: 'middle' };
    });
  });

  const colWidths = [{ width: 6 }, { width: 24 }];
  for (let d = 1; d <= daysInMonth; d++) {
    colWidths.push({ width: 3.5 });
  }
  colWidths.push({ width: 8 }, { width: 7 }, { width: 7 }, { width: 7 });
  worksheet.columns = colWidths;

  await saveWorkbook(workbook, `Diem_Danh_Thang_${monthNumber}_${className}.xlsx`);
};

/**
 * 2.3 Xuất Báo Cáo Điểm Danh THEO HỌC KỲ / CẢ NĂM (Tổng hợp chuyên cần & Nề nếp)
 */
export const exportAttendanceTermReport = async (
  students: Student[],
  summaryData: {
    student: Student;
    totalPresent: number;
    totalExcused: number;
    totalUnexcused: number;
    totalLate: number;
    attendanceRate: string;
    conductNote: string;
  }[],
  termName: string,
  className: string,
  yearName: string,
  teacherName: string
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Tong_Ket_Chuyen_Can');

  worksheet.pageSetup.paperSize = 9;
  worksheet.pageSetup.orientation = 'portrait';

  worksheet.mergeCells('A1:H1');
  const title = worksheet.getCell('A1');
  title.value = `BẢNG TỔNG HỢP CHUYÊN CẦN & ĐIỂM DANH - ${termName.toUpperCase()}`;
  title.font = { name: FONT_FAMILY, size: 15, bold: true, color: { argb: 'FF002060' } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  worksheet.mergeCells('A2:H2');
  const sub = worksheet.getCell('A2');
  sub.value = `Lớp: ${className}  |  Năm học: ${yearName}  |  GVCN: ${teacherName}  |  Sĩ số: ${students.length}`;
  sub.font = { name: FONT_FAMILY, size: 12, italic: true };
  sub.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 20;

  const headers = [
    'STT',
    'Họ và tên học sinh',
    'Số buổi có mặt',
    'Vắng có phép (P)',
    'Vắng không phép (K)',
    'Số lần đi muộn (M)',
    'Tỷ lệ chuyên cần',
    'Đánh giá chuyên cần',
  ];

  const headerRow = worksheet.getRow(4);
  headerRow.values = headers;
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = THIN_BORDER;
  });

  summaryData.forEach((item, idx) => {
    const rowNum = 5 + idx;
    const row = worksheet.getRow(rowNum);
    row.values = [
      item.student.rollNumber || idx + 1,
      item.student.fullName,
      item.totalPresent,
      item.totalExcused,
      item.totalUnexcused,
      item.totalLate,
      item.attendanceRate,
      item.conductNote,
    ];
    row.height = 22;

    row.eachCell((cell, colNum) => {
      cell.font = { name: FONT_FAMILY, size: 12 };
      cell.border = THIN_BORDER;
      cell.alignment = { horizontal: colNum === 2 || colNum === 8 ? 'left' : 'center', vertical: 'middle' };
    });
  });

  worksheet.columns = [
    { width: 8 },
    { width: 28 },
    { width: 16 },
    { width: 18 },
    { width: 20 },
    { width: 18 },
    { width: 18 },
    { width: 25 },
  ];

  // Chữ ký cuối bảng
  const signRowIdx = 5 + summaryData.length + 2;
  worksheet.mergeCells(`B${signRowIdx}:C${signRowIdx}`);
  worksheet.getCell(`B${signRowIdx}`).value = 'HIỆU TRƯỞNG\n(Ký và ghi rõ họ tên)';
  worksheet.getCell(`B${signRowIdx}`).font = { name: FONT_FAMILY, size: 12, bold: true };
  worksheet.getCell(`B${signRowIdx}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  worksheet.mergeCells(`F${signRowIdx}:H${signRowIdx}`);
  worksheet.getCell(`F${signRowIdx}`).value = `GIÁO VIÊN CHỦ NHIỆM\n${teacherName}`;
  worksheet.getCell(`F${signRowIdx}`).font = { name: FONT_FAMILY, size: 12, bold: true };
  worksheet.getCell(`F${signRowIdx}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  await saveWorkbook(workbook, `Tong_Hop_Diem_Danh_${termName.replace(/\s+/g, '_')}_${className}.xlsx`);
};

/**
 * 3. Xuất Báo Cáo Thu Chi Quỹ Lớp Chuẩn Times New Roman 14
 */

export const exportFundToExcel = async (
  transactions: FundTransaction[],
  className: string,
  totalIncome: number,
  totalExpense: number,
  balance: number,
  teacherName: string
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Quỹ Lớp');

  worksheet.pageSetup.paperSize = 9;
  worksheet.pageSetup.orientation = 'landscape';

  // Tiêu đề in HOA
  worksheet.mergeCells('A1:F1');
  const titleRow = worksheet.getCell('A1');
  titleRow.value = `BÁO CÁO THU CHI QUỸ LỚP ${className.toUpperCase()}`;
  titleRow.font = { name: FONT_FAMILY, size: 16, bold: true, color: { argb: 'FF002060' } };
  titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  worksheet.mergeCells('A2:F2');
  const subRow = worksheet.getCell('A2');
  subRow.value = `Tổng thu: ${totalIncome.toLocaleString('vi-VN')} đ  |  Tổng chi: ${totalExpense.toLocaleString('vi-VN')} đ  |  SỐ DƯ HIỆN TẠI: ${balance.toLocaleString('vi-VN')} đ  |  GVCN: ${teacherName}`;
  subRow.font = { name: FONT_FAMILY, size: 13, bold: true };
  subRow.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 24;

  worksheet.getRow(3).height = 10;

  const headers = ['STT', 'Ngày tháng', 'Loại giao dịch', 'Nội dung khoản thu / chi', 'Số tiền (VNĐ)', 'Ghi chú'];
  const headerRow = worksheet.getRow(4);
  headerRow.values = headers;
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = THIN_BORDER;
  });

  transactions.forEach((tx, idx) => {
    const rowNum = 5 + idx;
    const row = worksheet.getRow(rowNum);
    const isIncome = tx.type === 'income';

    row.values = [
      idx + 1,
      tx.date,
      isIncome ? 'Thu quỹ (+)' : 'Chi tiêu (-)',
      tx.title,
      tx.amount,
      tx.note || '',
    ];

    row.height = 24;

    row.eachCell((cell, colNum) => {
      cell.font = { name: FONT_FAMILY, size: 14 };
      cell.border = THIN_BORDER;

      if (colNum === 1 || colNum === 2 || colNum === 3) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colNum === 5) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0 "đ"';
        cell.font = {
          name: FONT_FAMILY,
          size: 14,
          bold: true,
          color: { argb: isIncome ? 'FF008000' : 'FFC00000' },
        };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    });
  });

  worksheet.columns = [
    { width: 8 },
    { width: 16 },
    { width: 18 },
    { width: 34 },
    { width: 22 },
    { width: 26 },
  ];

  await saveWorkbook(workbook, `Bao_Cao_Quy_Lop_${className}.xlsx`);
};

/**
 * 4. Xuất Báo Cáo Nề Nếp & Thi Đua Chuẩn Times New Roman 14
 */
export const exportBehaviorToExcel = async (
  leaderboard: { student: Student; points: number; praises: number; violations: number }[],
  className: string,
  teacherName: string
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Thi Đua Nề Nếp');

  worksheet.pageSetup.paperSize = 9;
  worksheet.pageSetup.orientation = 'portrait';

  worksheet.mergeCells('A1:F1');
  const titleRow = worksheet.getCell('A1');
  titleRow.value = `BẢNG TỔNG HỢP NỀ NẾP & THI ĐUA LỚP ${className.toUpperCase()}`;
  titleRow.font = { name: FONT_FAMILY, size: 16, bold: true, color: { argb: 'FF002060' } };
  titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  worksheet.mergeCells('A2:F2');
  const subRow = worksheet.getCell('A2');
  subRow.value = `Giáo viên chủ nhiệm: ${teacherName}  |  Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`;
  subRow.font = { name: FONT_FAMILY, size: 13, italic: true };
  subRow.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 22;

  worksheet.getRow(3).height = 10;

  const headers = ['Hạng', 'STT', 'Họ và tên học sinh', 'Lượt khen (+)', 'Lượt nhắc (-)', 'Tổng điểm thi đua'];
  const headerRow = worksheet.getRow(4);
  headerRow.values = headers;
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = THIN_BORDER;
  });

  leaderboard.forEach((item, idx) => {
    const rowNum = 5 + idx;
    const row = worksheet.getRow(rowNum);
    row.values = [
      idx + 1,
      item.student.rollNumber,
      item.student.fullName,
      item.praises,
      item.violations,
      item.points,
    ];
    row.height = 24;

    row.eachCell((cell, colNum) => {
      cell.font = { name: FONT_FAMILY, size: 14 };
      cell.border = THIN_BORDER;

      if (colNum === 1 || colNum === 2 || colNum === 4 || colNum === 5 || colNum === 6) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }

      if (colNum === 6) {
        cell.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: item.points >= 0 ? 'FF008000' : 'FFC00000' } };
      }
    });
  });

  worksheet.columns = [
    { width: 10 },
    { width: 8 },
    { width: 28 },
    { width: 16 },
    { width: 16 },
    { width: 20 },
  ];

  await saveWorkbook(workbook, `Thi_Dua_Ne_Nep_${className}.xlsx`);
};

/**
 * 5. Xuất Thời Khóa Biểu Chuẩn Times New Roman 14
 */
export const exportTimetableToExcel = async (
  entries: TimetableEntry[],
  className: string,
  yearName: string,
  teacherName: string
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Thời Khóa Biểu');

  worksheet.pageSetup.paperSize = 9; // A4
  worksheet.pageSetup.orientation = 'landscape';

  // 1. Tiêu đề chính in HOA
  worksheet.mergeCells('A1:H1');
  const titleRow = worksheet.getCell('A1');
  titleRow.value = `THỜI KHÓA BIỂU LỚP ${className.toUpperCase()} - NĂM HỌC ${yearName.toUpperCase()}`;
  titleRow.font = { name: FONT_FAMILY, size: 16, bold: true, color: { argb: 'FF002060' } };
  titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  // 2. Thông tin phụ
  worksheet.mergeCells('A2:H2');
  const subRow = worksheet.getCell('A2');
  subRow.value = `Giáo viên chủ nhiệm: ${teacherName}  |  Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`;
  subRow.font = { name: FONT_FAMILY, size: 13, italic: true };
  subRow.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 22;

  worksheet.getRow(3).height = 10;

  // Header cột: Buổi, Tiết, Thứ 2, Thứ 3, Thứ 4, Thứ 5, Thứ 6, Thứ 7
  const headers = ['Buổi', 'Tiết', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const headerRow = worksheet.getRow(4);
  headerRow.values = headers;
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = THIN_BORDER;
  });

  const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  const getSubjectCell = (day: DayOfWeek, session: 'morning' | 'afternoon', period: number) => {
    const entry = entries.find(
      (e) => e.dayOfWeek === day && e.session === session && e.period === period
    );
    if (!entry || !entry.subject) return '—';
    let text = entry.subject;
    if (entry.teacher) text += `\n(${entry.teacher})`;
    return text;
  };

  let currentRowNum = 5;

  // Buổi Sáng (5 Tiết)
  for (let p = 1; p <= 5; p++) {
    const row = worksheet.getRow(currentRowNum);
    const rowValues = [
      p === 1 ? 'SÁNG' : '',
      `Tiết ${p}`,
      ...days.map((d) => getSubjectCell(d, 'morning', p)),
    ];
    row.values = rowValues;
    row.height = 32;

    row.eachCell((cell) => {
      cell.font = { name: FONT_FAMILY, size: 14 };
      cell.border = THIN_BORDER;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    currentRowNum++;
  }

  // Merge Cột 'Buổi' cho 5 tiết Sáng
  worksheet.mergeCells(`A5:A9`);
  const morningCell = worksheet.getCell('A5');
  morningCell.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: 'FF002060' } };
  morningCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F6FA' } };

  // Buổi Chiều (5 Tiết)
  const afternoonStartRow = currentRowNum;
  for (let p = 1; p <= 5; p++) {
    const row = worksheet.getRow(currentRowNum);
    const rowValues = [
      p === 1 ? 'CHIỀU' : '',
      `Tiết ${p}`,
      ...days.map((d) => getSubjectCell(d, 'afternoon', p)),
    ];
    row.values = rowValues;
    row.height = 32;

    row.eachCell((cell) => {
      cell.font = { name: FONT_FAMILY, size: 14 };
      cell.border = THIN_BORDER;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    currentRowNum++;
  }

  // Merge Cột 'Buổi' cho 5 tiết Chiều
  worksheet.mergeCells(`A${afternoonStartRow}:A${afternoonStartRow + 4}`);
  const afternoonCell = worksheet.getCell(`A${afternoonStartRow}`);
  afternoonCell.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: 'FF002060' } };
  afternoonCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F6FA' } };

  worksheet.columns = [
    { width: 12 }, // Buổi
    { width: 12 }, // Tiết
    { width: 22 }, // Thứ 2
    { width: 22 }, // Thứ 3
    { width: 22 }, // Thứ 4
    { width: 22 }, // Thứ 5
    { width: 22 }, // Thứ 6
    { width: 22 }, // Thứ 7
  ];

  await saveWorkbook(workbook, `Thoi_Khoa_Bieu_${className}.xlsx`);
};

