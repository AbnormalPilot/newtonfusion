-- Create the music_tracks table for storing saved music
CREATE TABLE IF NOT EXISTS music_tracks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    audio_data BYTEA NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_music_tracks_created_at ON music_tracks(created_at DESC);
