import React, { useState } from 'react';
import { Camera, Image as ImageIcon, User } from 'lucide-react';
import { uploadFoto } from '../services/fotoService';

interface FotoPickerProps {
  value: string;
  onChange: (url: string) => void;
  /** Pasta no Storage (ex.: id da paróquia). */
  folder: string;
  size?: number;
}

/** Escolhe foto da galeria ou tira na hora (câmera, em celular/tablet) e envia ao Storage. */
const FotoPicker: React.FC<FotoPickerProps> = ({ value, onChange, folder, size = 80 }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      onChange(await uploadFoto(file, folder));
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar a foto.');
    } finally {
      setUploading(false);
    }
  };

  const btn =
    'inline-flex items-center gap-1.5 text-xs font-bold text-church-700 bg-church-50 border border-church-100 hover:bg-church-100 px-3 py-1.5 rounded-lg cursor-pointer transition-colors';

  return (
    <div className="flex items-center gap-4">
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-church-100 border border-church-200 overflow-hidden flex items-center justify-center text-church-600 shrink-0"
      >
        {value ? <img src={value} alt="Foto" className="h-full w-full object-cover" /> : <User size={size / 2.5} />}
      </div>
      <div>
        <div className="flex flex-wrap gap-2">
          <label className={btn}>
            <ImageIcon size={14} /> Galeria
            <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handle} />
          </label>
          <label className={btn}>
            <Camera size={14} /> Tirar foto
            <input type="file" accept="image/*" capture="user" className="hidden" disabled={uploading} onChange={handle} />
          </label>
          {value && !uploading && (
            <button type="button" onClick={() => onChange('')} className="text-xs text-red-500 hover:underline">
              Remover
            </button>
          )}
        </div>
        {uploading && <p className="text-xs text-gray-500 mt-1">Enviando...</p>}
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    </div>
  );
};

export default FotoPicker;
