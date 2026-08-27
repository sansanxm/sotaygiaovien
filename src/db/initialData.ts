import { db } from './db';
import type {
  SchoolYear,
  CommentTemplate,
  NoteFolder,
} from '../types';


export const INITIAL_YEARS: SchoolYear[] = [
  {
    id: 'year-2026-2027',
    name: 'Năm học 2026 - 2027',
    isCurrent: true,
    startDate: '2026-09-05',
    endDate: '2027-05-31',
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

export const INITIAL_NOTE_FOLDERS: NoteFolder[] = [

  {
    id: 'folder-hop-hoi-dong',
    name: 'Họp hội đồng sư phạm',
    icon: '🏛️',
    color: '#ec4899',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'folder-sinh-hoat-chuyen-mon',
    name: 'Sinh hoạt chuyên môn',
    icon: '📚',
    color: '#3b82f6',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'folder-trao-doi-phu-huynh',
    name: 'Gặp gỡ & trao đổi phụ huynh',
    icon: '👨‍👩‍👧‍👦',
    color: '#10b981',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'folder-ke-hoach-tuan',
    name: 'Kế hoạch công tác tuần',
    icon: '📝',
    color: '#f59e0b',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'folder-ghi-chu-chung',
    name: 'Ghi chú chung',
    icon: '💡',
    color: '#8b5cf6',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function seedInitialDatabase() {
  const count = await db.years.count();
  if (count === 0) {
    await db.years.bulkAdd(INITIAL_YEARS);
    await db.commentTemplates.bulkAdd(INITIAL_COMMENT_TEMPLATES);
  }

  const folderCount = await db.noteFolders.count();
  if (folderCount === 0) {
    await db.noteFolders.bulkAdd(INITIAL_NOTE_FOLDERS);
  }
}

