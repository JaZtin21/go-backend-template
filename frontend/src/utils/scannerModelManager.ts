import * as tf from '@tensorflow/tfjs';
import { initOcrEngine } from '~/utils/ocrEngine';

interface LoadingProgress {
    phase: 'model' | 'names' | 'embeddings' | 'ocr' | 'ready' | 'error';
    progress: number;
}

let modelCache: tf.LayersModel | null = null;
let namesCache: string[] | null = null;
let embeddingsCache: tf.Tensor2D | null = null;
let ocrLoaded = false;
let activeLoadingPromise: Promise<void> | null = null;

const trackDownload = (url: string, onProgress: (pct: number) => void): Promise<any> => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url);

        if (url.endsWith('.bin')) {
            xhr.responseType = 'arraybuffer';
        } else if (url.endsWith('.json')) {
            xhr.responseType = 'json';
        }

        xhr.onprogress = (event) => {
            if (event.lengthComputable && event.total > 0) {
                const percentage = Math.round((event.loaded / event.total) * 100);
                onProgress(percentage);
            } else {
                onProgress(50);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                onProgress(100);
                if (url === '/reference_embeddings.bin') {
                    setTimeout(() => resolve(xhr.response), 500);
                } else {
                    resolve(xhr.response);
                }
            } else {
                reject(new Error(`Failed to load ${url}`));
            }
        };

        xhr.onerror = () => reject(new Error(`Network error loading ${url}`));
        xhr.send();
    });
};

export const getCachedScannerAssets = () => {
    return {
        model: modelCache,
        names: namesCache,
        embeddings: embeddingsCache,
        isLoaded: !!(modelCache && namesCache && embeddingsCache && ocrLoaded)
    };
};

export const clearScannerCache = async (): Promise<void> => {
    modelCache = null;
    namesCache = null;
    embeddingsCache = null;
    ocrLoaded = false;
    activeLoadingPromise = null;

    try {
        await tf.io.removeModel('indexeddb://product-matcher-model');
    } catch (err) {
        console.warn("No IndexedDB model to delete:", err);
    }
};

export const initScannerAssets = (onProgress: (status: LoadingProgress) => void): Promise<void> => {
    if (modelCache && namesCache && embeddingsCache && ocrLoaded) {
        onProgress({ phase: 'ready', progress: 100 });
        return Promise.resolve();
    }

    if (activeLoadingPromise) {
        return activeLoadingPromise;
    }

    // Four phases now share the bar: model / names / embeddings / ocr, each a quarter.
    activeLoadingPromise = (async () => {
        try {
            try {
                modelCache = await tf.loadLayersModel('indexeddb://product-matcher-model');
                onProgress({ phase: 'model', progress: 25 });
            } catch (e) {
                onProgress({ phase: 'model', progress: 5 });
                modelCache = await tf.loadLayersModel('/tfjs_model/model.json');
                await modelCache.save('indexeddb://product-matcher-model');
                onProgress({ phase: 'model', progress: 25 });
            }

            onProgress({ phase: 'names', progress: 25 });
            const namesData = await trackDownload('/reference_class_names.json', (pct) => {
                const scaledProgress = 25 + Math.round((pct / 100) * 25);
                onProgress({ phase: 'names', progress: Math.min(scaledProgress, 50) });
            });
            namesCache = namesData.class_names;
            onProgress({ phase: 'names', progress: 50 });

            onProgress({ phase: 'embeddings', progress: 50 });
            const binBuffer = await trackDownload('/reference_embeddings.bin', (pct) => {
                const scaledProgress = 50 + Math.round((pct / 100) * 25);
                onProgress({ phase: 'embeddings', progress: Math.min(scaledProgress, 75) });
            });

            const flatEmbeddings = new Float32Array(binBuffer);
            embeddingsCache = tf.tensor2d(flatEmbeddings, [
                namesData.num_classes,
                namesData.embedding_dim
            ]);
            onProgress({ phase: 'embeddings', progress: 75 });

            // OCR engine download + init — no native progress events from the library,
            // so we just bracket it with a start/end tick on the same bar.
            onProgress({ phase: 'ocr', progress: 80 });
            await initOcrEngine();
            ocrLoaded = true;
            onProgress({ phase: 'ocr', progress: 100 });

            onProgress({ phase: 'ready', progress: 100 });
        } catch (err) {
            activeLoadingPromise = null;
            modelCache = null;
            namesCache = null;
            embeddingsCache = null;
            ocrLoaded = false;
            onProgress({ phase: 'error', progress: 0 });
            throw err;
        }
    })();

    return activeLoadingPromise;
};