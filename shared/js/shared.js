const DOM = {
  // Ecrane principale
  quizContainer: document.getElementById('quiz-container'),
  resultsContainer: document.getElementById('results-container'),

  // Interfata Quiz - Header & Meta
  quizSubjectTitle: document.getElementById('quiz-subject-title'),
  quizSubjectSub: document.getElementById('quiz-subject-sub'),
  quizModeBadge: document.getElementById('quiz-mode-badge'),
  quizTimerWrapper: document.getElementById('quiz-timer-wrapper'),
  quizTimer: document.getElementById('quiz-timer'),
  quizProgressFill: document.getElementById('quiz-progress-fill'),

  // Interfata Quiz - Corp intrebare
  questionCountText: document.getElementById('question-count-text'),
  questionTypeBadge: document.getElementById('question-type-badge'),
  questionText: document.getElementById('question-text'),
  questionHint: document.getElementById('question-hint'),
  optionsList: document.getElementById('options-list'),
  explanationPanel: document.getElementById('explanation-panel'),
  explanationText: document.getElementById('explanation-text'),

  // Interfata Quiz - Footer si actiuni
  btnVerify: document.getElementById('btn-verify'),
  btnBack: document.getElementById('nav-back'),

  // Rezultate
  resultsMainTitle: document.getElementById('results-main-title'),
  resultsSubjectTitle: document.getElementById('results-subject-title'),
  statTimeSpentWrapper: document.getElementById('stat-time-spent-wrapper'),
  resTimeSpent: document.getElementById('res-time-spent'),
  btnRestart: document.getElementById('btn-restart'),
  btnHome: document.getElementById('btn-home'),

  // Recenzare detaliata
  reviewPanel: document.getElementById('review-panel'),
  reviewQuestionsList: document.getElementById('review-questions-list')
};

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
