-- קה״דיה - מערכת ניהול שבצ״ק - Database Schema (PRD Compliant)
-- Based on PRD Section 10 - High-level Data Model

-- Populations (אוכלוסיות) - PRD Section 6.2
CREATE TABLE IF NOT EXISTS populations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Departments (מחלקות) - PRD Section 6.4
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    commander_id INTEGER, -- References personnel(id)
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Personnel (תיקים אישיים) - PRD Section 6.1
CREATE TABLE IF NOT EXISTS personnel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    personal_number TEXT NOT NULL UNIQUE,
    rank TEXT NOT NULL CHECK (rank IN ('רב״ט', 'סמל', 'סמ״ר', 'רס״ר', 'רב״ס', 'רב״ח')),
    branch TEXT NOT NULL,
    residence TEXT NOT NULL,
    phone TEXT NOT NULL,
    population_id INTEGER REFERENCES populations(id),
    department_id INTEGER REFERENCES departments(id),
    is_commander INTEGER DEFAULT 0 CHECK (is_commander IN (0, 1)),
    id_number TEXT NOT NULL,
    birth_date DATE NOT NULL,
    enlistment_date DATE NOT NULL,
    discharge_date DATE NOT NULL,
    arrival_date DATE,
    marital_status TEXT NOT NULL CHECK (marital_status IN ('רווק', 'נשוי', 'אלמן')),
    course_cycle TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Skills (כשירויות) - PRD Section 6.3
CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Person Skills (כשירויות אישיות) - PRD Section 6.3
CREATE TABLE IF NOT EXISTS person_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('בתהליך הסמכה', 'מוסמך כשיר', 'נכשל', 'פג תוקף')),
    training_start_date DATE,  -- Required when status = 'בתהליך הסמכה'
    training_end_date DATE,    -- Required when status = 'בתהליך הסמכה' 
    expiry_date DATE,          -- Required when status IN ('מוסמך כשיר', 'פג תוקף')
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(person_id, skill_id)
);

-- Positions (עמדות) - PRD Section 6.5
CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Roles (תפקידנים) - PRD Section 6.5
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position_id INTEGER NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(position_id, name) -- Role names must be unique within a position
);

-- Role Skills (דרישות כשירות לתפקידנים) - PRD Section 6.5
CREATE TABLE IF NOT EXISTS role_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    is_mandatory INTEGER DEFAULT 1 CHECK (is_mandatory IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, skill_id)
);

-- Schedule Weeks (שבצ״ק שבועי) - PRD Section 6.7
CREATE TABLE IF NOT EXISTS schedule_weeks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position_id INTEGER NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    week_start DATE NOT NULL, -- Start of week (Sunday)
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(position_id, week_start)
);

-- Time Blocks (טווחי שעות) - PRD Section 6.7
CREATE TABLE IF NOT EXISTS time_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_week_id INTEGER NOT NULL REFERENCES schedule_weeks(id) ON DELETE CASCADE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK (start_time < end_time)
);

-- Assignments (שיבוצים) - PRD Section 6.7
CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time_block_id INTEGER NOT NULL REFERENCES time_blocks(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    person_id INTEGER REFERENCES personnel(id) ON DELETE SET NULL, -- Can be NULL for unassigned
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(time_block_id, role_id, day_of_week) -- One person per role per time block per day
);

-- Constraints (אילוצים) - PRD Section 6.6
CREATE TABLE IF NOT EXISTS constraints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_full_day INTEGER DEFAULT 1 CHECK (is_full_day IN (0, 1)),
    start_time TIME, -- Required when is_full_day = 0
    end_time TIME,   -- Required when is_full_day = 0
    type TEXT NOT NULL CHECK (type IN ('vacation', 'personal', 'medical', 'military', 'reserves', 'course', 'other')),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK (is_full_day = 1 OR (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time))
);

-- Business Rule Triggers

-- Trigger: Update timestamps on record update
CREATE TRIGGER IF NOT EXISTS update_population_timestamp 
    AFTER UPDATE ON populations
    FOR EACH ROW
BEGIN
    UPDATE populations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_personnel_timestamp 
    AFTER UPDATE ON personnel
    FOR EACH ROW
BEGIN
    UPDATE personnel SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_department_timestamp 
    AFTER UPDATE ON departments
    FOR EACH ROW
BEGIN
    UPDATE departments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_position_timestamp 
    AFTER UPDATE ON positions
    FOR EACH ROW
BEGIN
    UPDATE positions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_schedule_week_timestamp 
    AFTER UPDATE ON schedule_weeks
    FOR EACH ROW
BEGIN
    UPDATE schedule_weeks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_assignment_timestamp 
    AFTER UPDATE ON assignments
    FOR EACH ROW
BEGIN
    UPDATE assignments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_constraint_timestamp 
    AFTER UPDATE ON constraints
    FOR EACH ROW
BEGIN
    UPDATE constraints SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger: Validate PersonSkill business rules (PRD Section 6.3)
CREATE TRIGGER IF NOT EXISTS validate_person_skill_dates_insert
    BEFORE INSERT ON person_skills
    FOR EACH ROW
    WHEN (
        (NEW.status = 'בתהליך הסמכה' AND (NEW.training_start_date IS NULL OR NEW.training_end_date IS NULL)) OR
        (NEW.status IN ('מוסמך כשיר', 'פג תוקף') AND NEW.expiry_date IS NULL)
    )
BEGIN
    SELECT RAISE(ABORT, 'Invalid dates for skill status');
END;

CREATE TRIGGER IF NOT EXISTS validate_person_skill_dates_update
    BEFORE UPDATE ON person_skills
    FOR EACH ROW
    WHEN (
        (NEW.status = 'בתהליך הסמכה' AND (NEW.training_start_date IS NULL OR NEW.training_end_date IS NULL)) OR
        (NEW.status IN ('מוסמך כשיר', 'פג תוקף') AND NEW.expiry_date IS NULL)
    )
BEGIN
    SELECT RAISE(ABORT, 'Invalid dates for skill status');
END;

-- Trigger: Validate constraint time ranges
CREATE TRIGGER IF NOT EXISTS validate_constraint_times
    BEFORE INSERT ON constraints
    FOR EACH ROW
    WHEN (NEW.is_full_day = 0 AND (NEW.start_time IS NULL OR NEW.end_time IS NULL OR NEW.start_time >= NEW.end_time))
BEGIN
    SELECT RAISE(ABORT, 'Invalid time range for partial day constraint');
END;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_personnel_personal_number ON personnel(personal_number);
CREATE INDEX IF NOT EXISTS idx_personnel_population ON personnel(population_id);
CREATE INDEX IF NOT EXISTS idx_personnel_department ON personnel(department_id);
CREATE INDEX IF NOT EXISTS idx_person_skills_person ON person_skills(person_id);
CREATE INDEX IF NOT EXISTS idx_person_skills_skill ON person_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_roles_position ON roles(position_id);
CREATE INDEX IF NOT EXISTS idx_role_skills_role ON role_skills(role_id);
CREATE INDEX IF NOT EXISTS idx_assignments_person ON assignments(person_id);
CREATE INDEX IF NOT EXISTS idx_assignments_time_block ON assignments(time_block_id);
CREATE INDEX IF NOT EXISTS idx_constraints_person ON constraints(person_id);
CREATE INDEX IF NOT EXISTS idx_constraints_date ON constraints(date);
CREATE INDEX IF NOT EXISTS idx_schedule_weeks_position ON schedule_weeks(position_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_schedule ON time_blocks(schedule_week_id);