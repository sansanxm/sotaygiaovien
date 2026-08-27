import Dexie, { type Table } from 'dexie';
import type {
  SchoolYear,
  ClassRoom,
  Student,
  AttendanceRecord,
  BehaviorLog,
  FundTransaction,
  Seat,
  CommentTemplate,
  StudentEvaluation,
  TeacherTodo,
  TimetableEntry,
} from '../types';


export class GVCNDatabase extends Dexie {
  years!: Table<SchoolYear, string>;
  classes!: Table<ClassRoom, string>;
  students!: Table<Student, string>;
  attendance!: Table<AttendanceRecord, string>;
  behaviorLogs!: Table<BehaviorLog, string>;
  fundTransactions!: Table<FundTransaction, string>;
  seats!: Table<Seat, string>;
  commentTemplates!: Table<CommentTemplate, string>;
  evaluations!: Table<StudentEvaluation, string>;
  todos!: Table<TeacherTodo, string>;
  timetable!: Table<TimetableEntry, string>;

  constructor() {
    super('GVCNDatabase_v1');
    this.version(1).stores({
      years: 'id, name, isCurrent',
      classes: 'id, yearId, name, grade',
      students: 'id, classId, rollNumber, fullName, gender, status',
      attendance: 'id, classId, date, [classId+date], studentId',
      behaviorLogs: 'id, classId, studentId, date, type',
      fundTransactions: 'id, classId, type, category, date',
      seats: 'id, classId, [classId+row+col], studentId',
      commentTemplates: 'id, category, gradeLevel',
      evaluations: 'id, classId, studentId, term',
      todos: 'id, classId, isDone, priority',
      timetable: 'id, classId, [classId+dayOfWeek+session+period]',
    });
  }
}

export const db = new GVCNDatabase();

// Export / Backup all data as JSON (including profile & VIP status)
export async function exportDatabaseBackup(): Promise<string> {
  let vipToken = null;
  try {
    const rawVip = localStorage.getItem('gvcn_vip_license_token');
    if (rawVip) vipToken = JSON.parse(rawVip);
  } catch {}

  const data = {
    version: '4.0.0',
    exportedAt: new Date().toISOString(),
    userSettings: {
      teacherTitle: localStorage.getItem('gvcn_teacher_title') || 'Thầy/Cô',
      teacherName: localStorage.getItem('gvcn_teacher_name') || '',
      teacherAvatar: localStorage.getItem('gvcn_teacher_avatar') || null,
      teacherCover: localStorage.getItem('gvcn_teacher_cover') || null,
      teacherBio: localStorage.getItem('gvcn_teacher_bio') || '',
      theme: localStorage.getItem('gvcn_theme') || 'pink',
    },
    vipToken,
    years: await db.years.toArray(),
    classes: await db.classes.toArray(),
    students: await db.students.toArray(),
    attendance: await db.attendance.toArray(),
    behaviorLogs: await db.behaviorLogs.toArray(),
    fundTransactions: await db.fundTransactions.toArray(),
    seats: await db.seats.toArray(),
    commentTemplates: await db.commentTemplates.toArray(),
    evaluations: await db.evaluations.toArray(),
    todos: await db.todos.toArray(),
    timetable: await db.timetable.toArray(),
  };
  return JSON.stringify(data, null, 2);
}


// Import & restore database from JSON (including profile & VIP status)
export async function importDatabaseBackup(jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.years && !data.classes && !data.students) {
      throw new Error('Dữ liệu không đúng định dạng sao lưu GVCN!');
    }

    // 1. Restore User Profile & Settings
    if (data.userSettings) {
      try {
        if (data.userSettings.teacherTitle) {
          localStorage.setItem('gvcn_teacher_title', data.userSettings.teacherTitle);
        }
        if (data.userSettings.teacherName) {
          localStorage.setItem('gvcn_teacher_name', data.userSettings.teacherName);
        }
        if (data.userSettings.teacherAvatar) {
          localStorage.setItem('gvcn_teacher_avatar', data.userSettings.teacherAvatar);
        }
        if (data.userSettings.teacherCover) {
          localStorage.setItem('gvcn_teacher_cover', data.userSettings.teacherCover);
        }
        if (data.userSettings.teacherBio) {
          localStorage.setItem('gvcn_teacher_bio', data.userSettings.teacherBio);
        }
        if (data.userSettings.theme) {
          localStorage.setItem('gvcn_theme', data.userSettings.theme);
        }
      } catch (e) {
        console.warn('Storage set item warning:', e);
      }
    }

    // 2. Restore VIP Token if present in cloud backup
    if (data.vipToken && data.vipToken.isVip) {
      try {
        localStorage.setItem('gvcn_vip_license_token', JSON.stringify(data.vipToken));
      } catch (e) {
        console.warn('VIP token restore warning:', e);
      }
    }

    // 3. Restore Dexie Database Tables
    await db.transaction('rw', [
      db.years,
      db.classes,
      db.students,
      db.attendance,
      db.behaviorLogs,
      db.fundTransactions,
      db.seats,
      db.commentTemplates,
      db.evaluations,
      db.todos,
      db.timetable,
    ], async () => {
      await db.years.clear();
      await db.classes.clear();
      await db.students.clear();
      await db.attendance.clear();
      await db.behaviorLogs.clear();
      await db.fundTransactions.clear();
      await db.seats.clear();
      await db.commentTemplates.clear();
      await db.evaluations.clear();
      await db.todos.clear();
      await db.timetable.clear();

      if (data.years?.length) await db.years.bulkAdd(data.years);
      if (data.classes?.length) await db.classes.bulkAdd(data.classes);
      if (data.students?.length) await db.students.bulkAdd(data.students);
      if (data.attendance?.length) await db.attendance.bulkAdd(data.attendance);
      if (data.behaviorLogs?.length) await db.behaviorLogs.bulkAdd(data.behaviorLogs);
      if (data.fundTransactions?.length) await db.fundTransactions.bulkAdd(data.fundTransactions);
      if (data.seats?.length) await db.seats.bulkAdd(data.seats);
      if (data.commentTemplates?.length) await db.commentTemplates.bulkAdd(data.commentTemplates);
      if (data.evaluations?.length) await db.evaluations.bulkAdd(data.evaluations);
      if (data.todos?.length) await db.todos.bulkAdd(data.todos);
      if (data.timetable?.length) await db.timetable.bulkAdd(data.timetable);
    });

    return true;
  } catch (err) {
    console.error('Import error:', err);
    throw err;
  }
}

