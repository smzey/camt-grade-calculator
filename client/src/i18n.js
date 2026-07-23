// client/src/i18n.js
// Tiny i18n layer: EN/TH dictionaries + a t(key, vars) lookup with {var}
// interpolation, and a category-name map keyed by group code. No library — the
// app has a fixed, small set of strings, so a plain object is plenty.
//
// ⚠️ THAI CATEGORY NAMES below are best-effort translations using standard CMU
// General-Education terminology. Verify against the official program names and
// edit `categoryNames.th` as needed — this is the ONLY place to change them.

// --- UI strings -------------------------------------------------------------
const STRINGS = {
  en: {
    'app.title': 'Grade Calculator',
    'action.import': '⬆ Import transcript',
    'action.export': '⬇ Export',
    'action.restore': '⤒ Restore',
    'backup.more': 'Backup & more',
    'settings.open': 'Settings',
    'lang.label': 'Language',
    'reset.label': 'Reset data',
    'reset.sub': 'Delete every grade in this browser',
    'reset.confirm': 'Delete every grade saved in this browser? This cannot be undone — export a backup first if you want to keep them.',
    'reset.cancel': 'Cancel',
    'reset.go': 'Delete',
    'backup.export.label': 'Export backup',
    'backup.export.sub': 'Download your grades as JSON',
    'backup.restore.label': 'Restore backup',
    'backup.restore.sub': 'Load grades from a file',
    'action.cancel': 'Cancel',
    'action.back': '← Edit',
    'loading': 'Loading…',
    'unit.cr': 'cr',
    'gpa.actual': 'GPA actual',
    'gpa.projected': 'GPA projected',
    'gpa.inprogress': 'In progress',

    // Degree summary
    'hero.remaining': 'Still to earn',
    'hero.sub': 'of {total} credits · {earned} earned',
    'hero.done': 'Every requirement met',
    'gpa.label': 'GPA',
    'gpa.show': 'Show',
    'gpa.hide': 'Hide',
    'gpa.hidden': 'Hidden',
    'gpa.sub.planned': 'now → with planned grades',
    'gpa.sub.actual': 'from {n} credits',
    'plan.label': 'Plan',
    'status.met': 'Requirement met',
    'empty.hint':
      'Nothing recorded yet. Import your transcript, or open a category below to add grades one at a time.',

    'grade.group': 'Grade',
    'grade.planned': 'Planned (what-if)',
    'plan.varies': 'This requirement changes with the WIL/IS plan',
    'footer':
      'Grades save to this browser only · CAMT MMIT · College of Arts, Media and Technology, Chiang Mai University',

    // Transcript import
    'import.title': 'Import transcript',
    'import.hint':
      'Paste your transcript for finished grades, or your class schedule for courses you are taking now. Several semesters at once is fine — the years are worked out automatically.',
    'import.placeholder':
      'Paste your transcript here — it reads automatically…',
    'import.reading': 'Reading…',
    'import.ready': '{ok} of {total} courses ready',
    'import.skipped': ' · {n} skipped',
    'import.gpaLabel': 'Calculated GPA',
    'import.gpaCheck': '— check it matches your transcript',
    'import.commit': 'Import {n} courses',
    'import.importing': 'Importing…',
    'import.notInCatalog': '(not in catalog)',
    'import.empty': 'Waiting for transcript text…',

    // Where-to-copy guide
    'guide.title': 'How to copy your courses',
    'guide.step1': 'Open your schedule or grades on',
    'guide.step2': 'Drag across the course rows. Headers and the total line are fine to include.',
    'guide.step3': 'Copy with Ctrl/⌘+C, then paste in the box above.',
    'guide.colCode': 'Course no',
    'guide.colTitle': 'Title',
    'guide.colCredit': 'Credit',
    'guide.total': 'Total credit',
    'guide.copyKey': '⌘ C',

    // Row status labels
    'status.unmatched_subject': 'not in catalog',
    'status.in_progress': 'currently studying',
    'status.free_elective': 'free elective',
    'status.unknown_grade': 'unknown grade',
    'status.grade_type_mismatch': 'grade not allowed',
    'status.title_row': 'section header',
  },
  th: {
    'app.title': 'เครื่องคำนวณเกรด',
    'action.import': '⬆ นำเข้าผลการเรียน',
    'action.export': '⬇ ส่งออก',
    'action.restore': '⤒ กู้คืน',
    'backup.more': 'สำรองข้อมูลและอื่นๆ',
    'settings.open': 'ตั้งค่า',
    'lang.label': 'ภาษา',
    'reset.label': 'ล้างข้อมูล',
    'reset.sub': 'ลบเกรดทั้งหมดในเบราว์เซอร์นี้',
    'reset.confirm': 'ลบเกรดทั้งหมดที่บันทึกไว้ในเบราว์เซอร์นี้? การกระทำนี้ย้อนกลับไม่ได้ — หากต้องการเก็บไว้ ให้ส่งออกข้อมูลสำรองก่อน',
    'reset.cancel': 'ยกเลิก',
    'reset.go': 'ลบ',
    'backup.export.label': 'ส่งออกข้อมูลสำรอง',
    'backup.export.sub': 'ดาวน์โหลดเกรดของคุณเป็นไฟล์ JSON',
    'backup.restore.label': 'กู้คืนข้อมูลสำรอง',
    'backup.restore.sub': 'โหลดเกรดจากไฟล์',
    'action.cancel': 'ยกเลิก',
    'action.back': '← แก้ไข',
    'loading': 'กำลังโหลด…',
    'unit.cr': 'หน่วยกิต',
    'gpa.actual': 'เกรดเฉลี่ยจริง',
    'gpa.projected': 'เกรดเฉลี่ยคาดการณ์',
    'gpa.inprogress': 'กำลังเรียน',

    // Degree summary
    'hero.remaining': 'เหลืออีก',
    'hero.sub': 'จาก {total} หน่วยกิต · ผ่านแล้ว {earned}',
    'hero.done': 'ครบทุกหมวดแล้ว',
    'gpa.label': 'เกรดเฉลี่ย',
    'gpa.show': 'แสดง',
    'gpa.hide': 'ซ่อน',
    'gpa.hidden': 'ซ่อนอยู่',
    'gpa.sub.planned': 'ปัจจุบัน → รวมเกรดที่วางแผน',
    'gpa.sub.actual': 'จาก {n} หน่วยกิต',
    'plan.label': 'แผนการเรียน',
    'status.met': 'ครบตามเกณฑ์แล้ว',
    'empty.hint':
      'ยังไม่มีข้อมูล นำเข้าผลการเรียน หรือเปิดหมวดด้านล่างเพื่อกรอกเกรดทีละวิชา',

    'grade.group': 'เกรด',
    'grade.planned': 'เกรดที่วางแผน',
    'plan.varies': 'หน่วยกิตที่ต้องการเปลี่ยนตามแผน WIL/IS',
    'footer':
      'บันทึกเกรดในเบราว์เซอร์นี้เท่านั้น · CAMT MMIT · วิทยาลัยศิลปะ สื่อ และเทคโนโลยี มหาวิทยาลัยเชียงใหม่',

    // Transcript import
    'import.title': 'นำเข้าผลการเรียน',
    'import.hint':
      'วางผลการเรียนสำหรับวิชาที่ได้เกรดแล้ว หรือวางตารางเรียนสำหรับวิชาที่กำลังเรียนอยู่ วางหลายเทอมพร้อมกันได้ ระบบจะจับปีการศึกษาให้อัตโนมัติ',
    'import.placeholder': 'วางผลการเรียนที่นี่ — ระบบจะอ่านให้อัตโนมัติ…',
    'import.reading': 'กำลังอ่าน…',
    'import.ready': 'พร้อม {ok} จาก {total} วิชา',
    'import.skipped': ' · ข้าม {n}',
    'import.gpaLabel': 'เกรดเฉลี่ยที่คำนวณได้',
    'import.gpaCheck': '— ตรวจสอบว่าตรงกับผลการเรียนของคุณ',
    'import.commit': 'นำเข้า {n} วิชา',
    'import.importing': 'กำลังนำเข้า…',
    'import.notInCatalog': '(ไม่มีในหลักสูตร)',
    'import.empty': 'กำลังรอข้อความผลการเรียน…',

    // Where-to-copy guide
    'guide.title': 'วิธีคัดลอกรายวิชา',
    'guide.step1': 'เปิดตารางเรียนหรือเกรดที่',
    'guide.step2': 'ลากคลุมแถวรายวิชา จะติดหัวตารางหรือบรรทัดรวมมาด้วยก็ได้',
    'guide.step3': 'กด Ctrl/⌘+C เพื่อคัดลอก แล้ววางในช่องด้านบน',
    'guide.colCode': 'รหัสวิชา',
    'guide.colTitle': 'ชื่อวิชา',
    'guide.colCredit': 'หน่วยกิต',
    'guide.total': 'หน่วยกิตรวม',
    'guide.copyKey': '⌘ C',

    // Row status labels
    'status.unmatched_subject': 'ไม่มีในหลักสูตร',
    'status.in_progress': 'กำลังเรียน',
    'status.free_elective': 'วิชาเลือกเสรี',
    'status.unknown_grade': 'เกรดไม่รู้จัก',
    'status.grade_type_mismatch': 'เกรดไม่ถูกต้อง',
    'status.title_row': 'หัวข้อหมวด',
  },
};

// --- Category / group names (by group code) ---------------------------------
// EN falls back to the English name already in the catalog, so only TH is listed.
// ⚠️ VERIFY these against the official program names.
const categoryNamesTh = {
  '1000': 'ศึกษาทั่วไป',
  '1100': 'ศึกษาทั่วไป - หมวดบังคับ',
  '1110': 'กลุ่มผู้เรียนรู้',
  '1111': 'ภาษาอังกฤษ 4',
  '1112': 'ผู้เรียนรู้ - วิชาเลือก',
  '1120': 'กลุ่มผู้ร่วมสร้างสรรค์นวัตกรรม',
  '1130': 'กลุ่มพลเมืองที่เข้มแข็ง',
  '1200': 'ศึกษาทั่วไป - หมวดเลือก',
  '1210': 'ผู้เรียนรู้',
  '1220': 'พลเมืองที่เข้มแข็ง',
  '1230': 'ผู้ร่วมสร้างสรรค์นวัตกรรม',
  '2000': 'กลุ่มวิชาเฉพาะ',
  '2100': 'กลุ่มวิชาแกน',
  '2110': '208262 หรือ 954241',
  '2120': 'อื่น ๆ',
  '2200': 'กลุ่มวิชาเอก',
  '2210': 'วิชาเอกบังคับ',
  '2220': 'วิชาเอกเลือก',
  '9000': 'กลุ่มวิชาเลือกเสรี',
};

export const LANGS = [
  { value: 'en', label: 'EN' },
  { value: 'th', label: 'ไทย' },
];

// Build a translator for one language. t('import.ready', {ok:3, total:5}).
export function makeT(lang) {
  const table = STRINGS[lang] || STRINGS.en;
  return function t(key, vars) {
    let s = table[key] ?? STRINGS.en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
    return s;
  };
}

// Category name in the current language, falling back to the catalog's English.
export function categoryName(lang, code, englishName) {
  if (lang === 'th') return categoryNamesTh[code] || englishName;
  return englishName;
}
