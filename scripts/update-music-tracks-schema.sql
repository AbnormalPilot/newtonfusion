-- Update the audio_data column to use text instead of bytea for base64 storage
ALTER TABLE music_tracks 
ALTER COLUMN audio_data TYPE TEXT;

-- Add a comment to document the change
COMMENT ON COLUMN music_tracks.audio_data IS 'Base64 encoded audio data';
