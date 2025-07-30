import { getStorage, ref, uploadBytes, getDownloadURL, UploadResult } from 'firebase/storage';
import { doc, updateDoc, arrayUnion, getFirestore } from 'firebase/firestore';
import firebaseApp from './config';

const storage = getStorage(firebaseApp);
const db = getFirestore(firebaseApp);

interface UploadFileResult {
  name: string;
  size: number;
  type: string;
  downloadUrl: string;
  storagePath: string;
}

interface UploadParams {
  file: File;
  requestId: string;
  userId: string;
  type: 'requests' | 'orders';
}

const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
};

export const uploadFile = async ({ file, requestId, userId, type }: UploadParams): Promise<UploadFileResult> => {
  try {
    // Create a sanitized file name to prevent storage path issues
    const sanitizedFileName = sanitizeFileName(file.name);
    // Create a structured path: type/requestId/userId/timestamp_filename
    const timestamp = Date.now();
    const storagePath = `${type}/${requestId}/${userId}/${timestamp}_${sanitizedFileName}`;
    
    // Create a storage reference
    const storageRef = ref(storage, storagePath);
    
    // Upload the file
    const snapshot: UploadResult = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);
    
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      downloadUrl,
      storagePath
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const getFileDownloadUrl = async (filePath: string): Promise<string> => {
  try {
    const fileRef = ref(storage, filePath);
    return await getDownloadURL(fileRef);
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
};

export const uploadFileWithMetadata = async (
  { file, requestId, userId, type }: UploadParams,
  updateFirestore: boolean = true
): Promise<UploadFileResult> => {
  try {
    // 1. Upload file to Firebase Storage
    const fileResult = await uploadFile({ file, requestId, userId, type });

    // 2. Update Firestore document with file metadata if requested
    if (updateFirestore) {
      const requestDoc = doc(db, 'printRequests', requestId);
      await updateDoc(requestDoc, {
        // Update both new and legacy file structures for compatibility
        'enhancedFiles.uploaded': arrayUnion({
          name: fileResult.name,
          size: fileResult.size,
          type: fileResult.type,
          downloadUrl: fileResult.downloadUrl,
          storagePath: fileResult.storagePath,
          uploadedAt: new Date().toISOString(),
          status: 'uploaded'
        }),
        'files': arrayUnion({
          name: fileResult.name,
          size: fileResult.size,
          type: fileResult.type,
          downloadUrl: fileResult.downloadUrl,
          storagePath: fileResult.storagePath
        })
      });
    }

    return fileResult;
  } catch (error) {
    console.error('Error in uploadFileWithMetadata:', error);
    throw error;
  }
};
