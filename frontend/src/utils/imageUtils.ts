// tinybase/imageUtils.ts
//
// TinyBase cells only hold string/number/boolean -- a File object can't go
// in directly. This converts a File to a base64 data URL (which any img
// src can render as-is) and resizes it down first, since raw phone
// camera photos can be several MB each and would otherwise bloat every
// IndexedDB write.

export async function fileToStorableBase64(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    if (!file.type.startsWith('image/')) return dataUrl; // non-image files: skip resizing

    return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, maxWidth / img.width);
            const canvas = document.createElement('canvas');
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(dataUrl); // fallback to unresized original
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
}

// Reverse of fileToStorableBase64 — turns a stored base64 data URL back into
// a real File, so it can be sent through your normal upload mechanism during
// sync. Only called on rows whose `photo` is still a data: URL (meaning it
// was taken/added while offline and never actually uploaded anywhere).
export function base64ToFile(dataUrl: string, filename: string): File {
    const [header, base64] = dataUrl.split(',');
    const mimeMatch = header.match(/data:(.*?);base64/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], filename, { type: mime });
}