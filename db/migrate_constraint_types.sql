-- Migration: Update constraint types from Hebrew to English keys
-- This migration aligns the database schema with the UI constraint types

-- First, create a temporary table with the new constraint
CREATE TABLE constraints_new (
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

-- Copy existing data with type mapping
INSERT INTO constraints_new (id, person_id, date, is_full_day, start_time, end_time, type, description, created_at, updated_at)
SELECT 
    id, 
    person_id, 
    date, 
    is_full_day, 
    start_time, 
    end_time,
    CASE 
        WHEN type = 'חופשה' THEN 'vacation'
        WHEN type = 'מחלה' THEN 'medical'
        WHEN type = 'מילואים' THEN 'reserves'
        WHEN type = 'קורס' THEN 'course'
        WHEN type = 'אחר' THEN 'other'
        ELSE 'other'  -- fallback for any unmapped types
    END as type,
    description,
    created_at,
    updated_at
FROM constraints;

-- Drop the old table
DROP TABLE constraints;

-- Rename the new table
ALTER TABLE constraints_new RENAME TO constraints;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_constraints_person ON constraints(person_id);
CREATE INDEX IF NOT EXISTS idx_constraints_date ON constraints(date);

-- Recreate the update timestamp trigger
CREATE TRIGGER IF NOT EXISTS update_constraint_timestamp 
    AFTER UPDATE ON constraints
    FOR EACH ROW
BEGIN
    UPDATE constraints SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Recreate constraint time validation trigger
CREATE TRIGGER IF NOT EXISTS validate_constraint_times
    BEFORE INSERT ON constraints
    FOR EACH ROW
    WHEN (NEW.is_full_day = 0 AND (NEW.start_time IS NULL OR NEW.end_time IS NULL OR NEW.start_time >= NEW.end_time))
BEGIN
    SELECT RAISE(ABORT, 'Invalid time range for partial day constraint');
END;