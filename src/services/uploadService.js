import { supabase } from '../config/supabaseClient';

/**
 * Uploads a file to the Supabase LMS Storage Bucket.
 * @param {File} file 
 * @param {string} folder 
 * @returns {Promise<string>} The public URL of the uploaded file.
 */
export const uploadFile = async (file, folder = 'general') => {
  if (!file) return null;

  try {
    // Generar un nombre único para evitar colisiones
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('lms_files')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from('lms_files').getPublicUrl(filePath);
    return data.publicUrl;

  } catch (err) {
    console.error('Error al subir el archivo:', err);
    throw err;
  }
};
