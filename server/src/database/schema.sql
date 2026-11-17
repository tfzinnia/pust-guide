CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  short_name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'super_admin')),

  roll TEXT UNIQUE,
  teacher_id TEXT UNIQUE,

  department_id INTEGER,
  session TEXT,
  year TEXT,
  semester TEXT,
  designation TEXT,
  token_version INTEGER NOT NULL DEFAULT 0,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS notices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  department_id INTEGER,
  session TEXT,
  year TEXT,
  semester TEXT,
  is_urgent INTEGER DEFAULT 0,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS syllabus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  department_id INTEGER NOT NULL,
  session TEXT,
  year TEXT NOT NULL,
  semester TEXT NOT NULL,
  course_code TEXT NOT NULL,
  course_title TEXT NOT NULL,
  credits REAL DEFAULT 0,
  pdf_url TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS routines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('class', 'exam')),
  department_id INTEGER NOT NULL,
  session TEXT,
  year TEXT NOT NULL,
  semester TEXT NOT NULL,
  course_code TEXT,
  course_title TEXT NOT NULL,
  routine_date TEXT,
  day TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT,
  room TEXT,
  teacher_name TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS marking_criteria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  department_id INTEGER NOT NULL,
  session TEXT,
  year TEXT,
  semester TEXT,
  ct_total INTEGER DEFAULT 3,
  best_ct_counted INTEGER DEFAULT 2,
  ct_marks INTEGER DEFAULT 20,
  attendance_marks INTEGER DEFAULT 10,
  internal_total INTEGER DEFAULT 30,
  theory_marks INTEGER DEFAULT 70,
  total_marks INTEGER DEFAULT 100,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('ragging', 'harassment', 'hall', 'transport', 'classroom', 'academic', 'others')),
  description TEXT NOT NULL,
  image_url TEXT,
  is_anonymous INTEGER DEFAULT 0,
  status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted', 'under_review', 'resolved')),
  admin_note TEXT,
  assigned_to INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  phone TEXT NOT NULL,
  description TEXT,
  is_urgent INTEGER DEFAULT 0,
  is_verified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campus_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  latitude REAL,
  longitude REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guidelines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL, body TEXT NOT NULL DEFAULT '', url TEXT NOT NULL,
  read_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at);
CREATE TABLE IF NOT EXISTS saved_items (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK(kind IN ('notice','routine')),
  item_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id, kind, item_id)
);
CREATE TABLE IF NOT EXISTS complaint_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL, message TEXT NOT NULL DEFAULT '', status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_complaint_updates ON complaint_updates(complaint_id, id);
CREATE TABLE IF NOT EXISTS uploaded_files (
  id TEXT PRIMARY KEY, filename TEXT NOT NULL, original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL, size INTEGER NOT NULL,
  owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  department_id INTEGER REFERENCES departments(id), purpose TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS academic_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session TEXT NOT NULL, year TEXT NOT NULL, semester TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_academic_request ON academic_requests(user_id) WHERE status = 'pending';
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT, actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, resource TEXT NOT NULL, resource_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notices_audience ON notices(department_id,session,year,semester);
CREATE INDEX IF NOT EXISTS idx_routines_audience ON routines(department_id,session,year,semester);

CREATE TABLE IF NOT EXISTS directory_offices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'administration',
  email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', location TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '', source_url TEXT NOT NULL, contact_source_url TEXT NOT NULL DEFAULT '',
  checked_at TEXT NOT NULL, notes_json TEXT NOT NULL DEFAULT '[]', unfilled_roles_json TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS directory_people (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL, designation TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('faculty','chair','officer','governance')),
  department_id INTEGER REFERENCES departments(id), office_id INTEGER REFERENCES directory_offices(id) ON DELETE CASCADE,
  emails_json TEXT NOT NULL DEFAULT '[]', phones_json TEXT NOT NULL DEFAULT '[]',
  is_head INTEGER NOT NULL DEFAULT 0, profile_url TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL, checked_at TEXT NOT NULL, notes_json TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  CHECK ((department_id IS NOT NULL) + (office_id IS NOT NULL) = 1)
);
CREATE INDEX IF NOT EXISTS idx_directory_people_department ON directory_people(department_id,kind,is_head);
CREATE INDEX IF NOT EXISTS idx_directory_people_office ON directory_people(office_id,is_head);
CREATE TABLE IF NOT EXISTS directory_imports (
  snapshot_hash TEXT PRIMARY KEY, checked_at TEXT NOT NULL, summary_json TEXT NOT NULL,
  is_current INTEGER NOT NULL DEFAULT 0,
  imported_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS university_directory_info (
  id INTEGER PRIMARY KEY CHECK(id=1), data_json TEXT NOT NULL
);
