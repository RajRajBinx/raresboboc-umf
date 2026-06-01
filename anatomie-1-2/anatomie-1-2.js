// Logica pentru pagina de testare (Exerseaza si Simulare)
let quizState = {
  mode: 'exerseaza',          // 'exerseaza' sau 'simulare'
  questions: [],              // intrebarile preparate active pentru testul curent
  userAnswers: [],            // stocheaza indicii selectati de utilizator pentru fiecare intrebare: [[indices], [indices], ...]
  isAnswerVerified: [],       // (Doar Exerseaza) stocheaza daca raspunsul a fost verificat: [true, false, ...]
  currentQuestionIndex: 0,
  correctCount: 0,
  wrongCount: 0,
  timeLeft: 0,                // in secunde (pentru numărătoare inversă)
  timeSpent: 0,               // in secunde (timp total scurs)
  timerInterval: null,
  timerActive: false,
  questionCountSetting: '24', // '5', '10', '24', 'all'
  shuffleQuestionsSetting: true,
  shuffleOptionsSetting: true
};

// Selectori DOM
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

// Initializare la incarcarea paginii
document.addEventListener('DOMContentLoaded', () => {
  if (typeof quizData === 'undefined') {
    console.error("Datele testului ('quizData') nu au fost gasite.");
    return;
  }
  setupTheme();
  
  // Citim parametrul de mod din URL
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  if (mode === 'exerseaza' || mode === 'simulare') {
    quizState.mode = mode;
    setupEventListeners();
    startQuiz();
  } else {
    // Redirectionam spre selectie mod daca parametrul lipseste sau este invalid
    window.location.href = 'select-mode.html';
  }
});

// Setup theme onload si click listener
function setupTheme() {
  const savedTheme = localStorage.getItem('umf-theme');
  let theme = savedTheme;
  
  if (!theme) {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  setTheme(theme);

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
    });
  }
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('umf-theme', theme);
}

// Configurare actiuni butoane
function setupEventListeners() {

  // Verificare raspuns (Exerseaza)
  DOM.btnVerify.addEventListener('click', () => {
    const currentIdx = quizState.currentQuestionIndex;
    if (!quizState.isAnswerVerified[currentIdx]) {
      verifyAnswer();
    } else {
      goToNextQuestion();
    }
  });

  // Iesire din pagina / intoarcere la selectia modului
  if (DOM.btnBack) {
    DOM.btnBack.addEventListener('click', (e) => {
      // Daca suntem in timpul testului (quiz-ul este vizibil)
      if (DOM.quizContainer.style.display !== 'none') {
        e.preventDefault(); // oprim navigarea spre index.html
        if (confirm('Sigur vrei să anulezi testul curent și să te întorci la meniul de selecție?')) {
          resetToSetup();
        }
      }
      // Daca suntem pe ecranul de rezultate
      else if (DOM.resultsContainer.style.display !== 'none') {
        e.preventDefault(); // oprim navigarea spre index.html
        resetToSetup();
      }
      // Daca suntem deja pe ecranul de setup, lasam sa navigheze spre index.html normal
    });
  }

  // Reincepe testul
  DOM.btnRestart.addEventListener('click', () => {
    resetToSetup();
  });

  // Inapoi la lista
  DOM.btnHome.addEventListener('click', () => {
    window.location.href = 'select-mode.html';
  });
}

// Helpers pentru shuffle
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Pregatirea intrebarilor in functie de modul ales si setari
function startQuiz() {
  // Activăm întotdeauna randomizarea întrebărilor și opțiunilor prin design
  quizState.shuffleQuestionsSetting = true;
  quizState.shuffleOptionsSetting = true;

  let rawQuestions = [...quizData.questions];
  
  // Întotdeauna amestecăm ordinea întrebărilor primite
  rawQuestions = shuffleArray(rawQuestions);

  if (quizState.mode === 'exerseaza') {
    // Exersează: Toate întrebările disponibile (275) cu toate cele 10 variante
    quizState.questions = rawQuestions.map((q) => preparePracticeQuestion(q));
    quizState.timerActive = false;
  } else {
    // Simulare: Exact 48 de întrebări (24 CM și 24 CS)
    // Luăm primele 48 de întrebări (deja amestecate anterior)
    const selected48 = rawQuestions.slice(0, 48);

    // Atribuim tipurile aleatoriu: 24 CS și 24 CM
    // Deoarece selected48 este deja amestecat, putem pur și simplu să dăm tipul CS primelor 24 și CM următoarelor 24
    const simulationQuestions = selected48.map((q, index) => {
      return {
        ...q,
        type: index < 24 ? 'CS' : 'CM'
      };
    });

    // Re-amestecăm pentru a nu avea toate CS urmate de toate CM
    const combinedSim = shuffleArray(simulationQuestions);

    quizState.questions = combinedSim.map((q) => prepareSimulationQuestion(q));
    quizState.timerActive = true;
  }

  // Initializare stare test
  quizState.currentQuestionIndex = 0;
  quizState.correctCount = 0;
  quizState.wrongCount = 0;
  quizState.userAnswers = Array(quizState.questions.length).fill(null).map(() => []);
  quizState.isAnswerVerified = Array(quizState.questions.length).fill(false);

  // Configurări vizuale
  DOM.resultsContainer.style.display = 'none';
  DOM.quizContainer.style.display = 'flex';

  DOM.quizSubjectTitle.textContent = quizData.title;
  DOM.quizSubjectSub.textContent = `Anul ${quizData.year} • Semestrul ${quizData.semester}`;

  DOM.quizTimerWrapper.style.display = quizState.mode === 'simulare' ? 'flex' : 'none';
  DOM.btnVerify.style.display = 'flex';

  if (quizState.mode === 'exerseaza') {
    DOM.quizContainer.classList.remove('simulare-mode');
    DOM.quizModeBadge.textContent = 'EXERSEAZĂ';
    DOM.quizModeBadge.style.backgroundColor = 'var(--tag-blue-bg)';
    DOM.quizModeBadge.style.color = 'var(--tag-blue-text)';
    DOM.quizModeBadge.style.borderColor = 'var(--tag-blue-border)';
  } else {
    DOM.quizContainer.classList.add('simulare-mode');
    DOM.quizModeBadge.textContent = 'SIMULARE EXAMEN';
    DOM.quizModeBadge.style.backgroundColor = 'var(--tag-purple-bg)';
    DOM.quizModeBadge.style.color = 'var(--tag-purple-text)';
    DOM.quizModeBadge.style.borderColor = 'var(--tag-purple-border)';
    
    // Start timer
    initTimer();
  }

  renderQuestion();
}

// Preparare intrebare pentru modul Exerseaza (toate cele 10 variante afisate)
function preparePracticeQuestion(question) {
  const correctPool = question.correct;

  // Generăm lista finală de 10 opțiuni, eventual amestecate
  let finalIndices = question.options.map((_, i) => i);
  if (quizState.shuffleOptionsSetting) {
    finalIndices = shuffleArray(finalIndices);
  }

  const displayOptions = finalIndices.map(idx => question.options[idx]);
  const displayCorrect = finalIndices
    .map((origIdx, newIdx) => correctPool.includes(origIdx) ? newIdx : -1)
    .filter(idx => idx !== -1);

  return {
    id: question.id,
    type: 'CM', // Comportament de selectie multipla pentru Exerseaza
    question: question.question,
    options: displayOptions,
    correct: displayCorrect,
    explanation: question.explanation,
    originalIndices: finalIndices
  };
}

// Algoritmul critic de filtrare: alege exact 5 variante din 10 conform tipului CS/CM
function prepareSimulationQuestion(question) {
  const correctPool = question.correct;
  const incorrectPool = question.options.map((_, i) => i).filter(idx => !correctPool.includes(idx));

  let activeCorrect = [];
  let activeIncorrect = [];

  if (question.type === 'CS') {
    // CS: Exact 1 răspuns corect, 4 greșite
    if (correctPool.length > 0) {
      activeCorrect = [correctPool[Math.floor(Math.random() * correctPool.length)]];
    }
    // Celelalte corecte devin potențial greșite
    const remainingCorrect = correctPool.filter(idx => !activeCorrect.includes(idx));
    const tempIncorrectPool = [...incorrectPool, ...remainingCorrect];
    // Asigurăm exact 5 variante în total
    activeIncorrect = shuffleArray(tempIncorrectPool).slice(0, 5 - activeCorrect.length);
  } else {
    // CM: 2-4 răspunsuri corecte
    const N_c = correctPool.length;
    const minC = Math.min(2, N_c);
    const maxC = Math.min(4, N_c);
    const T = minC === maxC ? minC : Math.floor(Math.random() * (maxC - minC + 1)) + minC;

    if (N_c > 0) {
      activeCorrect = shuffleArray(correctPool).slice(0, T);
    }
    
    // Celelalte corecte devin potențial greșite
    const remainingCorrect = correctPool.filter(idx => !activeCorrect.includes(idx));
    const tempIncorrectPool = [...incorrectPool, ...remainingCorrect];
    // Asigurăm exact 5 variante în total
    activeIncorrect = shuffleArray(tempIncorrectPool).slice(0, 5 - activeCorrect.length);
  }

  // Combină și amestecă cele 5 variante alese
  const combinedIndices = [...activeCorrect, ...activeIncorrect];
  const finalIndices = shuffleArray(combinedIndices);

  const displayOptions = finalIndices.map(idx => question.options[idx]);
  const displayCorrect = finalIndices
    .map((origIdx, newIdx) => activeCorrect.includes(origIdx) ? newIdx : -1)
    .filter(idx => idx !== -1);

  return {
    id: question.id,
    type: question.type,
    question: question.question,
    options: displayOptions,
    correct: displayCorrect,
    explanation: question.explanation,
    originalIndices: finalIndices
  };
}



// Începe și gestionează cronometrul
function initTimer() {
  if (quizState.timerInterval) {
    clearInterval(quizState.timerInterval);
  }

  quizState.timeSpent = 0;

  if (quizState.timerActive) {
    DOM.quizTimerWrapper.style.display = 'flex';
    DOM.quizTimerWrapper.classList.remove('warning');
    quizState.timeLeft = 48 * 60; // 48 de minute standard (1 minut per întrebare)
    DOM.quizTimer.textContent = formatTime(quizState.timeLeft);

    quizState.timerInterval = setInterval(() => {
      quizState.timeLeft--;
      quizState.timeSpent++;
      
      DOM.quizTimer.textContent = formatTime(quizState.timeLeft);

      // Alertă roșie sub 1 minut
      if (quizState.timeLeft <= 60) {
        DOM.quizTimerWrapper.classList.add('warning');
      }

      if (quizState.timeLeft <= 0) {
        clearInterval(quizState.timerInterval);
        alert('Timpul a expirat! Testul tău va fi trimis automat.');
        submitSimulation(true); // trimitere automată
      }
    }, 1000); // 1000ms pentru o secundă reală
  } else {
    // Fără cronometru vizibil dar înregistrăm timpul scurs
    DOM.quizTimerWrapper.style.display = 'none';
    quizState.timerInterval = setInterval(() => {
      quizState.timeSpent++;
    }, 1000);
  }
}

// Formatare secunde în MM:SS
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}


// Randare intrebare curenta
function renderQuestion() {
  const currentIdx = quizState.currentQuestionIndex;
  const question = quizState.questions[currentIdx];
  const userAnswers = quizState.userAnswers[currentIdx];

  // Actualizare progress bar
  const progressPercent = (currentIdx / quizState.questions.length) * 100;
  DOM.quizProgressFill.style.width = `${progressPercent}%`;

  // Text numaratoare
  DOM.questionCountText.textContent = `Întrebarea ${currentIdx + 1} din ${quizState.questions.length}`;

  // Tip intrebare si indicii
  if (quizState.mode === 'exerseaza') {
    DOM.questionTypeBadge.textContent = 'Exersează';
    DOM.questionTypeBadge.className = 'question-type-badge type-exerseaza';
    DOM.questionHint.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path>
      </svg> Alege răspunsurile corecte (sunt exact 5 răspunsuri corecte).
    `;
  } else if (question.type === 'CS') {
    DOM.questionTypeBadge.textContent = 'Complement Simplu';
    DOM.questionTypeBadge.className = 'question-type-badge type-cs';
    DOM.questionHint.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path>
      </svg> Alege un singur răspuns corect (CS).
    `;
  } else {
    DOM.questionTypeBadge.textContent = 'Complement Multiplu';
    DOM.questionTypeBadge.className = 'question-type-badge type-cm';
    const minC = quizState.mode === 'simulare' ? Math.min(2, question.correct.length) : 2;
    const maxC = quizState.mode === 'simulare' ? Math.min(4, question.correct.length) : 4;
    DOM.questionHint.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path>
      </svg> Alege 2-4 răspunsuri corecte (CM).
    `;
  }

  DOM.questionText.textContent = question.question;
  DOM.explanationPanel.style.display = 'none';

  // Variante
  DOM.optionsList.innerHTML = '';
  const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  question.options.forEach((optionText, idx) => {
    const optionLi = document.createElement('div');
    optionLi.className = 'option-item';
    optionLi.setAttribute('data-index', idx);

    // Stari vizuale in functie de mod si daca a fost verificat
    const isSelected = userAnswers.includes(idx);
    
    if (quizState.mode === 'exerseaza' && quizState.isAnswerVerified[currentIdx]) {
      // Exerseaza & Verificat -> aratam direct culorile de corectie
      const isCorrect = question.correct.includes(idx);
      if (isSelected && isCorrect) {
        optionLi.classList.add('correct');
      } else if (isSelected && !isCorrect) {
        optionLi.classList.add('incorrect');
      } else if (!isSelected && isCorrect) {
        optionLi.classList.add('missed-correct');
      }
    } else {
      // Normal / Selectat
      if (isSelected) {
        optionLi.classList.add('selected');
      }
    }

    optionLi.innerHTML = `
      <div class="option-letter">${alphabet[idx]}</div>
      <div class="option-text">${optionText}</div>
    `;

    // Click doar daca nu e verificat
    const canClick = !quizState.isAnswerVerified[currentIdx];
    if (canClick) {
      optionLi.addEventListener('click', () => handleOptionClick(idx));
    }

    DOM.optionsList.appendChild(optionLi);
  });

  // Setare butoane (valabil pentru ambele moduri)
  const isVerified = quizState.isAnswerVerified[currentIdx];
  if (isVerified) {
    if (question.explanation) {
      DOM.explanationText.textContent = question.explanation;
      DOM.explanationPanel.style.display = 'block';
    }
    DOM.btnVerify.textContent = currentIdx === quizState.questions.length - 1 ? 'Vezi Rezultat' : 'Următoarea Întrebare';
    DOM.btnVerify.disabled = false;
  } else {
    DOM.btnVerify.textContent = 'Verifică Răspuns';
    DOM.btnVerify.disabled = userAnswers.length === 0;
  }
}

// Click pe o varianta
function handleOptionClick(idx) {
  const currentIdx = quizState.currentQuestionIndex;
  const question = quizState.questions[currentIdx];
  let userAnswers = quizState.userAnswers[currentIdx];

  if (question.type === 'CS') {
    // CS - Alege un singur raspuns
    if (userAnswers.includes(idx)) {
      quizState.userAnswers[currentIdx] = [];
    } else {
      quizState.userAnswers[currentIdx] = [idx];
    }
  } else {
    // CM - Alege multiplu (toggles)
    const foundIdx = userAnswers.indexOf(idx);
    if (foundIdx > -1) {
      userAnswers.splice(foundIdx, 1);
    } else {
      userAnswers.push(idx);
    }
    quizState.userAnswers[currentIdx] = userAnswers;
  }

  // Actualizare clase fara re-randare completa pentru fluiditate
  const optionElements = DOM.optionsList.querySelectorAll('.option-item');
  optionElements.forEach(opt => {
    const optIdx = parseInt(opt.getAttribute('data-index'));
    const isSelected = quizState.userAnswers[currentIdx].includes(optIdx);
    opt.classList.toggle('selected', isSelected);
  });

  // Update stare buton
  DOM.btnVerify.disabled = quizState.userAnswers[currentIdx].length === 0;
}

// Verifica raspunsul curent (Exerseaza)
function verifyAnswer() {
  const currentIdx = quizState.currentQuestionIndex;
  const question = quizState.questions[currentIdx];
  const userAnswers = quizState.userAnswers[currentIdx];
  const correctAnswers = question.correct;

  quizState.isAnswerVerified[currentIdx] = true;

  // Verificam daca este corect 100% (coincidenta exacta a indicilor selectati cu cei corecti)
  const isCorrect = userAnswers.length === correctAnswers.length &&
                    userAnswers.every(val => correctAnswers.includes(val));

  if (isCorrect) {
    quizState.correctCount++;
  } else {
    quizState.wrongCount++;
  }

  // Aplicam stiluri de corectie pe optiunile curente
  const optionElements = DOM.optionsList.querySelectorAll('.option-item');
  optionElements.forEach(opt => {
    const idx = parseInt(opt.getAttribute('data-index'));
    const isSelected = userAnswers.includes(idx);
    const isIndeedCorrect = correctAnswers.includes(idx);

    opt.classList.remove('selected');

    if (isSelected && isIndeedCorrect) {
      opt.classList.add('correct');
    } else if (isSelected && !isIndeedCorrect) {
      opt.classList.add('incorrect');
    } else if (!isSelected && isIndeedCorrect) {
      opt.classList.add('missed-correct');
    }
    
    // Eliminam event listener-ul stergand clona sau pur si simplu oprind interactiunea in handleOptionClick
  });

  // Afisare explicatie
  if (question.explanation) {
    DOM.explanationText.textContent = question.explanation;
    DOM.explanationPanel.style.display = 'block';
  }

  // Schimbare text buton in footer
  const isLast = currentIdx === quizState.questions.length - 1;
  DOM.btnVerify.textContent = isLast ? 'Vezi Rezultat' : 'Următoarea Întrebare';
  DOM.btnVerify.disabled = false;
}

// Trecere la urmatoarea intrebare (Exerseaza)
function goToNextQuestion() {
  const currentIdx = quizState.currentQuestionIndex;
  const isLast = currentIdx === quizState.questions.length - 1;

  if (isLast) {
    showResults();
  } else {
    quizState.currentQuestionIndex++;
    renderQuestion();
  }
}

// Trimitere test Simulare (apelată în caz de expirare timp)
function submitSimulation(isTimeout = false) {
  if (quizState.timerInterval) {
    clearInterval(quizState.timerInterval);
  }

  // Calculam rezultatele finale și marcăm totul ca verificat
  quizState.correctCount = 0;
  quizState.wrongCount = 0;

  quizState.questions.forEach((q, idx) => {
    quizState.isAnswerVerified[idx] = true;
    const userAnswers = quizState.userAnswers[idx];
    const correctAnswers = q.correct;
    
    const isCorrect = userAnswers.length === correctAnswers.length &&
                      userAnswers.every(val => correctAnswers.includes(val));

    if (isCorrect) {
      quizState.correctCount++;
    } else {
      quizState.wrongCount++;
    }
  });

  showResults(isTimeout);
}

// Afisare rezultate finale
function showResults(isTimeout = false) {
  const totalQ = quizState.questions.length;
  const correctQ = quizState.correctCount;
  const percentage = Math.round((correctQ / totalQ) * 100);

  DOM.quizContainer.style.display = 'none';
  DOM.resultsContainer.style.display = 'flex';
  
  if (DOM.resultsSubjectTitle) {
    DOM.resultsSubjectTitle.textContent = `${quizData.title} - Mod ${quizState.mode === 'exerseaza' ? 'Exersează' : 'Simulare'}`;
  }

  // Actualizare în statistici localStorage (internă)
  updateHighScore(percentage);

  // Setare titlu principal în funcție de timeout
  if (DOM.resultsMainTitle) {
    DOM.resultsMainTitle.textContent = isTimeout ? 'Timp Expirat!' : 'Test Finalizat!';
  }

  // Afișare timp total utilizat
  if (DOM.statTimeSpentWrapper) {
    DOM.statTimeSpentWrapper.style.display = 'block';
  }
  if (DOM.resTimeSpent) {
    DOM.resTimeSpent.textContent = formatTime(quizState.timeSpent);
  }

  // Randare Recenzare Detaliată Întrebări
  renderReviewPanel();
}

// Salvare statistici in LocalStorage
function updateHighScore(percentage) {
  let stats = {
    testsCompleted: 0,
    correctQuestions: 0,
    totalQuestionsAnswered: 0,
    highScores: {}
  };

  const savedStats = localStorage.getItem('umf-stats');
  if (savedStats) {
    try {
      stats = JSON.parse(savedStats);
    } catch (e) {}
  }

  stats.testsCompleted++;
  stats.correctQuestions += quizState.correctCount;
  stats.totalQuestionsAnswered += quizState.questions.length;

  const currentHighScore = stats.highScores[quizData.id] || 0;
  if (percentage > currentHighScore) {
    stats.highScores[quizData.id] = percentage;
  }

  localStorage.setItem('umf-stats', JSON.stringify(stats));
}

// Ecranul de recenzare detaliata a intrebarilor la finalul testului (Simulare sau Exerseaza)
function renderReviewPanel() {
  DOM.reviewQuestionsList.innerHTML = '';
  const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  quizState.questions.forEach((q, qIdx) => {
    const userAnswers = quizState.userAnswers[qIdx];
    const correctAnswers = q.correct;

    const isCorrect = userAnswers.length === correctAnswers.length &&
                      userAnswers.every(val => correctAnswers.includes(val));

    const card = document.createElement('div');
    card.className = 'review-q-card';

    // Badge status intrebare
    let badgeText = 'Necompletat';
    let badgeClass = 'unanswered';
    if (userAnswers.length > 0) {
      badgeText = isCorrect ? 'Corect' : 'Greșit';
      badgeClass = isCorrect ? 'correct' : 'incorrect';
    }

    // Header intrebare
    const header = document.createElement('div');
    header.className = 'review-q-header';
    header.innerHTML = `
      <div class="review-q-title">${qIdx + 1}. ${q.question}</div>
      <div class="review-q-badge ${badgeClass}">${badgeText}</div>
    `;
    card.appendChild(header);

    // Lista de optiuni cu corecturile aplicate
    const optionsWrapper = document.createElement('div');
    optionsWrapper.className = 'review-options';

    q.options.forEach((optText, optIdx) => {
      const isSelected = userAnswers.includes(optIdx);
      const isIndeedCorrect = correctAnswers.includes(optIdx);

      const optionDiv = document.createElement('div');
      optionDiv.className = 'review-option-item';

      if (isSelected && isIndeedCorrect) {
        optionDiv.classList.add('user-correct');
      } else if (isSelected && !isIndeedCorrect) {
        optionDiv.classList.add('user-incorrect');
      } else if (!isSelected && isIndeedCorrect) {
        optionDiv.classList.add('missed-correct');
      }

      optionDiv.innerHTML = `
        <div class="review-option-letter">${alphabet[optIdx]}</div>
        <div class="review-option-text">${optText}</div>
      `;
      optionsWrapper.appendChild(optionDiv);
    });
    card.appendChild(optionsWrapper);

    // Explicație
    if (q.explanation) {
      const expDiv = document.createElement('div');
      expDiv.className = 'review-explanation';
      expDiv.innerHTML = `<strong>Explicație:</strong> ${q.explanation}`;
      card.appendChild(expDiv);
    }

    DOM.reviewQuestionsList.appendChild(card);
  });
}

// Resetare si intoarcere la Setup
function resetToSetup() {
  if (quizState.timerInterval) {
    clearInterval(quizState.timerInterval);
  }
  window.location.href = 'select-mode.html';
}


