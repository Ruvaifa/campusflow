-- Migration Script: Entity Relations and Indexes
-- Purpose: Ensure proper relations, indexes, and constraints for entity resolution

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
-- Ensure profiles table has proper structure and indexes
CREATE TABLE IF NOT EXISTS profiles (
    entity_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    email TEXT UNIQUE,
    department TEXT,
    student_id TEXT UNIQUE,
    staff_id TEXT UNIQUE,
    card_id TEXT UNIQUE,
    device_hash TEXT UNIQUE,
    face_id TEXT UNIQUE,
    metadata_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_card_id ON profiles(card_id);
CREATE INDEX IF NOT EXISTS idx_profiles_device_hash ON profiles(device_hash);
CREATE INDEX IF NOT EXISTS idx_profiles_face_id ON profiles(face_id);

-- Full-text search index for name and email
CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles USING gin(to_tsvector('english', name || ' ' || COALESCE(email, '')));

-- ============================================
-- 2. SWIPES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS swipes (
    id SERIAL PRIMARY KEY,
    identity TEXT NOT NULL,
    card_id TEXT NOT NULL,
    location_id TEXT,
    location TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    raw_record_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_swipes_identity ON swipes(identity);
CREATE INDEX IF NOT EXISTS idx_swipes_card_id ON swipes(card_id);
CREATE INDEX IF NOT EXISTS idx_swipes_timestamp ON swipes(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_swipes_location ON swipes(location);

-- ============================================
-- 3. WIFI_LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS wifi_logs (
    id SERIAL PRIMARY KEY,
    identity TEXT NOT NULL,
    device_hash TEXT NOT NULL,
    ap_id TEXT,
    location TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    raw_record_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wifi_logs_identity ON wifi_logs(identity);
CREATE INDEX IF NOT EXISTS idx_wifi_logs_device_hash ON wifi_logs(device_hash);
CREATE INDEX IF NOT EXISTS idx_wifi_logs_timestamp ON wifi_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_wifi_logs_location ON wifi_logs(location);

-- ============================================
-- 4. LAB_BOOKINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS lab_bookings (
    id SERIAL PRIMARY KEY,
    identity TEXT NOT NULL,
    booking_id TEXT UNIQUE NOT NULL,
    entity_id TEXT NOT NULL,
    lab_id TEXT NOT NULL,
    lab_name TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    booking_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attended_flag BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lab_bookings_identity ON lab_bookings(identity);
CREATE INDEX IF NOT EXISTS idx_lab_bookings_entity_id ON lab_bookings(entity_id);
CREATE INDEX IF NOT EXISTS idx_lab_bookings_start_time ON lab_bookings(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_lab_bookings_booking_id ON lab_bookings(booking_id);

-- ============================================
-- 5. LIBRARY_CHECKOUTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS library_checkouts (
    id SERIAL PRIMARY KEY,
    identity TEXT NOT NULL,
    checkout_id TEXT UNIQUE NOT NULL,
    entity_id TEXT NOT NULL,
    book_id TEXT NOT NULL,
    book_title TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    checkout_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    return_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_library_checkouts_identity ON library_checkouts(identity);
CREATE INDEX IF NOT EXISTS idx_library_checkouts_entity_id ON library_checkouts(entity_id);
CREATE INDEX IF NOT EXISTS idx_library_checkouts_timestamp ON library_checkouts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_library_checkouts_checkout_id ON library_checkouts(checkout_id);

-- ============================================
-- 6. NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    identity TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    source TEXT NOT NULL,
    text TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notes_identity ON notes(identity);
CREATE INDEX IF NOT EXISTS idx_notes_entity_id ON notes(entity_id);
CREATE INDEX IF NOT EXISTS idx_notes_source ON notes(source);
CREATE INDEX IF NOT EXISTS idx_notes_timestamp ON notes(timestamp DESC);

-- ============================================
-- 7. CCTV_FRAME TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cctv_frame (
    id SERIAL PRIMARY KEY,
    identity TEXT,
    frame_id TEXT UNIQUE NOT NULL,
    location_id TEXT NOT NULL,
    location TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    face_id TEXT,
    image_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cctv_frame_identity ON cctv_frame(identity);
CREATE INDEX IF NOT EXISTS idx_cctv_frame_face_id ON cctv_frame(face_id);
CREATE INDEX IF NOT EXISTS idx_cctv_frame_location_id ON cctv_frame(location_id);
CREATE INDEX IF NOT EXISTS idx_cctv_frame_timestamp ON cctv_frame(timestamp DESC);

-- ============================================
-- 8. FACE_EMBEDDING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS face_embedding (
    id SERIAL PRIMARY KEY,
    identity TEXT NOT NULL,
    face_id TEXT UNIQUE NOT NULL,
    embedding TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_face_embedding_identity ON face_embedding(identity);
CREATE INDEX IF NOT EXISTS idx_face_embedding_face_id ON face_embedding(face_id);

-- ============================================
-- 9. FOREIGN KEY CONSTRAINTS (Optional - for referential integrity)
-- ============================================
-- Note: These are commented out by default. Uncomment if you want strict referential integrity.
-- However, this may cause issues if data is inserted in the wrong order.

-- ALTER TABLE swipes 
--     ADD CONSTRAINT fk_swipes_profile 
--     FOREIGN KEY (identity) REFERENCES profiles(entity_id) ON DELETE CASCADE;

-- ALTER TABLE wifi_logs 
--     ADD CONSTRAINT fk_wifi_logs_profile 
--     FOREIGN KEY (identity) REFERENCES profiles(entity_id) ON DELETE CASCADE;

-- ALTER TABLE lab_bookings 
--     ADD CONSTRAINT fk_lab_bookings_profile 
--     FOREIGN KEY (entity_id) REFERENCES profiles(entity_id) ON DELETE CASCADE;

-- ALTER TABLE library_checkouts 
--     ADD CONSTRAINT fk_library_checkouts_profile 
--     FOREIGN KEY (entity_id) REFERENCES profiles(entity_id) ON DELETE CASCADE;

-- ALTER TABLE notes 
--     ADD CONSTRAINT fk_notes_profile 
--     FOREIGN KEY (entity_id) REFERENCES profiles(entity_id) ON DELETE CASCADE;

-- ALTER TABLE cctv_frame 
--     ADD CONSTRAINT fk_cctv_frame_profile 
--     FOREIGN KEY (identity) REFERENCES profiles(entity_id) ON DELETE SET NULL;

-- ALTER TABLE face_embedding 
--     ADD CONSTRAINT fk_face_embedding_profile 
--     FOREIGN KEY (identity) REFERENCES profiles(entity_id) ON DELETE CASCADE;

-- ============================================
-- 10. VIEWS FOR ENTITY ACTIVITY SUMMARY
-- ============================================

-- View: Latest activity per entity
CREATE OR REPLACE VIEW entity_latest_activity AS
SELECT 
    p.entity_id,
    p.name,
    p.email,
    p.department,
    p.role,
    GREATEST(
        COALESCE(MAX(s.timestamp), '1970-01-01'::timestamp),
        COALESCE(MAX(w.timestamp), '1970-01-01'::timestamp),
        COALESCE(MAX(lb.start_time), '1970-01-01'::timestamp),
        COALESCE(MAX(lc.timestamp), '1970-01-01'::timestamp)
    ) as last_seen,
    COUNT(DISTINCT s.id) as swipe_count,
    COUNT(DISTINCT w.id) as wifi_count,
    COUNT(DISTINCT lb.id) as booking_count,
    COUNT(DISTINCT lc.id) as checkout_count
FROM profiles p
LEFT JOIN swipes s ON p.entity_id = s.identity
LEFT JOIN wifi_logs w ON p.entity_id = w.identity
LEFT JOIN lab_bookings lb ON p.entity_id = lb.entity_id
LEFT JOIN library_checkouts lc ON p.entity_id = lc.entity_id
GROUP BY p.entity_id, p.name, p.email, p.department, p.role;

-- View: Entity activity counts (last 7 days)
CREATE OR REPLACE VIEW entity_recent_activity AS
SELECT 
    p.entity_id,
    p.name,
    COUNT(DISTINCT s.id) as recent_swipes,
    COUNT(DISTINCT w.id) as recent_wifi,
    COUNT(DISTINCT lb.id) as recent_bookings,
    COUNT(DISTINCT lc.id) as recent_checkouts,
    COUNT(DISTINCT s.id) + COUNT(DISTINCT w.id) + COUNT(DISTINCT lb.id) + COUNT(DISTINCT lc.id) as total_activities
FROM profiles p
LEFT JOIN swipes s ON p.entity_id = s.identity AND s.timestamp >= NOW() - INTERVAL '7 days'
LEFT JOIN wifi_logs w ON p.entity_id = w.identity AND w.timestamp >= NOW() - INTERVAL '7 days'
LEFT JOIN lab_bookings lb ON p.entity_id = lb.entity_id AND lb.start_time >= NOW() - INTERVAL '7 days'
LEFT JOIN library_checkouts lc ON p.entity_id = lc.entity_id AND lc.timestamp >= NOW() - INTERVAL '7 days'
GROUP BY p.entity_id, p.name;

-- ============================================
-- 11. FUNCTIONS FOR ENTITY RESOLUTION
-- ============================================

-- Function to get entity status (active/inactive)
CREATE OR REPLACE FUNCTION get_entity_status(entity_id_param TEXT)
RETURNS TEXT AS $$
DECLARE
    last_activity TIMESTAMP;
BEGIN
    SELECT GREATEST(
        COALESCE(MAX(s.timestamp), '1970-01-01'::timestamp),
        COALESCE(MAX(w.timestamp), '1970-01-01'::timestamp),
        COALESCE(MAX(lb.start_time), '1970-01-01'::timestamp),
        COALESCE(MAX(lc.timestamp), '1970-01-01'::timestamp)
    ) INTO last_activity
    FROM profiles p
    LEFT JOIN swipes s ON p.entity_id = s.identity
    LEFT JOIN wifi_logs w ON p.entity_id = w.identity
    LEFT JOIN lab_bookings lb ON p.entity_id = lb.entity_id
    LEFT JOIN library_checkouts lc ON p.entity_id = lc.entity_id
    WHERE p.entity_id = entity_id_param;
    
    IF last_activity >= NOW() - INTERVAL '1 hour' THEN
        RETURN 'active';
    ELSIF last_activity >= NOW() - INTERVAL '24 hours' THEN
        RETURN 'recent';
    ELSE
        RETURN 'inactive';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 12. TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for face_embedding table
DROP TRIGGER IF EXISTS update_face_embedding_updated_at ON face_embedding;
CREATE TRIGGER update_face_embedding_updated_at
    BEFORE UPDATE ON face_embedding
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Run this script in your Supabase SQL Editor to create all necessary
-- tables, indexes, views, and functions for the entity resolution system.
