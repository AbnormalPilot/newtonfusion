-- Create music_tracks table for storing saved music files
CREATE TABLE IF NOT EXISTS music_tracks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_music_tracks_created_at ON music_tracks(created_at DESC);
