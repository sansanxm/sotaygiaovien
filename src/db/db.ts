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
  NoteFolder,
  TeacherNote,
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
  noteFolders!: Table<NoteFolder, string>;
  teacherNotes!: Table<TeacherNote, string>;

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
      noteFolders: 'id, name',
      teacherNotes: 'id, folderId, date, isPinned',
    });
  }
}

export const db = new GVCNDatabase();

type ChangeListener = () => void;
const changeListeners: Set<ChangeListener> = new Set();
let isInternalSyncing = false;

export const setInternalSyncing = (val: boolean) => {
  isInternalSyncing = val;
};

export const onDatabaseChanged = (listener: ChangeListener) => {
  changeListeners.add(listener);
  return () => {
    changeListeners.delete(listener);
  };
};

const notifyDatabaseChange = () => {
  if (isInternalSyncing) return;
  try {
    localStorage.setItem('gvcn_local_last_modified', Date.now().toString());
  } catch {}
  changeListeners.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
};


// Auto-register hooks on all Dexie tables
const hookTableNames: (keyof GVCNDatabase)[] = [
  'years',
  'classes',
  'students',
  'attendance',
  'behaviorLogs',
  'fundTransactions',
  'seats',
  'commentTemplates',
  'evaluations',
  'todos',
  'timetable',
];


hookTableNames.forEach((tableName) => {
  const table = db[tableName] as Table<any, any>;
  if (table && typeof table.hook === 'function') {
    table.hook('creating', () => {
      if (isInternalSyncing) return;
      setTimeout(() => {
        if (!isInternalSyncing) notifyDatabaseChange();
      }, 50);
    });
    table.hook('updating', () => {
      if (isInternalSyncing) return;
      setTimeout(() => {
        if (!isInternalSyncing) notifyDatabaseChange();
      }, 50);
    });
    table.hook('deleting', () => {
      if (isInternalSyncing) return;
      setTimeout(() => {
        if (!isInternalSyncing) notifyDatabaseChange();
      }, 50);
    });
  }
});



export const getUserScopedKey = (key: string, email?: string | null): string => {
  if (!email) {
    const active = localStorage.getItem('gvcn_active_user_email');
    if (active) email = active;
  }
  if (!email) return `gvcn_guest_${key}`;
  const cleanEmail = email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `gvcn_${cleanEmail}_${key}`;
};

// Export / Backup all data as JSON (scoped to user)
export async function exportDatabaseBackup(email?: string | null): Promise<string> {
  const activeEmail = email || localStorage.getItem('gvcn_active_user_email') || 'guest';
  let vipToken = null;
  try {
    const rawVip = localStorage.getItem(getUserScopedKey('vip_token', activeEmail));
    if (rawVip) {
      const parsed = JSON.parse(rawVip);
      if (parsed && parsed.isVip && (!parsed.email || parsed.email === activeEmail)) {
        vipToken = { ...parsed, email: activeEmail };
      }
    }
  } catch {}


  const data = {
    version: '4.0.0',
    exportedAt: new Date().toISOString(),
    ownerEmail: activeEmail,
    userSettings: {
      teacherTitle: localStorage.getItem(getUserScopedKey('teacher_title', activeEmail)) || 'Thầy/Cô',
      teacherName: localStorage.getItem(getUserScopedKey('teacher_name', activeEmail)) || '',
      teacherAvatar: localStorage.getItem(getUserScopedKey('teacher_avatar', activeEmail)) || null,
      teacherCover: localStorage.getItem(getUserScopedKey('teacher_cover', activeEmail)) || null,
      teacherBio: localStorage.getItem(getUserScopedKey('teacher_bio', activeEmail)) || 'Tận tâm vì học sinh thân yêu • Mỗi ngày đến trường là một ngày vui',
      theme: localStorage.getItem(getUserScopedKey('theme', activeEmail)) || 'pink',
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
    noteFolders: await db.noteFolders.toArray(),
    teacherNotes: await db.teacherNotes.toArray(),
  };
  return JSON.stringify(data, null, 2);
}


// Export Notebook separately for manual cloud backup
export async function exportNotebookBackup(email?: string | null): Promise<string> {
  const activeEmail = email || localStorage.getItem('gvcn_active_user_email') || 'guest';
  const data = {
    version: '4.0.0',
    exportedAt: new Date().toISOString(),
    ownerEmail: activeEmail,
    noteFolders: await db.noteFolders.toArray(),
    teacherNotes: await db.teacherNotes.toArray(),
  };
  return JSON.stringify(data, null, 2);
}

// Import Notebook separately for manual cloud restore
export async function importNotebookBackup(jsonString: string): Promise<boolean> {
  try {
    if (!jsonString || typeof jsonString !== 'string') return false;
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') return false;

    setInternalSyncing(true);
    try {
      await db.transaction('rw', [db.noteFolders, db.teacherNotes], async () => {
        if (Array.isArray(data.noteFolders) && data.noteFolders.length > 0) {
          await db.noteFolders.clear();
          await db.noteFolders.bulkAdd(data.noteFolders);
        }
        if (Array.isArray(data.teacherNotes) && data.teacherNotes.length > 0) {
          await db.teacherNotes.clear();
          await db.teacherNotes.bulkAdd(data.teacherNotes);
        }
      });
    } finally {
      setInternalSyncing(false);
      notifyDatabaseChange();
    }

    return true;
  } catch (err) {
    console.error('Import notebook error:', err);
    return false;
  }
}


// Import & restore database from JSON (scoped to user)
export async function importDatabaseBackup(jsonString: string, email?: string | null): Promise<boolean> {
  try {
    if (!jsonString || typeof jsonString !== 'string') return false;
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') return false;
    const activeEmail = email || data.ownerEmail || localStorage.getItem('gvcn_active_user_email') || 'guest';

    // 1. Restore User Profile & Settings
    if (data.userSettings && typeof data.userSettings === 'object') {
      try {
        if (data.userSettings.teacherTitle) {
          localStorage.setItem(getUserScopedKey('teacher_title', activeEmail), data.userSettings.teacherTitle);
        }
        if (data.userSettings.teacherName) {
          localStorage.setItem(getUserScopedKey('teacher_name', activeEmail), data.userSettings.teacherName);
        }
        if (data.userSettings.teacherAvatar) {
          localStorage.setItem(getUserScopedKey('teacher_avatar', activeEmail), data.userSettings.teacherAvatar);
        } else {
          localStorage.removeItem(getUserScopedKey('teacher_avatar', activeEmail));
        }
        if (data.userSettings.teacherCover) {
          localStorage.setItem(getUserScopedKey('teacher_cover', activeEmail), data.userSettings.teacherCover);
        } else {
          localStorage.removeItem(getUserScopedKey('teacher_cover', activeEmail));
        }
        if (data.userSettings.teacherBio) {
          localStorage.setItem(getUserScopedKey('teacher_bio', activeEmail), data.userSettings.teacherBio);
        }
        if (data.userSettings.theme) {
          localStorage.setItem(getUserScopedKey('theme', activeEmail), data.userSettings.theme);
        }
      } catch (e) {
        console.warn('Storage set item warning:', e);
      }
    }

    // 2. Restore VIP Token specifically for this user
    if (data.vipToken && data.vipToken.isVip) {
      try {
        localStorage.setItem(getUserScopedKey('vip_token', activeEmail), JSON.stringify(data.vipToken));
      } catch (e) {
        console.warn('VIP token restore warning:', e);
      }
    }



    // 3. Restore Dexie Database Tables (With Anti-Wipe Safeguard)
    const incomingStudentsCount = Array.isArray(data.students) ? data.students.length : 0;
    const incomingClassesCount = Array.isArray(data.classes) ? data.classes.length : 0;
    const localStudentsCount = await db.students.count();
    const localClassesCount = await db.classes.count();

    if (incomingStudentsCount === 0 && incomingClassesCount === 0 && (localStudentsCount > 0 || localClassesCount > 0)) {
      console.warn('Safeguard triggered: Incoming backup is empty while local has active data. Preserving local data.');
      return false;
    }

    const hasAnyTable = Array.isArray(data.years) || Array.isArray(data.classes) || Array.isArray(data.students);
    if (hasAnyTable) {
      setInternalSyncing(true);
      try {
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
          db.noteFolders,
          db.teacherNotes,
        ], async () => {
          const importedYears = Array.isArray(data.years) && data.years.length > 0 ? data.years : [
            {
              id: `year-${Date.now()}`,
              name: 'Năm học 2025 - 2026',
              isCurrent: true,
              startDate: '2025-09-05',
              endDate: '2026-05-31',
            }
          ];

          await db.years.clear();
          await db.years.bulkAdd(importedYears);

          const validYearIds = new Set(importedYears.map((y: any) => y.id));
          const primaryYearId = importedYears.find((y: any) => y.isCurrent)?.id || importedYears[0]?.id;

          if (Array.isArray(data.classes)) {
            await db.classes.clear();
            const normalizedClasses = data.classes.map((c: any) => {
              if (!validYearIds.has(c.yearId) && primaryYearId) {
                return { ...c, yearId: primaryYearId };
              }
              return c;
            });
            if (normalizedClasses.length) await db.classes.bulkAdd(normalizedClasses);
          }

          if (Array.isArray(data.students)) {
            await db.students.clear();
            if (data.students.length) await db.students.bulkAdd(data.students);
          }


          if (Array.isArray(data.attendance)) {
            await db.attendance.clear();
            if (data.attendance.length) await db.attendance.bulkAdd(data.attendance);
          }
          if (Array.isArray(data.behaviorLogs)) {
            await db.behaviorLogs.clear();
            if (data.behaviorLogs.length) await db.behaviorLogs.bulkAdd(data.behaviorLogs);
          }
          if (Array.isArray(data.fundTransactions)) {
            await db.fundTransactions.clear();
            if (data.fundTransactions.length) await db.fundTransactions.bulkAdd(data.fundTransactions);
          }
          if (Array.isArray(data.seats)) {
            await db.seats.clear();
            if (data.seats.length) await db.seats.bulkAdd(data.seats);
          }
          if (Array.isArray(data.commentTemplates)) {
            await db.commentTemplates.clear();
            if (data.commentTemplates.length) await db.commentTemplates.bulkAdd(data.commentTemplates);
          }
          if (Array.isArray(data.evaluations)) {
            await db.evaluations.clear();
            if (data.evaluations.length) await db.evaluations.bulkAdd(data.evaluations);
          }
          if (Array.isArray(data.todos)) {
            await db.todos.clear();
            if (data.todos.length) await db.todos.bulkAdd(data.todos);
          }
          if (Array.isArray(data.timetable)) {
            await db.timetable.clear();
            if (data.timetable.length) await db.timetable.bulkAdd(data.timetable);
          }
          if (Array.isArray(data.noteFolders) && data.noteFolders.length > 0) {
            await db.noteFolders.clear();
            await db.noteFolders.bulkAdd(data.noteFolders);
          }
          if (Array.isArray(data.teacherNotes) && data.teacherNotes.length > 0) {
            await db.teacherNotes.clear();
            await db.teacherNotes.bulkAdd(data.teacherNotes);
          }
        });

      } finally {
        setInternalSyncing(false);
        notifyDatabaseChange();
      }
    }




    return true;
  } catch (err) {
    console.error('Import error:', err);
    return false;
  }
}





