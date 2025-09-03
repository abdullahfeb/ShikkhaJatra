// Quiz functionality
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let quizTimer = null;
let timeRemaining = 0;
let socket = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    initializeSocket();
    loadAvailableQuizzes();
});

function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    
    fetchUserProfile();
}

async function fetchUserProfile() {
    try {
        const response = await fetch('/api/users/profile', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            const user = await response.json();
            document.getElementById('userName').textContent = user.name;
        } else {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        }
    } catch (error) {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }
}

function initializeSocket() {
    socket = io();
    
    socket.on('quiz-update', function(data) {
        // Handle real-time quiz updates
        console.log('Quiz update received:', data);
    });
}

async function loadAvailableQuizzes() {
    try {
        const response = await fetch('/api/quiz/available', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            const quizzes = await response.json();
            displayAvailableQuizzes(quizzes);
        } else {
            showError('Error loading quizzes');
        }
    } catch (error) {
        showError('Error loading quizzes');
    }
}

function displayAvailableQuizzes(quizzes) {
    const container = document.getElementById('availableQuizzes');
    
    if (quizzes.length === 0) {
        container.innerHTML = '<p class="text-muted">No quizzes available at the moment.</p>';
        return;
    }
    
    container.innerHTML = quizzes.map(quiz => `
        <div class="quiz-card mb-3 p-3 border rounded">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h5 class="mb-1">${quiz.title}</h5>
                    <p class="text-muted mb-2">${quiz.description || 'No description available'}</p>
                    <div class="d-flex gap-3">
                        <span class="badge bg-primary">
                            <i class="fas fa-clock me-1"></i>${quiz.timeLimit} min
                        </span>
                        <span class="badge bg-info">
                            <i class="fas fa-question-circle me-1"></i>${quiz.questions.length} questions
                        </span>
                        <span class="badge bg-success">
                            <i class="fas fa-star me-1"></i>${quiz.totalPoints} points
                        </span>
                    </div>
                </div>
                <div class="col-md-4 text-end">
                    <button class="btn btn-primary btn-lg" onclick="startQuiz('${quiz._id}')">
                        Start Quiz
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

async function startQuiz(quizId) {
    try {
        const response = await fetch(`/api/quiz/${quizId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            currentQuiz = await response.json();
            initializeQuiz();
            showQuizInterface();
        } else {
            showError('Error loading quiz');
        }
    } catch (error) {
        showError('Error loading quiz');
    }
}

function initializeQuiz() {
    currentQuestionIndex = 0;
    userAnswers = {};
    timeRemaining = currentQuiz.timeLimit * 60; // Convert to seconds
    
    // Join quiz room
    socket.emit('join-quiz', currentQuiz._id);
    
    // Start timer
    startTimer();
    
    // Display first question
    displayQuestion();
    
    // Update navigation
    updateQuestionNavigator();
}

function startTimer() {
    quizTimer = setInterval(() => {
        timeRemaining--;
        
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        
        document.getElementById('timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeRemaining <= 0) {
            clearInterval(quizTimer);
            submitQuiz();
        }
    }, 1000);
}

function displayQuestion() {
    const question = currentQuiz.questions[currentQuestionIndex];
    const container = document.getElementById('questionContainer');
    
    container.innerHTML = `
        <div class="question-display">
            <h5 class="mb-4">Question ${currentQuestionIndex + 1} of ${currentQuiz.questions.length}</h5>
            <p class="question-text mb-4">${question.question}</p>
            
            <div class="options-list">
                ${question.options.map((option, index) => `
                    <div class="option-item mb-3">
                        <input type="radio" 
                               name="question_${currentQuestionIndex}" 
                               id="option_${currentQuestionIndex}_${index}"
                               value="${index}"
                               ${userAnswers[currentQuestionIndex] === index ? 'checked' : ''}
                               onchange="selectAnswer(${currentQuestionIndex}, ${index})">
                        <label class="option-label" for="option_${currentQuestionIndex}_${index}">
                            ${option}
                        </label>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Update progress bar
    const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
    
    // Update navigation buttons
    updateNavigationButtons();
}

function selectAnswer(questionIndex, optionIndex) {
    userAnswers[questionIndex] = optionIndex;
    
    // Update question navigator
    updateQuestionNavigator();
    
    // Update navigation buttons
    updateNavigationButtons();
}

function updateQuestionNavigator() {
    const container = document.getElementById('questionNavigator');
    
    container.innerHTML = currentQuiz.questions.map((question, index) => {
        const isAnswered = userAnswers[index] !== undefined;
        const isCurrent = index === currentQuestionIndex;
        
        return `
            <button class="btn btn-sm mb-2 ${getNavigatorButtonClass(isAnswered, isCurrent)}" 
                    onclick="goToQuestion(${index})">
                ${index + 1}
            </button>
        `;
    }).join('');
}

function getNavigatorButtonClass(isAnswered, isCurrent) {
    if (isCurrent) return 'btn-primary';
    if (isAnswered) return 'btn-success';
    return 'btn-outline-secondary';
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.style.display = currentQuestionIndex === currentQuiz.questions.length - 1 ? 'none' : 'inline-block';
    submitBtn.style.display = currentQuestionIndex === currentQuiz.questions.length - 1 ? 'inline-block' : 'none';
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

function nextQuestion() {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

function goToQuestion(index) {
    currentQuestionIndex = index;
    displayQuestion();
}

async function submitQuiz() {
    clearInterval(quizTimer);
    
    // Check if all questions are answered
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < currentQuiz.questions.length) {
        const confirmSubmit = confirm(`You have answered ${answeredCount} out of ${currentQuiz.questions.length} questions. Are you sure you want to submit?`);
        if (!confirmSubmit) {
            // Restart timer
            timeRemaining = 30; // Give 30 seconds to reconsider
            startTimer();
            return;
        }
    }
    
    try {
        const response = await fetch('/api/quiz/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                quizId: currentQuiz._id,
                answers: userAnswers,
                timeTaken: (currentQuiz.timeLimit * 60) - timeRemaining
            })
        });
        
        if (response.ok) {
            const results = await response.json();
            showQuizResults(results);
        } else {
            const error = await response.json();
            showError('Error submitting quiz: ' + error.message);
        }
    } catch (error) {
        showError('Error submitting quiz');
    }
}

function showQuizResults(results) {
    hideAllSections();
    document.getElementById('quizResults').classList.remove('d-none');
    
    const container = document.getElementById('resultsContent');
    
    const score = results.score;
    const total = results.totalPoints;
    const percentage = Math.round((score / total) * 100);
    
    let resultClass = 'text-success';
    let resultIcon = 'fas fa-trophy';
    let resultMessage = 'Excellent!';
    
    if (percentage < 60) {
        resultClass = 'text-danger';
        resultIcon = 'fas fa-times-circle';
        resultMessage = 'Keep practicing!';
    } else if (percentage < 80) {
        resultClass = 'text-warning';
        resultIcon = 'fas fa-medal';
        resultMessage = 'Good job!';
    }
    
    container.innerHTML = `
        <div class="results-summary mb-4">
            <i class="${resultIcon} fa-4x ${resultClass} mb-3"></i>
            <h3 class="${resultClass}">${resultMessage}</h3>
            <h2 class="mb-3">Score: ${score}/${total}</h2>
            <h4 class="text-muted">Percentage: ${percentage}%</h4>
        </div>
        
        <div class="results-details">
            <h5>Performance Summary</h5>
            <div class="row text-center">
                <div class="col-md-4">
                    <div class="stat-item">
                        <h6>Correct Answers</h6>
                        <span class="text-success">${results.correctAnswers}</span>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-item">
                        <h6>Incorrect Answers</h6>
                        <span class="text-danger">${results.incorrectAnswers}</span>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-item">
                        <h6>Time Taken</h6>
                        <span class="text-info">${Math.floor(results.timeTaken / 60)}:${(results.timeTaken % 60).toString().padStart(2, '0')}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function reviewQuiz() {
    // Show quiz interface with answers
    showQuizInterface();
    displayQuestion();
}

function goToDashboard() {
    window.location.href = 'dashboard.html';
}

function showQuizInterface() {
    hideAllSections();
    document.getElementById('quizInterface').classList.remove('d-none');
}

function hideAllSections() {
    document.querySelectorAll('.quiz-section').forEach(section => {
        section.classList.add('d-none');
    });
}

function showError(message) {
    alert(message); // Replace with better error handling
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}
