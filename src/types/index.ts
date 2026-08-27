export type Gender = 'Nam' | 'Nữ';
export type TeacherTitle = 'Cô giáo' | 'Thầy giáo' | 'Thầy/Cô';
export type AppTheme = 'pink' | 'ocean' | 'mint' | 'lavender' | 'peach' | 'slate';

export interface UserSettings {
  teacherTitle: TeacherTitle;
  teacherName: string;
  theme: AppTheme;
  teacherAvatar?: string | null;
  teacherCover?: string | null;
  teacherBio?: string;
}


export interface SchoolYear {
  id: string;
  name: string; // e.g. "2025 - 2026"
  isCurrent: boolean;
  startDate: string;
  endDate: string;
}

export type SeatingLayoutType = '3-dãy' | '2-dãy' | '4-dãy' | 'nhóm-u' | 'tùy-chỉnh';

export type ClassRoleType = 'gvcn' | 'bomon';

export interface ClassRoom {
  id: string;
  yearId: string;
  name: string; // e.g. "6A1", "10A2"
  grade: number; // 1 -> 12
  roomNumber: string;
  homeroomTeacher: string;
  totalDesks: number;
  rows: number;
  cols: number;
  layoutType?: SeatingLayoutType;
  note?: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  classType?: ClassRoleType; // 'gvcn': Lớp chủ nhiệm | 'bomon': Lớp bộ môn / Chuyên ngành
  subject?: string;          // Môn giảng dạy
}



export interface Student {
  id: string;
  classId: string;
  rollNumber: number; // Số thứ tự trong sổ
  fullName: string;
  gender: Gender;
  dob: string; // YYYY-MM-DD
  address?: string;
  parentName?: string;
  parentPhone?: string;
  parentZalo?: string;
  healthNote?: string; // Dị ứng, cận thị, v.v.
  notes?: string;
  avatarSeed?: string;
  avatarUrl?: string; // Base64 image cropped from group photo or custom photo
  status: 'Đang học' | 'Chuyển trường' | 'Nghỉ học';
}


export type AttendanceStatus = 'present' | 'late' | 'excused' | 'unexcused';

export interface AttendanceRecord {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  session: 'Sáng' | 'Chiều';
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

export interface BehaviorLog {
  id: string;
  classId: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  type: 'praise' | 'violation'; // Khen thưởng / Vi phạm
  points: number; // +5, -2, etc.
  title: string; // "Phát biểu tích cực", "Quên khăn quàng", v.v.
  note?: string;
}

export interface FundTransaction {
  id: string;
  classId: string;
  type: 'income' | 'expense';
  category: 'Quỹ lớp' | 'Hoạt động' | 'Khen thưởng' | 'Cơ sở vật chất' | 'Khác';
  title: string;
  amount: number;
  date: string;
  payerOrReceiver?: string;
  note?: string;
  targetAmountPerStudent?: number; // Nếu là đợt thu chung (vd: 100k/em)
  paidStudentIds?: string[]; // Danh sách id học sinh đã đóng
}

export interface Seat {
  id: string;
  classId: string;
  row: number; // 0-indexed
  col: number; // 0-indexed
  studentId: string | null;
}

export interface CommentTemplate {
  id: string;
  category: 'Khen ngợi' | 'Khích lệ' | 'Cần cố gắng' | 'Nề nếp' | 'Kỹ năng';
  gradeLevel: 'Tiểu học' | 'THCS' | 'THPT' | 'Chung';
  content: string;
  tags: string[];
}

export interface StudentEvaluation {
  id: string;
  classId: string;
  studentId: string;
  term: 'Học kỳ 1' | 'Học kỳ 2' | 'Cả năm';
  academicRating: 'Xuất sắc' | 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt';
  conductRating: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt';
  teacherComment: string;
  awards?: string;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export interface TimetableEntry {
  id: string;
  classId: string;
  dayOfWeek: DayOfWeek; // 'monday' -> 'saturday'
  session: 'morning' | 'afternoon'; // 'morning' | 'afternoon'
  period: number; // 1 -> 5
  subject: string; // 'Toán', 'Ngữ văn', 'Tiếng Anh', v.v.
  teacher?: string; // Tên giáo viên giảng dạy
  room?: string; // Phòng học (ví dụ: 'Phòng 204', 'Phòng Tin')
  note?: string; // Ghi chú (ví dụ: 'Kiểm tra 15p', 'Thực hành')
  color?: string; // Màu sắc hiển thị
}

export interface TeacherTodo {
  id: string;
  classId?: string;
  title: string;
  dueDate?: string;
  isDone: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export interface NoteFolder {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}


export interface TeacherNote {
  id: string;
  folderId: string;
  title: string;
  content: string;
  date: string;
  tags?: string[];
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ActiveTab = 
  | 'dashboard'
  | 'timetable'
  | 'students'
  | 'seating'
  | 'attendance'
  | 'behavior'
  | 'fund'
  | 'comments'
  | 'random-picker'
  | 'todos'
  | 'notebook'
  | 'settings';


