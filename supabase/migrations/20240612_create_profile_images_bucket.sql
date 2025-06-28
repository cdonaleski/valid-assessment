-- Create profile-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-images',
    'profile-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Add profile_image_url column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Create storage policy for profile images
-- Users can upload their own profile image
CREATE POLICY "Users can upload their own profile image" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'profile-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view any profile image (public bucket)
CREATE POLICY "Anyone can view profile images" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

-- Users can update their own profile image
CREATE POLICY "Users can update their own profile image" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'profile-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own profile image
CREATE POLICY "Users can delete their own profile image" ON storage.objects
FOR DELETE USING (
    bucket_id = 'profile-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
); 