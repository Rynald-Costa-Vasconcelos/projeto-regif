import { useState, useRef, useEffect } from "react";
import { newsApi } from "../api/news.api";
import { filterImagesByMinSize, getCroppedBlob, getImageSize } from "../utils";
import type { CropArea } from "../types";

export function useNewsMedia() {
  // Capa
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverTmpId, setCoverTmpId] = useState<string | null>(null);
  const [coverLocalPreview, setCoverLocalPreview] = useState<string>("");
  const [uploadingCover, setUploadingCover] = useState(false);

  // Crop
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);

  // Galeria
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryTmpIds, setGalleryTmpIds] = useState<string[]>([]);
  const [galleryLocalPreviews, setGalleryLocalPreviews] = useState<string[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // === PREVIEWS ===
  useEffect(() => {
    if (!coverFile) {
      setCoverLocalPreview("");
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverLocalPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  useEffect(() => {
    if (!galleryFiles.length) {
      setGalleryLocalPreviews([]);
      return;
    }
    const urls = galleryFiles.map((f) => URL.createObjectURL(f));
    setGalleryLocalPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [galleryFiles]);

  // === ACTIONS CAPA ===
  const clearCover = async () => {
    setCoverFile(null);
    if (coverTmpId) {
      await newsApi.deleteTmp(coverTmpId).catch(() => {});
      setCoverTmpId(null);
    }
  };

  const handleSelectCover = async (file: File) => {
    const { w, h } = await getImageSize(file);
    // Auto-upload se for 16:9 e tamanho ok
    const ratio = w / h;
    const is16by9 = Math.abs(ratio - 16 / 9) < 0.02;

    if (w >= 1280 && h >= 720 && is16by9) {
      setCoverFile(file);
      if (coverTmpId) await newsApi.deleteTmp(coverTmpId);
      setUploadingCover(true);
      try {
        const id = await newsApi.uploadCoverTmp(file);
        setCoverTmpId(id);
      } finally {
        setUploadingCover(false);
      }
    } else {
      // Abre Crop
      const src = URL.createObjectURL(file);
      if (cropSrc) URL.revokeObjectURL(cropSrc);
      setCropSrc(src);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setIsCropOpen(true);
    }
  };

  const confirmCrop = async () => {
    if (!cropSrc || !croppedAreaPixels) throw new Error("Dados de crop inválidos");
    const blob = await getCroppedBlob(cropSrc, croppedAreaPixels);
    const file = new File([blob], `cover_${Date.now()}.jpg`, { type: "image/jpeg" });

    setCoverFile(file);
    if (coverTmpId) await newsApi.deleteTmp(coverTmpId);
    
    setUploadingCover(true);
    const id = await newsApi.uploadCoverTmp(file);
    setCoverTmpId(id);
    setUploadingCover(false);
    
    // Limpeza
    if (cropSrc.startsWith("blob:")) URL.revokeObjectURL(cropSrc);
    setCropSrc("");
    setIsCropOpen(false);
  };

  // === ACTIONS GALERIA ===
  const clearGallery = async () => {
    setGalleryFiles([]);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (galleryTmpIds.length) {
      await Promise.all(galleryTmpIds.map(id => newsApi.deleteTmp(id).catch(() => {})));
      setGalleryTmpIds([]);
    }
  };

  const handleSelectGallery = async (files: File[]) => {
    if (!files.length) {
      await clearGallery();
      return { accepted: [], rejected: [] };
    }

    const { accepted, rejected } = await filterImagesByMinSize(files, 800, 450);
    
    if (accepted.length > 0) {
      setGalleryFiles(accepted);
      if (galleryTmpIds.length) {
        await Promise.all(galleryTmpIds.map(id => newsApi.deleteTmp(id)));
        setGalleryTmpIds([]);
      }
      setUploadingGallery(true);
      try {
        const ids = await newsApi.uploadGalleryTmp(accepted);
        setGalleryTmpIds(ids);
      } catch (err) {
        setGalleryFiles([]); // Reverte visual
        throw err;
      } finally {
        setUploadingGallery(false);
      }
    }

    if (accepted.length === 0 && rejected.length > 0) {
      throw new Error(
        "Nenhuma imagem atende ao tamanho minimo de 800x450 para a galeria."
      );
    }
    return { accepted, rejected };
  };

  return {
    cover: {
      file: coverFile,
      tmpId: coverTmpId,
      preview: coverLocalPreview,
      uploading: uploadingCover,
      clear: clearCover,
      select: handleSelectCover,
    },
    crop: {
      isOpen: isCropOpen,
      src: cropSrc,
      data: crop,
      zoom,
      setCrop,
      setZoom,
      setArea: setCroppedAreaPixels,
      close: () => {
        if (cropSrc.startsWith("blob:")) URL.revokeObjectURL(cropSrc);
        setCropSrc("");
        setIsCropOpen(false);
      },
      confirm: confirmCrop,
      isReady: !!croppedAreaPixels,
    },
    gallery: {
      files: galleryFiles,
      tmpIds: galleryTmpIds,
      previews: galleryLocalPreviews,
      uploading: uploadingGallery,
      inputRef: galleryInputRef,
      clear: clearGallery,
      select: handleSelectGallery,
    },
    isUploading: uploadingCover || uploadingGallery,
  };
}