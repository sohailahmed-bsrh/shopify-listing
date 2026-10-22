import React, { useState, useRef } from 'react';
import { Upload, X, ArrowLeft, ArrowRight, Image as ImageIcon, Video, Cloud, CheckCircle, AlertCircle } from 'lucide-react';
import { ListingMedia } from '../types';
import { api } from '../services/api';

interface MediaUploaderProps {
  media: ListingMedia[];
  onChange: (media: ListingMedia[]) => void;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({ media, onChange }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    const uploadedMediaList: ListingMedia[] = [...media];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideo = file.type.startsWith('video');
        const uploadResult = await api.uploadMediaFile(file);

        uploadedMediaList.push({
          media_type: isVideo ? 'video' : 'image',
          url: uploadResult.url,
          oci_storage_key: uploadResult.storageKey,
          alt_text: file.name.replace(/\.[^/.]+$/, ''),
          position: uploadedMediaList.length + 1
        });
      }

      onChange(uploadedMediaList);
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading file to storage');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeMedia = (index: number) => {
    const updated = media.filter((_, i) => i !== index);
    // Re-index positions
    const reindexed = updated.map((m, i) => ({ ...m, position: i + 1 }));
    onChange(reindexed);
  };

  const moveMedia = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= media.length) return;
    const updated = [...media];
    const item = updated.splice(fromIndex, 1)[0];
    updated.splice(toIndex, 0, item);
    const reindexed = updated.map((m, i) => ({ ...m, position: i + 1 }));
    onChange(reindexed);
  };

  const updateAltText = (index: number, alt_text: string) => {
    const updated = [...media];
    updated[index].alt_text = alt_text;
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFileUpload(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-white/10 hover:border-white/20 bg-[#09090b]/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />

        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
          <Upload className="w-6 h-6" />
        </div>

        <p className="text-sm font-semibold text-white mb-1">
          {isUploading ? 'Uploading to Oracle Cloud S3...' : 'Click or drag product images & videos here'}
        </p>
        <p className="text-xs text-zinc-400 text-center max-w-sm">
          Supports JPG, PNG, WebP, MP4, WebM (up to 50MB). Stored securely on Oracle Cloud Object Storage.
        </p>
      </div>

      {uploadError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          {uploadError}
        </div>
      )}

      {/* Media Gallery Grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {media.map((item, index) => (
            <div
              key={index}
              className="group relative rounded-xl overflow-hidden bg-[#07090e] border border-white/10 flex flex-col"
            >
              {/* Badge for Thumbnail */}
              {index === 0 && (
                <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-indigo-600 text-[10px] font-bold text-white shadow-md">
                  Primary
                </div>
              )}

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => removeMedia(index)}
                className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/70 hover:bg-red-500/80 text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Preview */}
              <div className="aspect-square w-full bg-zinc-950 relative flex items-center justify-center overflow-hidden">
                {item.media_type === 'video' ? (
                  <video src={item.url} className="w-full h-full object-cover" controls={false} />
                ) : (
                  <img src={item.url} alt={item.alt_text || 'Media'} className="w-full h-full object-cover" />
                )}
              </div>

              {/* Controls and Alt Text */}
              <div className="p-2.5 bg-[#09090b] flex flex-col gap-2">
                <input
                  type="text"
                  value={item.alt_text || ''}
                  onChange={(e) => updateAltText(index, e.target.value)}
                  placeholder="Image Alt text (SEO)"
                  className="w-full text-[11px] px-2 py-1 bg-black/40 border border-white/5 rounded text-zinc-300 focus:outline-none focus:border-indigo-500"
                />

                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span className="text-[10px] font-mono text-zinc-500">#{index + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveMedia(index, index - 1)}
                      className="p-1 hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Move left"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === media.length - 1}
                      onClick={() => moveMedia(index, index + 1)}
                      className="p-1 hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Move right"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
