// Model Test functionality - LiveMCQ style
let currentTest = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let testTimer = null;
let timeRemaining = 0;
let testQuestions = [];

document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    initializeTest();
});

function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
}

function initializeTest() {
    // Get test ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('id');
    
    if (testId) {
        loadTest(testId);
    } else {
        // Demo test data
        loadDemoTest();
    }
}

function loadDemoTest() {
    // Demo test data
    currentTest = {
        id: 1,
        title: "SSC Mathematics Model Test 2024",
        duration: 90, // minutes
        totalQuestions: 50,
        subject: "Mathematics"
    };
    
    // Generate demo questions
    testQuestions = generateDemoQuestions();
    
    initializeTestInterface();
    startTest();
}

function generateDemoQuestions() {
    const questions = [];
    const subjects = ['Algebra', 'Geometry', 'Trigonometry', 'Statistics', 'Calculus'];
    
    for (let i = 1; i <= 50; i++) {
        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        questions.push({
            id: i,
            question: `Question ${i}: What is the value of x in the equation 2x + 5 = 15? (${subject})`,
            options: [
                `Option A: ${Math.floor(Math.random() * 20) + 1}`,
                `Option B: ${Math.floor(Math.random() * 20) + 1}`,
                `Option C: ${Math.floor(Math.random() * 20) + 1}`,
                `Option D: ${Math.floor(Math.random() * 20) + 1}`
            ],
            correctAnswer: Math.floor(Math.random() * 4),
            explanation: `This is the explanation for question ${i}. The correct answer is option ${String.fromCharCode(65 + Math.floor(Math.random() * 4))}.`
        });
    }
    
    return questions;
}

function initializeTestInterface() {
    document.getElementById('testTitle').textContent = currentTest.title;
    document.getElementById('totalQuestions').textContent = currentTest.totalQuestions;
    
    timeRemaining = currentTest.duration * 60; // Convert to seconds
    
    // Initialize question navigator
    updateQuestionNavigator();
    
    // Display first question
    displayQuestion();
}

function startTest() {
    // Start timer
    testTimer = setInterval(() => {
        timeRemaining--;
        
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        
        document.getElementById('testTimer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Change color when time is running out
        if (timeRemaining <= 300) { // 5 minutes
            document.getElementById('testTimer').parentElement.className = 'test-timer bg-warning text-dark p-3 rounded';
        }
        
        if (timeRemaining <= 60) { // 1 minute
            document.getElementById('testTimer').parentElement.className = 'test-timer bg-danger text-white p-3 rounded';
        }
        
        if (timeRemaining <= 0) {
            clearInterval(testTimer);
            submitTest();
        }
    }, 1000);
    
    // Auto-save answers every 30 seconds
    setInterval(() => {
        saveAnswers();
    }, 30000);
}

function displayQuestion() {
    const question = testQuestions[currentQuestionIndex];
    const container = document.getElementById('questionContainer');
    
    container.innerHTML = `
        <div class="question-content">
            <h5 class="question-text mb-4">${question.question}</h5>
            
            <div class="options-container">
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
    
    // Update question number
    document.getElementById('currentQuestionNumber').textContent = currentQuestionIndex + 1;
    
    // Update navigation buttons
    updateNavigationButtons();
    
    // Update question navigator
    updateQuestionNavigator();
}

function selectAnswer(questionIndex, optionIndex) {
    userAnswers[questionIndex] = optionIndex;
    updateQuestionNavigator();
}

function updateQuestionNavigator() {
    const container = document.getElementById('questionNavigator');
    
    container.innerHTML = testQuestions.map((question, index) => {
        const isAnswered = userAnswers[index] !== undefined;
        const isCurrent = index === currentQuestionIndex;
        
        let className = 'question-number';
        if (isCurrent) className += ' current';
        if (isAnswered) className += ' answered';
        
        return `
            <button class="${className}" onclick="goToQuestion(${index})">
                ${index + 1}
            </button>
        `;
    }).join('');
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitTestBtn');
    
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.disabled = currentQuestionIndex === testQuestions.length - 1;
    
    if (currentQuestionIndex === testQuestions.length - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-block';
    } else {
        nextBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

function nextQuestion() {
    if (currentQuestionIndex < testQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

function goToQuestion(index) {
    currentQuestionIndex = index;
    displayQuestion();
}

function saveAnswers() {
    // In real implementation, save to server
    localStorage.setItem('testAnswers', JSON.stringify(userAnswers));
}

function submitTest() {
    clearInterval(testTimer);
    
    // Check if all questions are answered
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < testQuestions.length) {
        const confirmSubmit = confirm(`You have answered ${answeredCount} out of ${testQuestions.length} questions. Are you sure you want to submit?`);
        if (!confirmSubmit) {
            // Restart timer
            timeRemaining = 30; // Give 30 seconds to reconsider
            startTest();
            return;
        }
    }
    
    // Calculate results
    const results = calculateResults();
    showResults(results);
}

function calculateResults() {
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let unanswered = 0;
    
    testQuestions.forEach((question, index) => {
        if (userAnswers[index] === undefined) {
            unanswered++;
        } else if (userAnswers[index] === question.correctAnswer) {
            correctAnswers++;
        } else {
            incorrectAnswers++;
        }
    });
    
    const totalMarks = correctAnswers;
    const percentage = Math.round((correctAnswers / testQuestions.length) * 100);
    
    return {
        totalQuestions: testQuestions.length,
        correctAnswers,
        incorrectAnswers,
        unanswered,
        totalMarks,
        percentage,
        timeTaken: (currentTest.duration * 60) - timeRemaining
    };
}

function showResults(results) {
    const container = document.getElementById('resultsContent');
    
    let resultClass = 'text-success';
    let resultIcon = 'fas fa-trophy';
    let resultMessage = 'Excellent!';
    
    if (results.percentage < 60) {
        resultClass = 'text-danger';
        resultIcon = 'fas fa-times-circle';
        resultMessage = 'Keep practicing!';
    } else if (results.percentage < 80) {
        resultClass = 'text-warning';
        resultIcon = 'fas fa-medal';
        resultMessage = 'Good job!';
    }
    
    container.innerHTML = `
        <div class="text-center mb-4">
            <i class="${resultIcon} fa-4x ${resultClass} mb-3"></i>
            <h3 class="${resultClass}">${resultMessage}</h3>
            <h2 class="mb-3">Score: ${results.totalMarks}/${results.totalQuestions}</h2>
            <h4 class="text-muted">Percentage: ${results.percentage}%</h4>
        </div>
        
        <div class="row text-center mb-4">
            <div class="col-md-3">
                <div class="stat-card">
                    <h5 class="text-success">${results.correctAnswers}</h5>
                    <small>Correct</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card">
                    <h5 class="text-danger">${results.incorrectAnswers}</h5>
                    <small>Incorrect</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card">
                    <h5 class="text-warning">${results.unanswered}</h5>
                    <small>Unanswered</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card">
                    <h5 class="text-info">${Math.floor(results.timeTaken / 60)}:${(results.timeTaken % 60).toString().padStart(2, '0')}</h5>
                    <small>Time Taken</small>
                </div>
            </div>
        </div>
        
        <div class="progress mb-4">
            <div class="progress-bar bg-success" style="width: ${results.percentage}%"></div>
        </div>
        
        <div class="text-center">
            <p class="text-muted">Your performance has been saved to your dashboard.</p>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('resultsModal'));
    modal.show();
}

function reviewAnswers() {
    // Close modal and show review interface
    bootstrap.Modal.getInstance(document.getElementById('resultsModal')).hide();
    
    // Show review interface
    showReviewInterface();
}

function showReviewInterface() {
    // Create review interface
    const reviewHTML = `
        <div class="review-interface">
            <h3>Answer Review</h3>
            <div id="reviewContainer">
                ${testQuestions.map((question, index) => {
                    const userAnswer = userAnswers[index];
                    const isCorrect = userAnswer === question.correctAnswer;
                    
                    return `
                        <div class="review-question mb-4">
                            <h6>Question ${index + 1}</h6>
                            <p>${question.question}</p>
                            <div class="review-options">
                                ${question.options.map((option, optIndex) => {
                                    let className = 'review-option';
                                    if (optIndex === question.correctAnswer) className += ' correct';
                                    if (optIndex === userAnswer && !isCorrect) className += ' incorrect';
                                    
                                    return `<div class="${className}">${option}</div>`;
                                }).join('')}
                            </div>
                            <div class="review-explanation">
                                <strong>Explanation:</strong> ${question.explanation}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    document.querySelector('.container').innerHTML = reviewHTML;
}