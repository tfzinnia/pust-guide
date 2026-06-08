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