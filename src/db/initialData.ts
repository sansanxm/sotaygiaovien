import { db } from './db';
import type {
  SchoolYear,
  ClassRoom,
  Student,
  CommentTemplate,
  FundTransaction,
  BehaviorLog,
  Seat,
  TeacherTodo,
  TimetableEntry,
} from '../types';


export const INITIAL_YEARS: SchoolYear[] = [
  {
    id: 'year-2025-2026',
    name: 'Năm học 2025 - 2026',
    isCurrent: true,
    startDate: '2025-09-05',
    endDate: '2026-05-31',
  },
  {
    id: 'year-2024-2025',
    name: 'Năm học 2024 - 2025',
    isCurrent: false,
    startDate: '2024-09-05',
    endDate: '2025-05-31',
  },
];

export const INITIAL_CLASSES: ClassRoom[] = [
  {
    id: 'class-6a1',
    yearId: 'year-2025-2026',
    name: 'Lớp 6A1',
    grade: 6,
    roomNumber: 'Phòng 204 - Dãy B',
    homeroomTeacher: 'Cô giáo Nga (0988.123.456)',
    totalDesks: 16,
    rows: 4,
    cols: 4,
    note: 'Lớp chuyên cần, có nhiều bạn năng khiếu văn nghệ và thể thao.',
  },
  {
    id: 'class-7a2',
    yearId: 'year-2025-2026',
    name: 'Lớp 7A2',
    grade: 7,
    roomNumber: 'Phòng 302 - Dãy A',
    homeroomTeacher: 'Cô giáo Nga',
    totalDesks: 16,
    rows: 4,
    cols: 4,
    note: 'Lớp phụ trách năm ngoái.',
  },
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'st-01',
    classId: 'class-6a1',
    rollNumber: 1,
    fullName: 'Nguyễn Thảo An',
    gender: 'Nữ',
    dob: '2013-03-12',
    address: '128 Cầu Giấy, Hà Nội',
    parentName: 'Mẹ - Nguyễn Thị Mai',
    parentPhone: '0912345601',
    parentZalo: '0912345601',
    healthNote: 'Cận 1.5 độ (ưu tiên ngồi bàn đầu)',
    status: 'Đang học',
    avatarSeed: 'ThaoAn',
  },
  {
    id: 'st-02',
    classId: 'class-6a1',
    rollNumber: 2,
    fullName: 'Trần Gia Bảo',
    gender: 'Nam',
    dob: '2013-05-18',
    address: '45 Trần Thái Tông, Hà Nội',
    parentName: 'Bố - Trần Văn Hùng',
    parentPhone: '0912345602',
    parentZalo: '0912345602',
    healthNote: 'Bình thường',
    status: 'Đang học',
    avatarSeed: 'GiaBao',
  },
  {
    id: 'st-03',
    classId: 'class-6a1',
    rollNumber: 3,
    fullName: 'Lê Minh Châu',
    gender: 'Nữ',
    dob: '2013-11-20',
    address: '88 Nguyễn Phong Sắc, Hà Nội',
    parentName: 'Mẹ - Lê Thu Hà',
    parentPhone: '0912345603',
    parentZalo: '0912345603',
    healthNote: 'Dị ứng phấn hoa',
    status: 'Đang học',
    avatarSeed: 'MinhChau',
  },
  {
    id: 'st-04',
    classId: 'class-6a1',
    rollNumber: 4,
    fullName: 'Phạm Tiến Đạt',
    gender: 'Nam',
    dob: '2013-08-25',
    address: '12 Dịch Vọng Hậu, Hà Nội',
    parentName: 'Mẹ - Phạm Thu Hương',
    parentPhone: '0912345604',
    parentZalo: '0912345604',
    healthNote: '',
    status: 'Đang học',
    avatarSeed: 'TienDat',
  },
  {
    id: 'st-05',
    classId: 'class-6a1',
    rollNumber: 5,
    fullName: 'Hoàng Thùy Dương',
    gender: 'Nữ',
    dob: '2013-02-14',
    address: '26 Duy Tân, Hà Nội',
    parentName: 'Bố - Hoàng Đức',
    parentPhone: '0912345605',
    parentZalo: '0912345605',
    healthNote: 'Lớp trưởng',
    status: 'Đang học',
    avatarSeed: 'ThuyDuong',
  },
  {
    id: 'st-06',
    classId: 'class-6a1',
    rollNumber: 6,
    fullName: 'Vũ Đức Hải',
    gender: 'Nam',
    dob: '2013-09-02',
    address: '67 Xuân Thủy, Hà Nội',
    parentName: 'Mẹ - Vũ Thị Lan',
    parentPhone: '0912345606',
    parentZalo: '0912345606',
    healthNote: '',
    status: 'Đang học',
    avatarSeed: 'DucHai',
  },
  {
    id: 'st-07',
    classId: 'class-6a1',
    rollNumber: 7,
    fullName: 'Đỗ Khánh Linh',
    gender: 'Nữ',
    dob: '2013-10-10',
    address: '15 Tôn Thất Thuyết, Hà Nội',
    parentName: 'Mẹ - Đỗ Mỹ Linh',
    parentPhone: '0912345607',
    parentZalo: '0912345607',
    healthNote: 'Lớp phó học tập',
    status: 'Đang học',
    avatarSeed: 'KhanhLinh',
  },
  {
    id: 'st-08',
    classId: 'class-6a1',
    rollNumber: 8,
    fullName: 'Bùi Quang Minh',
    gender: 'Nam',
    dob: '2013-04-30',
    address: '90 Hoàng Quốc Việt, Hà Nội',
    parentName: 'Bố - Bùi Nam',
    parentPhone: '0912345608',
    parentZalo: '0912345608',
    healthNote: '',
    status: 'Đang học',
    avatarSeed: 'QuangMinh',
  },
  {
    id: 'st-09',
    classId: 'class-6a1',
    rollNumber: 9,
    fullName: 'Ngô Bảo Ngọc',
    gender: 'Nữ',
    dob: '2013-12-05',
    address: '33 Nghĩa Tân, Hà Nội',
    parentName: 'Mẹ - Nguyễn Ánh',
    parentPhone: '0912345609',
    parentZalo: '0912345609',
    healthNote: '',
    status: 'Đang học',
    avatarSeed: 'BaoNgoc',
  },
  {
    id: 'st-10',
    classId: 'class-6a1',
    rollNumber: 10,
    fullName: 'Đinh Quốc Phong',
    gender: 'Nam',
    dob: '2013-06-19',
    address: '74 Phạm Hùng, Hà Nội',
    parentName: 'Bố - Đinh Văn Toàn',
    parentPhone: '0912345610',
    parentZalo: '0912345610',
    healthNote: '',
    status: 'Đang học',
    avatarSeed: 'QuocPhong',
  },
  {
    id: 'st-11',
    classId: 'class-6a1',
    rollNumber: 11,
    fullName: 'Lý Quỳnh Trang',
    gender: 'Nữ',
    dob: '2013-07-08',
    address: '52 Trung Kính, Hà Nội',
    parentName: 'Mẹ - Lý Hồng Nhung',
    parentPhone: '0912345611',
    parentZalo: '0912345611',
    healthNote: '',
    status: 'Đang học',
    avatarSeed: 'QuynhTrang',
  },
  {
    id: 'st-12',
    classId: 'class-6a1',
    rollNumber: 12,
    fullName: 'Dương Tuấn Vũ',
    gender: 'Nam',
    dob: '2013-01-22',
    address: '101 Yên Hòa, Hà Nội',
    parentName: 'Bố - Dương Văn Lâm',
    parentPhone: '0912345612',
    parentZalo: '0912345612',
    healthNote: '',
    status: 'Đang học',
    avatarSeed: 'TuanVu',
  },
];

export const INITIAL_COMMENT_TEMPLATES: CommentTemplate[] = [
  {
    id: 'cmt-01',
    category: 'Khen ngợi',
    gradeLevel: 'Chung',
    content: 'Em chăm ngoan, lễ phép, có ý thức tự giác học tập cao và tích cực tham gia các hoạt động tập thể.',
    tags: ['Chăm chỉ', 'Lễ phép', 'Tự giác'],
  },
  {
    id: 'cmt-02',
    category: 'Khen ngợi',
    gradeLevel: 'Chung',
    content: 'Có tư duy nhanh nhẹn, tiếp thu bài tốt, luôn hoàn thành xuất sắc các nhiệm vụ học tập được giao.',
    tags: ['Xuất sắc', 'Tư duy tốt'],
  },
  {
    id: 'cmt-03',
    category: 'Khích lệ',
    gradeLevel: 'Chung',
    content: 'Em có nhiều tiến bộ rõ rệt trong học tập và rèn luyện. Cần tiếp tục phát huy sự tự tin trong phát biểu xây dựng bài.',
    tags: ['Tiến bộ', 'Tự tin'],
  },
  {
    id: 'cmt-04',
    category: 'Cần cố gắng',
    gradeLevel: 'Chung',
    content: 'Em ngoan ngoãn, hòa đồng với bạn bè. Cần tập trung hơn trong giờ học và rèn luyện tính cẩn thận khi làm bài tập.',
    tags: ['Tập trung', 'Cẩn thận'],
  },
  {
    id: 'cmt-05',
    category: 'Nề nếp',
    gradeLevel: 'Chung',
    content: 'Chấp hành tốt nội quy trường lớp, trang phục gọn gàng, đi học đúng giờ và có tinh thần giữ gìn vệ sinh chung.',
    tags: ['Nề nếp', 'Kỷ luật'],
  },
  {
    id: 'cmt-06',
    category: 'Kỹ năng',
    gradeLevel: 'Chung',
    content: 'Có kỹ năng làm việc nhóm tốt, có tinh thần tương thân tương ái, luôn sẵn sàng giúp đỡ các bạn trong lớp.',
    tags: ['Làm việc nhóm', 'Hòa đồng'],
  },
];

export const INITIAL_FUND_TRANSACTIONS: FundTransaction[] = [
  {
    id: 'fund-01',
    classId: 'class-6a1',
    type: 'income',
    category: 'Quỹ lớp',
    title: 'Thu quỹ lớp Học kỳ 1 (Đợt 1)',
    amount: 3600000,
    date: '2025-09-15',
    payerOrReceiver: 'Ban đại diện CMHS',
    note: 'Thu 300.000đ / học sinh',
    targetAmountPerStudent: 300000,
    paidStudentIds: ['st-01', 'st-02', 'st-03', 'st-04', 'st-05', 'st-06', 'st-07', 'st-08', 'st-09', 'st-10', 'st-11', 'st-12'],
  },
  {
    id: 'fund-02',
    classId: 'class-6a1',
    type: 'expense',
    category: 'Cơ sở vật chất',
    title: 'Mua cây lau nhà, xô nước, bảng nỉ trang trí lớp',
    amount: 350000,
    date: '2025-09-18',
    payerOrReceiver: 'Cửa hàng Gia Dụng',
    note: 'Đã có hóa đơn bán lẻ',
  },
  {
    id: 'fund-03',
    classId: 'class-6a1',
    type: 'expense',
    category: 'Hoạt động',
    title: 'Tổ chức tiệc Trung Thu cho cả lớp',
    amount: 1200000,
    date: '2025-09-28',
    payerOrReceiver: 'Bánh kẹo & Hoa quả',
    note: 'Bánh nướng, bánh dẻo, trái cây phá cỗ',
  },
  {
    id: 'fund-04',
    classId: 'class-6a1',
    type: 'expense',
    category: 'Khen thưởng',
    title: 'Mua phần thưởng thi đua nề nếp tháng 9',
    amount: 250000,
    date: '2025-10-02',
    payerOrReceiver: 'Nhà sách Tiền Phong',
    note: 'Vở viết, bút bi pastel khen thưởng các bạn đạt Ngôi sao tuần',
  },
];

export const INITIAL_BEHAVIOR_LOGS: BehaviorLog[] = [
  {
    id: 'bh-01',
    classId: 'class-6a1',
    studentId: 'st-05',
    date: '2025-10-06',
    type: 'praise',
    points: 10,
    title: 'Tích cực phát biểu & nhắc nhở lớp xếp hàng nghiêm túc',
    note: 'Rất có trách nhiệm lớp trưởng',
  },
  {
    id: 'bh-02',
    classId: 'class-6a1',
    studentId: 'st-07',
    date: '2025-10-06',
    type: 'praise',
    points: 5,
    title: 'Đạt điểm 10 kiểm tra 15 phút môn Toán',
  },
  {
    id: 'bh-03',
    classId: 'class-6a1',
    studentId: 'st-01',
    date: '2025-10-07',
    type: 'praise',
    points: 5,
    title: 'Giúp đỡ bạn lau bảng và sắp xếp bàn ghế',
  },
  {
    id: 'bh-04',
    classId: 'class-6a1',
    studentId: 'st-02',
    date: '2025-10-07',
    type: 'violation',
    points: -2,
    title: 'Nói chuyện riêng trong giờ Sinh hoạt',
    note: 'Đã nhắc nhở',
  },
];

export const INITIAL_TODOS: TeacherTodo[] = [
  {
    id: 'todo-01',
    classId: 'class-6a1',
    title: 'Thu bảo hiểm y tế đợt 1 nộp cho thủ quỹ',
    dueDate: '2025-10-15',
    isDone: false,
    priority: 'high',
    category: 'Hành chính',
  },
  {
    id: 'todo-02',
    classId: 'class-6a1',
    title: 'Lập danh sách học sinh tham gia Hội khỏe Phù Đổng',
    dueDate: '2025-10-20',
    isDone: true,
    priority: 'medium',
    category: 'Phong trào',
  },
  {
    id: 'todo-03',
    classId: 'class-6a1',
    title: 'Chuẩn bị nội dung họp phụ huynh giữa học kỳ 1',
    dueDate: '2025-11-05',
    isDone: false,
    priority: 'high',
    category: 'Chủ nhiệm',
  },
];

export async function seedInitialDatabase() {
  // If user has already run the app or cleared data, never re-seed automatically!
  const hasSeeded = localStorage.getItem('gvcn_has_seeded');
  if (hasSeeded === 'true') {
    return;
  }

  const count = await db.years.count();
  if (count === 0) {
    await db.years.bulkAdd(INITIAL_YEARS);
    await db.classes.bulkAdd(INITIAL_CLASSES);
    await db.students.bulkAdd(INITIAL_STUDENTS);
    await db.commentTemplates.bulkAdd(INITIAL_COMMENT_TEMPLATES);
    await db.fundTransactions.bulkAdd(INITIAL_FUND_TRANSACTIONS);
    await db.behaviorLogs.bulkAdd(INITIAL_BEHAVIOR_LOGS);
    await db.todos.bulkAdd(INITIAL_TODOS);

    // Initial seating arrangement for 6A1 (4 rows x 4 cols = 16 seats, 12 students)
    const seats: Seat[] = [];
    let studentIndex = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const studentId = studentIndex < INITIAL_STUDENTS.length ? INITIAL_STUDENTS[studentIndex].id : null;
        seats.push({
          id: `seat-${r}-${c}`,
          classId: 'class-6a1',
          row: r,
          col: c,
          studentId,
        });
        studentIndex++;
      }
    }
    await db.seats.bulkAdd(seats);

    // Mark as seeded
    localStorage.setItem('gvcn_has_seeded', 'true');


    // Initial Timetable for Class 6A1
    const timetableEntries: TimetableEntry[] = [
      // Thứ 2
      { id: 'tt-mon-1', classId: 'class-6a1', dayOfWeek: 'monday', session: 'morning', period: 1, subject: 'Chào cờ', teacher: 'Toàn trường', room: 'Sân trường', color: '#f43f5e' },
      { id: 'tt-mon-2', classId: 'class-6a1', dayOfWeek: 'monday', session: 'morning', period: 2, subject: 'Toán', teacher: 'Thầy Hùng', room: 'Phòng 204', color: '#3b82f6' },
      { id: 'tt-mon-3', classId: 'class-6a1', dayOfWeek: 'monday', session: 'morning', period: 3, subject: 'Ngữ văn', teacher: 'Cô Nga (GVCN)', room: 'Phòng 204', color: '#ec4899' },
      { id: 'tt-mon-4', classId: 'class-6a1', dayOfWeek: 'monday', session: 'morning', period: 4, subject: 'Tiếng Anh', teacher: 'Cô Mai', room: 'Phòng 204', color: '#8b5cf6' },
      { id: 'tt-mon-5', classId: 'class-6a1', dayOfWeek: 'monday', session: 'morning', period: 5, subject: 'Lịch sử & Địa lí', teacher: 'Thầy Tuấn', room: 'Phòng 204', color: '#f59e0b' },

      // Thứ 3
      { id: 'tt-tue-1', classId: 'class-6a1', dayOfWeek: 'tuesday', session: 'morning', period: 1, subject: 'Ngữ văn', teacher: 'Cô Nga (GVCN)', room: 'Phòng 204', color: '#ec4899' },
      { id: 'tt-tue-2', classId: 'class-6a1', dayOfWeek: 'tuesday', session: 'morning', period: 2, subject: 'Ngữ văn', teacher: 'Cô Nga (GVCN)', room: 'Phòng 204', color: '#ec4899' },
      { id: 'tt-tue-3', classId: 'class-6a1', dayOfWeek: 'tuesday', session: 'morning', period: 3, subject: 'Toán', teacher: 'Thầy Hùng', room: 'Phòng 204', color: '#3b82f6' },
      { id: 'tt-tue-4', classId: 'class-6a1', dayOfWeek: 'tuesday', session: 'morning', period: 4, subject: 'KHTN (Vật lí)', teacher: 'Thầy Minh', room: 'Phòng 204', color: '#06b6d4' },
      { id: 'tt-tue-5', classId: 'class-6a1', dayOfWeek: 'tuesday', session: 'morning', period: 5, subject: 'GDCD', teacher: 'Cô Lan', room: 'Phòng 204', color: '#10b981' },

      // Thứ 4
      { id: 'tt-wed-1', classId: 'class-6a1', dayOfWeek: 'wednesday', session: 'morning', period: 1, subject: 'Toán', teacher: 'Thầy Hùng', room: 'Phòng 204', color: '#3b82f6' },
      { id: 'tt-wed-2', classId: 'class-6a1', dayOfWeek: 'wednesday', session: 'morning', period: 2, subject: 'Tin học', teacher: 'Thầy Sơn', room: 'Phòng Máy 1', color: '#6366f1' },
      { id: 'tt-wed-3', classId: 'class-6a1', dayOfWeek: 'wednesday', session: 'morning', period: 3, subject: 'Tiếng Anh', teacher: 'Cô Mai', room: 'Phòng 204', color: '#8b5cf6' },
      { id: 'tt-wed-4', classId: 'class-6a1', dayOfWeek: 'wednesday', session: 'morning', period: 4, subject: 'KHTN (Hóa học)', teacher: 'Cô Linh', room: 'Phòng Thực Hành', color: '#06b6d4' },
      { id: 'tt-wed-5', classId: 'class-6a1', dayOfWeek: 'wednesday', session: 'morning', period: 5, subject: 'Mỹ thuật', teacher: 'Thầy Đức', room: 'Phòng 204', color: '#d946ef' },

      // Thứ 5
      { id: 'tt-thu-1', classId: 'class-6a1', dayOfWeek: 'thursday', session: 'morning', period: 1, subject: 'Tiếng Anh', teacher: 'Cô Mai', room: 'Phòng 204', color: '#8b5cf6' },
      { id: 'tt-thu-2', classId: 'class-6a1', dayOfWeek: 'thursday', session: 'morning', period: 2, subject: 'Ngữ văn', teacher: 'Cô Nga (GVCN)', room: 'Phòng 204', color: '#ec4899' },
      { id: 'tt-thu-3', classId: 'class-6a1', dayOfWeek: 'thursday', session: 'morning', period: 3, subject: 'Toán', teacher: 'Thầy Hùng', room: 'Phòng 204', color: '#3b82f6' },
      { id: 'tt-thu-4', classId: 'class-6a1', dayOfWeek: 'thursday', session: 'morning', period: 4, subject: 'Giáo dục thể chất', teacher: 'Thầy Dũng', room: 'Sân trường', color: '#10b981' },
      { id: 'tt-thu-5', classId: 'class-6a1', dayOfWeek: 'thursday', session: 'morning', period: 5, subject: 'Âm nhạc', teacher: 'Cô Thủy', room: 'Phòng Nghệ thuật', color: '#f59e0b' },

      // Thứ 6
      { id: 'tt-fri-1', classId: 'class-6a1', dayOfWeek: 'friday', session: 'morning', period: 1, subject: 'KHTN (Sinh học)', teacher: 'Cô Trâm', room: 'Phòng 204', color: '#06b6d4' },
      { id: 'tt-fri-2', classId: 'class-6a1', dayOfWeek: 'friday', session: 'morning', period: 2, subject: 'Công nghệ', teacher: 'Thầy Nam', room: 'Phòng 204', color: '#64748b' },
      { id: 'tt-fri-3', classId: 'class-6a1', dayOfWeek: 'friday', session: 'morning', period: 3, subject: 'Tiếng Anh', teacher: 'Cô Mai', room: 'Phòng 204', color: '#8b5cf6' },
      { id: 'tt-fri-4', classId: 'class-6a1', dayOfWeek: 'friday', session: 'morning', period: 4, subject: 'Toán', teacher: 'Thầy Hùng', room: 'Phòng 204', color: '#3b82f6' },
      { id: 'tt-fri-5', classId: 'class-6a1', dayOfWeek: 'friday', session: 'morning', period: 5, subject: 'Sinh hoạt lớp (SHL)', teacher: 'Cô Nga (GVCN)', room: 'Phòng 204', color: '#f43f5e' },
    ];
    await db.timetable.bulkAdd(timetableEntries);
  }
}

