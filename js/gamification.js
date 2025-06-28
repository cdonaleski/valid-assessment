import { recognitionQuestions, comparisonQuestions, speedQuestions } from './gamification-questions.js';

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function initGamification() {
    // Only run if the gamification card exists (i.e., on dashboard overview)
    const recognitionEl = document.getElementById('recognitionQuestion');
    const comparisonEl = document.getElementById('comparisonQuestion');
    const speedEl = document.getElementById('speedQuestion');
    if (!recognitionEl || !comparisonEl || !speedEl) return;

    recognitionEl.textContent = pickRandom(recognitionQuestions);
    comparisonEl.textContent = pickRandom(comparisonQuestions);
    speedEl.textContent = pickRandom(speedQuestions);
}

// Optionally, auto-initialize if not using modules
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initGamification();
    });
} 