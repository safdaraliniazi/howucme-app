import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];

export interface UploadProgress {
  progress: number;
  status: 'uploading' | 'complete' | 'error';
}

export class MediaUploadError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'MediaUploadError';
  }
}

export function validateFile(file: File): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  // Check file type
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    return {
      isValid: false,
      error: 'File must be an image (JPEG, PNG, GIF, WebP) or video (MP4, WebM, OGG, AVI, MOV)'
    };
  }

  return { isValid: true };
}

export function getFileType(file: File): 'image' | 'video' {
  return ALLOWED_IMAGE_TYPES.includes(file.type) ? 'image' : 'video';
}

export async function uploadMediaFile(
  file: File,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ url: string; type: 'image' | 'video' }> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw new MediaUploadError(validation.error!, 'INVALID_FILE');
    }

    // Create unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}_${timestamp}.${fileExtension}`;
    const fileType = getFileType(file);
    
    // Create storage reference
    const storageRef = ref(storage, `posts/${fileType}s/${fileName}`);

    // Notify upload start
    onProgress?.({ progress: 0, status: 'uploading' });

    // Upload file
    const uploadResult = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);

    // Notify upload complete
    onProgress?.({ progress: 100, status: 'complete' });

    return {
      url: downloadURL,
      type: fileType
    };

  } catch (error: any) {
    onProgress?.({ progress: 0, status: 'error' });
    
    if (error instanceof MediaUploadError) {
      throw error;
    }

    // Handle Firebase errors
    if (error.code === 'storage/unauthorized') {
      throw new MediaUploadError('You are not authorized to upload files', 'UNAUTHORIZED');
    } else if (error.code === 'storage/canceled') {
      throw new MediaUploadError('Upload was canceled', 'CANCELED');
    } else if (error.code === 'storage/unknown') {
      throw new MediaUploadError('An unknown error occurred during upload', 'UNKNOWN');
    } else if (error.message?.includes('CORS') || error.name === 'NetworkError') {
      throw new MediaUploadError('Media uploads are being configured. Please try text-only posts for now.', 'CORS_ERROR');
    } else {
      throw new MediaUploadError('Failed to upload file. Please try again.', 'UPLOAD_FAILED');
    }
  }
}

export async function deleteMediaFile(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error: any) {
    console.error('Error deleting media file:', error);
    // Don't throw error for delete operations to avoid breaking the app
  }
}

export function createMediaPreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to create file preview'));
    };
    
    reader.readAsDataURL(file);
  });
}
