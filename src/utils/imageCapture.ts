export interface CompressedCover {
  thumbnail: Blob;
  full:      Blob;
}

export async function captureAndCompress(file: File | Blob): Promise<CompressedCover> {
  const img = await loadImage(file);
  return {
    thumbnail: await resizeToBlob(img, 100, 0.60),
    full:      await resizeToBlob(img, 600, 0.75),
  };
}

function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img  = new Image();
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

function resizeToBlob(img: HTMLImageElement, maxDim: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth  * scale);
  const h = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('toBlob failed')),
      'image/jpeg',
      quality,
    )
  );
}
