-- Category tree (was the "groups" sheet in the xlsx)
CREATE TABLE groups (
  code        INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  parent_code INTEGER REFERENCES groups(code),
  req_wil     INTEGER NOT NULL DEFAULT 0,  -- credits required, WIL plan
  req_is      INTEGER NOT NULL DEFAULT 0   -- credits required, IS plan
);

-- Grade -> GPA point lookup (was the "grades" sheet)
CREATE TABLE grades (
  grade       TEXT PRIMARY KEY,       -- 'A', 'B+', 'xA', 'S', 'W'...
  point       NUMERIC(3,1),           -- NULL for S/U/V/W/X (non-GPA grades)
  type        TEXT,                   -- 'AF', 'SU', or NULL
  is_cal      BOOLEAN NOT NULL,       -- counts toward GPA
  is_keep     BOOLEAN NOT NULL,       -- counts as credit earned (passed)
  is_planning BOOLEAN NOT NULL        -- true for the "x" prefixed planning grades
);

-- Course catalog (was the "subjects" sheet)
CREATE TABLE subjects (
  code       TEXT PRIMARY KEY,        -- '001101', or a pseudo-code like 'GE' for section headers
  name       TEXT NOT NULL,
  is_title   BOOLEAN NOT NULL DEFAULT FALSE, -- true = section header row, not a real course
  credit     INTEGER,                 -- NULL for title rows
  group_code INTEGER REFERENCES groups(code),
  grade_type TEXT,                    -- 'AF', 'SU', or NULL (= any type allowed)
  plan       TEXT                     -- 'WIL', 'IS', or NULL (= counts for both plans)
);

-- A student's actual taken courses + grades (was the "calculation" sheet, minus the clutter)
CREATE TABLE enrollments (
  id           SERIAL PRIMARY KEY,
  student_id   TEXT NOT NULL DEFAULT 'me',  -- placeholder until real auth/users exist
  subject_code TEXT NOT NULL REFERENCES subjects(code),
  term         TEXT NOT NULL,           -- '1/1', '1/2', ... '10/3'
  grade        TEXT NOT NULL REFERENCES grades(grade),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, subject_code)     -- one grade per course per student (retakes overwrite, don't duplicate)
);
