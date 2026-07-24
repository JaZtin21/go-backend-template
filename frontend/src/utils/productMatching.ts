// ~/utils/productMatching.ts

export interface VisualMatch {
    name: string;
    distance: number;
}

const MATCH_DEBUG_LOGGING = true;

const UNIT_REGEX = /(\d+(?:\.\d+)?)\s*(kg|g|ml|l|oz|pcs?|pk|pack|bx|bags?)\b/i;

export const extractUnitOfMeasure = (text: string): string => {
    const match = text.match(UNIT_REGEX);
    if (!match) return '';
    return `${match[1]}${match[2].toLowerCase()}`;
};

export const stripUnitOfMeasure = (text: string): string => {
    return text
        .replace(UNIT_REGEX, '')
        .replace(/\s+/g, ' ')
        .replace(/[-,]\s*$/, '')
        .trim();
};

// ---------- letter-run (Ratcliff/Obershelp style) similarity ----------

const normalizeConcat = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');


/** Finds the longest common substring between a and b. Returns its length + start indices. */
const longestCommonSubstring = (a: string, b: string) => {
    let best = { length: 0, aStart: 0, bStart: 0 };
    const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            if (a[i - 1] === b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
                if (dp[i][j] > best.length) {
                    best = { length: dp[i][j], aStart: i - dp[i][j], bStart: j - dp[i][j] };
                }
            }
        }
    }
    return best;
};

/**
 * Recursively sums up every matching run of letters between a and b (in order),
 * ignoring runs below MIN_RUN_LENGTH. This is what lets OCR text like
 * "SWEA ! BWCARIK HYRATIO D" still credit "Pocari Sweat Hydration" —
 * word boundaries don't matter, only consecutive letter runs do.
 */
const MIN_RUN_LENGTH = 3;
const STRONG_RUN_LENGTH = 5; // an exact contiguous match this long is very unlikely to be coincidence

/**
 * Same recursive run-finder as before, but now also tracks the single longest run found,
 * since one long exact match is much stronger evidence than several short ones adding
 * up to the same total.
 */
const findMatchingRuns = (a: string, b: string): { totalMatched: number; longestRun: number } => {
    if (a.length === 0 || b.length === 0) return { totalMatched: 0, longestRun: 0 };

    const lcs = longestCommonSubstring(a, b);
    if (lcs.length < MIN_RUN_LENGTH) return { totalMatched: 0, longestRun: 0 };

    const leftA = a.substring(0, lcs.aStart);
    const leftB = b.substring(0, lcs.bStart);
    const rightA = a.substring(lcs.aStart + lcs.length);
    const rightB = b.substring(lcs.bStart + lcs.length);

    const left = findMatchingRuns(leftA, leftB);
    const right = findMatchingRuns(rightA, rightB);

    return {
        totalMatched: lcs.length + left.totalMatched + right.totalMatched,
        longestRun: Math.max(lcs.length, left.longestRun, right.longestRun),
    };
};

const scoreCandidateAgainstOcr = (candidateName: string, ocrText: string): number => {
    const candidate = normalizeConcat(candidateName);
    const ocr = normalizeConcat(ocrText);
    if (!candidate || !ocr) return 0;

    const { totalMatched, longestRun } = findMatchingRuns(candidate, ocr);

    // Base ratio, same as before
    const ratioScore = totalMatched / candidate.length;

    // A single long exact run is strong standalone evidence — e.g. "drink" (5 letters)
    // matching exactly is very unlikely by chance, even if the rest of the name got garbled.
    // Scale the bonus by how much longer than STRONG_RUN_LENGTH the run is, so "drink" (5)
    // gives a solid boost and something like "chocolate" (9) gives an even bigger one.
    const strongRunBonus = longestRun >= STRONG_RUN_LENGTH
        ? 0.15 + (longestRun - STRONG_RUN_LENGTH) * 0.05
        : 0;

    return Math.min(1, ratioScore + strongRunBonus);
};

// ---------- candidate selection ----------

const MATCH_THRESHOLD = 0.25; // tune against real captures

export const pickBestCandidate = (
    candidates: VisualMatch[],
    ocrText: string
): { name: string; score: number } | null => {
    if (!ocrText.trim() || candidates.length === 0) return null;

    let best = { name: '', score: 0 };
    const allScores: { name: string; score: number }[] = [];

    for (const c of candidates) {
        const score = scoreCandidateAgainstOcr(c.name, ocrText);
        allScores.push({ name: c.name, score });
        if (score > best.score) best = { name: c.name, score };
    }

    if (MATCH_DEBUG_LOGGING) {
        console.log('%c[Match] Candidate letter-run scores:', 'color: #a855f7; font-weight: bold');
        console.table(allScores.map(s => ({ name: s.name, score: s.score.toFixed(3) })));
    }

    return best.score >= MATCH_THRESHOLD ? best : null;
};

/**
 * Resolves final product name + unit of measure.
 * NOTE: raw OCR text is never used as the final name anymore — only two outcomes:
 *   1. OCR text confirms one of the visual model's candidates (letter-run match) → use it
 *   2. Otherwise → always use the visual model's #1 guess (including when OCR found nothing at all)
 */
export const resolveProductIdentity = (
    candidates: VisualMatch[],
    ocrText: string
): { name: string; unitOfMeasure: string } => {
    const best = pickBestCandidate(candidates, ocrText);

    let chosenName: string;
    let source: string;

    if (best) {
        chosenName = best.name;
        source = `OCR letter-run match (score ${best.score.toFixed(2)})`;
    } else if (ocrText.trim()) {
        chosenName = ocrText;
        source = 'raw OCR text (no candidate matched — likely untrained product)';
    } else {
        chosenName = candidates[0]?.name ?? 'Captured Item';
        source = 'visual model fallback (OCR found no text at all)';
    }

    if (MATCH_DEBUG_LOGGING) {
        console.log(`%c[Match] Chosen: "${chosenName}" via ${source}`, 'color: #a855f7; font-weight: bold');
    }

    const unitOfMeasure = extractUnitOfMeasure(ocrText) || extractUnitOfMeasure(chosenName);
    const finalName = stripUnitOfMeasure(chosenName);

    return { name: finalName, unitOfMeasure };
};