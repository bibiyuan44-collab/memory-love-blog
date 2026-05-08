import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

interface GalleryPhoto {
  id: string;
  image_url: string;
  description: string | null;
  created_at: string;
  x: number;
  y: number;
  rotate: number;
  z: number;
}

interface GalleryPhotoRow {
  id: string;
  image_url: string;
  description?: string | null;
  created_at: string;
}

export const OurPhotos: React.FC = () => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [zCounter, setZCounter] = useState(20);

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from('gallery_photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (queryError) {
      setError(queryError.message);
      alert(`读取相册失败: ${queryError.message}`);
      setLoading(false);
      return;
    }

    const mappedPhotos = ((data as GalleryPhotoRow[]) ?? []).map((row, index) => {
      const col = index % 5;
      const line = Math.floor(index / 5);
      return {
        id: row.id,
        image_url: row.image_url,
        description: row.description ?? null,
        created_at: row.created_at,
        x: 30 + col * 160 + Math.random() * 35,
        y: 20 + line * 180 + Math.random() * 20,
        rotate: (Math.random() - 0.5) * 14,
        z: index + 1,
      };
    });

    setPhotos(mappedPhotos);
    setZCounter(mappedPhotos.length + 30);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchPhotos();
  }, [fetchPhotos]);

  const titleText = useMemo(() => (isAdmin ? 'Our Photos [ADMIN]' : 'Our Photos'), [isAdmin]);

  const bringToFront = (photoId: string) => {
    setZCounter((prev) => {
      const next = prev + 1;
      setPhotos((current) =>
        current.map((photo) => (photo.id === photoId ? { ...photo, z: next } : photo)),
      );
      return next;
    });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      const message = '请先选择图片文件';
      setError(message);
      alert(message);
      return;
    }

    setUploading(true);
    setError(null);

    const safeName = selectedFile.name.replace(/\s+/g, '-');
    const filePath = `gallery/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('memories')
      .upload(filePath, selectedFile, { upsert: false });

    if (uploadError) {
      setError(uploadError.message);
      alert(`上传图片失败: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('memories')
      .getPublicUrl(filePath);

    const { error: insertError } = await supabase.from('gallery_photos').insert({
      image_url: publicUrlData.publicUrl,
      description: description.trim() || null,
    });

    if (insertError) {
      setError(insertError.message);
      alert(`保存记录失败: ${insertError.message}`);
      setUploading(false);
      return;
    }

    setSelectedFile(null);
    setDescription('');
    setUploading(false);
    await fetchPhotos();
  };

  return (
    <div className="absolute inset-0 bg-[#008080] flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full h-full max-w-[1220px] max-h-[760px] win-bevel-out p-[3px] flex flex-col">
        <div
          className="h-[28px] u-dream-title flex items-center px-2 text-white select-none"
          onDoubleClick={() => setIsAdmin((prev) => !prev)}
        >
          <span className="text-[13px] font-bold" style={{ fontFamily: 'MS Sans Serif, Tahoma' }}>
            {titleText}
          </span>
          <div className="ml-auto flex items-center gap-[2px]">
            <button className="win-btn win-title-btn">_</button>
            <button className="win-btn win-title-btn">□</button>
            <button className="win-btn win-title-btn">
              <span className="mt-[1px] ml-[1px]">✕</span>
            </button>
          </div>
        </div>

        {isAdmin && (
          <form
            onSubmit={handleUpload}
            className="p-2 border-b border-[#808080] bg-[#d4d0c8] flex flex-wrap items-center gap-2"
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="text-xs"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="写一句照片描述..."
              className="flex-1 min-w-[220px] win-bevel-in bg-white px-2 py-1 text-sm outline-none"
            />
            <button
              type="submit"
              disabled={uploading}
              className="win-bevel-out px-3 py-1 text-xs active:win-bevel-in disabled:opacity-60"
              style={{ fontFamily: 'MS Sans Serif, Tahoma' }}
            >
              {uploading ? '上传中...' : '上传并保存'}
            </button>
          </form>
        )}

        {error && (
          <div className="px-3 py-1.5 text-xs text-[var(--dream-accent)] bg-[#dfe8f5] border-b border-[var(--win-dark-gray)]">
            {error}
          </div>
        )}

        <div className="relative flex-1 overflow-auto bg-[#0f2a48] bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.08),transparent_26%),linear-gradient(180deg,#162d4f,#0d1f38)]">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
              正在加载照片...
            </div>
          ) : photos.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-white/90 text-sm">
              还没有照片，先上传一张吧。
            </div>
          ) : (
            photos.map((photo) => (
              <motion.article
                key={photo.id}
                drag
                dragMomentum={false}
                dragElastic={0.08}
                initial={{ opacity: 0, scale: 0.92, rotate: photo.rotate - 6 }}
                animate={{ opacity: 1, scale: 1, rotate: photo.rotate }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 1.03 }}
                onPointerDown={() => bringToFront(photo.id)}
                className="absolute w-[180px] bg-white shadow-[0_8px_20px_rgba(0,0,0,0.45)] border border-[#dfdfdf] p-2 pb-10 cursor-grab active:cursor-grabbing"
                style={{ left: photo.x, top: photo.y, zIndex: photo.z }}
              >
                <img
                  src={photo.image_url}
                  alt={photo.description ?? 'photo'}
                  className="w-full h-[150px] object-cover bg-[#efefef] pointer-events-none"
                  draggable={false}
                />
                <p
                  className="absolute left-3 right-3 bottom-2 text-[13px] text-gray-700 break-words"
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                >
                  {photo.description || '...'}
                </p>
              </motion.article>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
