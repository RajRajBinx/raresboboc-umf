let quizState = {
  mode: 'exerseaza',
  questions: [],
  userAnswers: [],
  isAnswerVerified: [],
  currentQuestionIndex: 0,
  correctCount: 0,
  wrongCount: 0,
  timeLeft: 0,
  timeSpent: 0,
  timerInterval: null,
  timerActive: false,
  shuffleQuestionsSetting: true,
  shuffleOptionsSetting: true
};

function initQuiz(mode) {
  if (typeof quizData === 'undefined') {
    console.error("Datele testului ('quizData') nu au fost gasite.");
    return;
  }
  quizState.mode = mode;
  setupEventListeners();
  startQuiz();
}

function setupEventListeners() {
  DOM.btnVerify.addEventListener('click', () => {
    const currentIdx = quizState.currentQuestionIndex;
    if (!quizState.isAnswerVerified[currentIdx]) {
      verifyAnswer();
    } else {
      goToNextQuestion();
    }
  });

  if (DOM.btnBack) {
    DOM.btnBack.addEventListener('click', (e) => {
      if (DOM.quizContainer.style.display !== 'none') {
        e.preventDefault();
        if (confirm('Sigur vrei să anulezi testul curent și să te întorci?')) {
          window.location.href = 'index.html';
        }
      } else if (DOM.resultsContainer.style.display !== 'none') {
        e.preventDefault();
        window.location.href = 'index.html';
      }
    });
  }

  DOM.btnRestart.addEventListener('click', () => {
    location.reload();
  });

  DOM.btnHome.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
}

function startQuiz() {
  let rawQuestions = [...quizData.questions];
  rawQuestions = shuffleArray(rawQuestions);

  if (quizState.mode === 'exerseaza') {
    quizState.questions = rawQuestions.map((q) => preparePracticeQuestion(q));
    quizState.timerActive = false;
  } else {
    const selected48 = rawQuestions.slice(0, 48);
    const simulationQuestions = selected48.map((q, index) => {
      return { ...q, type: index < 24 ? 'CS' : 'CM' };
    });
    const combinedSim = shuffleArray(simulationQuestions);
    quizState.questions = combinedSim.map((q) => prepareSimulationQuestion(q));
    quizState.timerActive = true;
  }

  quizState.currentQuestionIndex = 0;
  quizState.correctCount = 0;
  quizState.wrongCount = 0;
  quizState.userAnswers = Array(quizState.questions.length).fill(null).map(() => []);
  quizState.isAnswerVerified = Array(quizState.questions.length).fill(false);

  DOM.resultsContainer.style.display = 'none';
  DOM.quizContainer.style.display = 'flex';
  DOM.quizSubjectTitle.textContent = quizData.title;
  DOM.quizSubjectSub.textContent = `Anul ${quizData.year} • Semestrul ${quizData.semester}`;
  if (DOM.quizTimerWrapper) DOM.quizTimerWrapper.style.display = quizState.timerActive ? 'flex' : 'none';

  if (quizState.mode === 'exerseaza') {
    DOM.quizModeBadge.textContent = 'EXERSEAZĂ';
    DOM.quizModeBadge.className = 'quiz-mode-badge mode-exerseaza';
  } else {
    DOM.quizModeBadge.textContent = 'SIMULARE EXAMEN';
    DOM.quizModeBadge.className = 'quiz-mode-badge mode-simulare';
    initTimer();
  }

  renderQuestion();
}

function preparePracticeQuestion(question) {
  let finalIndices = question.options.map((_, i) => i);
  finalIndices = shuffleArray(finalIndices);
  return {
    id: question.id,
    type: 'CM',
    question: question.question,
    options: finalIndices.map(idx => question.options[idx]),
    correct: finalIndices.map((origIdx, newIdx) => question.correct.includes(origIdx) ? newIdx : -1).filter(idx => idx !== -1),
    explanation: question.explanation,
    originalIndices: finalIndices
  };
}

function prepareSimulationQuestion(question) {
  const correctPool = question.correct;
  const incorrectPool = question.options.map((_, i) => i).filter(idx => !correctPool.includes(idx));
  let activeCorrect = [];
  let activeIncorrect = [];

  if (question.type === 'CS') {
    if (correctPool.length > 0) activeCorrect = [correctPool[Math.floor(Math.random() * correctPool.length)]];
    activeIncorrect = shuffleArray([...incorrectPool]).slice(0, 5 - activeCorrect.length);
  } else {
    const N_c = correctPool.length;
    const T = Math.max(2, Math.min(4, Math.floor(Math.random() * 3) + 2)); // 2-4
    activeCorrect = shuffleArray(correctPool).slice(0, Math.min(T, N_c));
    activeIncorrect = shuffleArray([...incorrectPool]).slice(0, 5 - activeCorrect.length);
  }

  const combinedIndices = [...activeCorrect, ...activeIncorrect];
  const finalIndices = shuffleArray(combinedIndices);

  return {
    id: question.id,
    type: question.type,
    question: question.question,
    options: finalIndices.map(idx => question.options[idx]),
    correct: finalIndices.map((origIdx, newIdx) => activeCorrect.includes(origIdx) ? newIdx : -1).filter(idx => idx !== -1),
    explanation: question.explanation,
    originalIndices: finalIndices
  };
}

function initTimer() {
  quizState.timeSpent = 0;
  quizState.timeLeft = 60 * 60;
  if (DOM.quizTimer) DOM.quizTimer.textContent = formatTime(quizState.timeLeft);
  quizState.timerInterval = setInterval(() => {
    quizState.timeLeft--;
    quizState.timeSpent++;
    if (DOM.quizTimer) DOM.quizTimer.textContent = formatTime(quizState.timeLeft);
    if (quizState.timeLeft <= 60 && DOM.quizTimerWrapper) DOM.quizTimerWrapper.classList.add('warning');
    if (quizState.timeLeft <= 0) {
      clearInterval(quizState.timerInterval);
      submitSimulation(true);
    }
  }, 1000);
}

function renderQuestion() {
  const currentIdx = quizState.currentQuestionIndex;
  const question = quizState.questions[currentIdx];
  const userAnswers = quizState.userAnswers[currentIdx];

  DOM.quizProgressFill.style.width = `${(currentIdx / quizState.questions.length) * 100}%`;
  if (quizState.mode === 'simulare') {
    DOM.questionCountText.textContent = `Întrebarea ${currentIdx + 1} din ${quizState.questions.length} (ID: ${question.id})`;
  } else {
    DOM.questionCountText.textContent = `Întrebarea ${currentIdx + 1} din ${quizState.questions.length}`;
  }

  if (quizState.mode === 'exerseaza') {
    DOM.questionTypeBadge.textContent = 'Exersează';
    DOM.questionTypeBadge.className = 'question-type-badge type-exerseaza';
    DOM.questionHint.textContent = 'Alege răspunsurile corecte (sunt exact 5 răspunsuri corecte).';
  } else {
    DOM.questionTypeBadge.textContent = question.type === 'CS' ? 'Complement Simplu' : 'Complement Multiplu';
    DOM.questionTypeBadge.className = `question-type-badge ${question.type === 'CS' ? 'type-cs' : 'type-cm'}`;
    DOM.questionHint.textContent = question.type === 'CS' ? 'Alege un singur răspuns corect (CS).' : 'Alege 2-4 răspunsuri corecte (CM).';
  }

  DOM.questionText.textContent = question.question;
  if (DOM.explanationPanel) DOM.explanationPanel.style.display = 'none';
  DOM.optionsList.innerHTML = '';

  const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  question.options.forEach((optionText, idx) => {
    const li = document.createElement('div');
    li.className = 'option-item';
    
    const isSelected = userAnswers.includes(idx);
    if (isSelected) li.classList.add('selected');
    
    if (quizState.isAnswerVerified[currentIdx]) {
        const isCorrect = question.correct.includes(idx);
        if (isSelected && isCorrect) li.classList.add('correct');
        else if (isSelected && !isCorrect) li.classList.add('incorrect');
        else if (!isSelected && isCorrect) li.classList.add('missed-correct');
        li.classList.remove('selected');
    }
    
    li.innerHTML = `<div class="option-letter">${alphabet[idx]}</div><div class="option-text">${optionText}</div>`;
    
    if (!quizState.isAnswerVerified[currentIdx]) {
        li.onclick = () => handleOptionClick(idx);
    }
    DOM.optionsList.appendChild(li);
  });

  updateVerifyButton();
}

function handleOptionClick(idx) {
  const currentIdx = quizState.currentQuestionIndex;
  const question = quizState.questions[currentIdx];
  let answers = quizState.userAnswers[currentIdx];

  if (question.type === 'CS') {
    if (answers.includes(idx)) {
      quizState.userAnswers[currentIdx] = [];
    } else {
      quizState.userAnswers[currentIdx] = [idx];
    }
  } else {
    const found = answers.indexOf(idx);
    if (found > -1) answers.splice(found, 1);
    else answers.push(idx);
  }
  renderQuestion();
}

function updateVerifyButton() {
  const currentIdx = quizState.currentQuestionIndex;
  const isVerified = quizState.isAnswerVerified[currentIdx];
  const isLast = currentIdx === quizState.questions.length - 1;

  DOM.btnVerify.textContent = isVerified ? (isLast ? (quizState.mode === 'exerseaza' ? 'Vezi Rezultat' : 'Finalizează Testul') : 'Următoarea Întrebare') : 'Verifică Răspuns';
  DOM.btnVerify.disabled = quizState.userAnswers[currentIdx].length === 0;
}

function verifyAnswer() {
  const currentIdx = quizState.currentQuestionIndex;
  quizState.isAnswerVerified[currentIdx] = true;
  const q = quizState.questions[currentIdx];
  const ua = quizState.userAnswers[currentIdx];
  const isCorrect = ua.length === q.correct.length && ua.every(v => q.correct.includes(v));
  if (isCorrect) quizState.correctCount++; else quizState.wrongCount++;
  renderQuestion();
  if (q.explanation && DOM.explanationPanel && DOM.explanationText) {
    DOM.explanationText.textContent = q.explanation;
    DOM.explanationPanel.style.display = 'block';
  }
}

function goToNextQuestion() {
  if (quizState.mode === 'simulare' && quizState.currentQuestionIndex === quizState.questions.length - 1) {
    submitSimulation();
    return;
  }
  if (quizState.mode === 'exerseaza' && quizState.currentQuestionIndex === quizState.questions.length - 1 && quizState.isAnswerVerified[quizState.currentQuestionIndex]) {
    showResults();
    return;
  }
  quizState.currentQuestionIndex++;
  renderQuestion();
}

function submitSimulation(isTimeout = false) {
  clearInterval(quizState.timerInterval);
  quizState.correctCount = 0;
  quizState.questions.forEach((q, i) => {
    const ua = quizState.userAnswers[i];
    const isCorrect = ua.length === q.correct.length && ua.every(v => q.correct.includes(v));
    if (isCorrect) quizState.correctCount++;
  });
  showResults(isTimeout);
}

function showResults(isTimeout = false) {
  DOM.quizContainer.style.display = 'none';
  DOM.resultsContainer.style.display = 'flex';
  DOM.resultsMainTitle.textContent = isTimeout ? 'Timp Expirat!' : 'Test Finalizat!';
  DOM.resTimeSpent.textContent = formatTime(quizState.timeSpent);
  renderReviewPanel();
}

function renderReviewPanel() {
  DOM.reviewQuestionsList.innerHTML = '';
  const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  quizState.questions.forEach((q, i) => {
    const ua = quizState.userAnswers[i];
    const isCorrect = ua.length === q.correct.length && ua.every(v => q.correct.includes(v));
    
    const card = document.createElement('div');
    card.className = 'review-q-card';
    
    const header = document.createElement('div');
    header.className = 'review-q-header';
    header.innerHTML = `
      <div class="review-q-title">${i + 1}. ${quizState.mode === 'simulare' ? `(ID: ${q.id}) ` : ''}${q.question}</div>
      <div class="review-q-badge ${isCorrect ? 'correct' : 'incorrect'}">${isCorrect ? 'Corect' : 'Greșit'}</div>
    `;
    card.appendChild(header);

    const optionsWrapper = document.createElement('div');
    optionsWrapper.className = 'review-options';

    q.options.forEach((optText, optIdx) => {
      const isSelected = ua.includes(optIdx);
      const isIndeedCorrect = q.correct.includes(optIdx);
      const optionDiv = document.createElement('div');
      optionDiv.className = 'review-option-item';

      if (isSelected && isIndeedCorrect) optionDiv.classList.add('user-correct');
      else if (isSelected && !isIndeedCorrect) optionDiv.classList.add('user-incorrect');
      else if (!isSelected && isIndeedCorrect) optionDiv.classList.add('missed-correct');

      optionDiv.innerHTML = `
        <div class="review-option-letter">${alphabet[optIdx]}</div>
        <div class="review-option-text">${optText}</div>
      `;
      optionsWrapper.appendChild(optionDiv);
    });
    card.appendChild(optionsWrapper);

    if (q.explanation) {
      const expDiv = document.createElement('div');
      expDiv.className = 'review-explanation';
      expDiv.innerHTML = `<strong>Explicație:</strong> ${q.explanation}`;
      card.appendChild(expDiv);
    }

    DOM.reviewQuestionsList.appendChild(card);
  });
}
