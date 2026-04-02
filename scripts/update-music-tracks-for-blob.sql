-- Update the music_tracks table to use file_url instead of audio_data
ALTER TABLE music_tracks 
DROP COLUMN IF EXISTS audio_data,
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_music_tracks_created_at ON music_tracks(created_at DESC);
