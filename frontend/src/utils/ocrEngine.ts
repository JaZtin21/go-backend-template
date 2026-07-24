// ~/utils/ocrEngine.ts
import { PaddleOcrService } from 'ppu-paddle-ocr/web';

let ocrService: PaddleOcrService | null = null;
let initPromise: Promise<void> | null = null;

const OCR_DEBUG_LOGGING = true;

export const initOcrEngine = async (): Promise<void> => {
    if (ocrService) return;
    if (!initPromise) {
        initPromise = (async () => {
            const service = new PaddleOcrService();
            await service.initialize();
            ocrService = service;
        })();
    }
    return initPromise;
};

export const isOcrEngineReady = (): boolean => ocrService !== null;

/** Converts an already-decoded HTMLImageElement into a canvas for recognize(). */
export const imageElementToCanvas = (imgElement: HTMLImageElement): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = imgElement.naturalWidth || imgElement.width;
    canvas.height = imgElement.naturalHeight || imgElement.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
    }
    return canvas;
};

/** Runs OCR on a canvas and returns the raw recognized text. */
export const recognizeProductText = async (input: HTMLCanvasElement): Promise<string> => {
    if (!ocrService) await initOcrEngine();

    const result = await ocrService!.recognize(input);

    if (OCR_DEBUG_LOGGING) {
        console.log('%c[OCR] Raw text:', 'color: #22c55e; font-weight: bold', result?.text ?? '(empty)');
        console.log('%c[OCR] Overall confidence:', 'color: #22c55e', (result as any)?.confidence ?? '');

        // Each entry in `lines` is itself an array of word-level detections for that line.
        const lines = (result as any)?.lines ?? [];
        if (Array.isArray(lines) && lines.length > 0) {
            const flatWords = lines.flatMap((line: any[], lineIndex: number) =>
                line.map((word: any) => ({
                    line: lineIndex,
                    text: word.text ?? '',
                    confidence: word.confidence != null ? word.confidence.toFixed(3) : '',
                }))
            );
            console.table(flatWords);
        }
    }

    return result?.text ?? '';
};

export const destroyOcrEngine = async (): Promise<void> => {
    if (ocrService) {
        await ocrService.destroy();
        ocrService = null;
        initPromise = null;
    }
};