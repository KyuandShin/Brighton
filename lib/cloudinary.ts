/**
 * Cloudinary Helper for Client-Side Unsigned Uploads
 * 
 * To use this, you need:
 * 1. A Cloudinary account
 * 2. An 'Unsigned' upload preset (Enable in Settings > Upload > Upload presets)
 */

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo'; 
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

export async function uploadToCloudinary(file: File | Blob, resourceType: 'video' | 'image' | 'raw' = 'image'): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Upload failed');
  }

  const data = await res.json();
  return data.secure_url;
}
