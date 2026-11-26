import { supabase } from './supabaseClient';

const BUCKET = 'fotos';
const MAX_SIDE = 400;
const MAX_INPUT_BYTES = 10 * 1024 * 1024;

/** Redimensiona a imagem no navegador (lado maior = 400px) e converte para JPEG. */
async function resizeToJpeg(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Selecione um arquivo de imagem.');
  if (file.size > MAX_INPUT_BYTES) throw new Error('Imagem muito grande (máx. 10 MB).');

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível processar a imagem.');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Falha ao converter a imagem.'))), 'image/jpeg', 0.85)
  );
}

/** Envia a foto para o Supabase Storage e retorna a URL pública. */
export async function uploadFoto(file: File, paroquiaId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const blob = await resizeToJpeg(file);
  const path = `${paroquiaId || 'sem-paroquia'}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    cacheControl: '31536000',
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
