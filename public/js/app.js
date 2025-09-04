// Global variables
let currentUser = null;
let socket = null;
let currentQuiz = null;
let quizTimer = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadCourses();
    checkAuthStatus();
});

// Initialize application
function initializeApp() {
    // Initialize Socket.io
    socket = io();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup smooth scrolling
    setupSmoothScrolling();
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Register form
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Quiz form
    if (document.getElementById('quizForm')) {
        document.getElementById('quizForm').addEventListener('submit', handleQuizSubmit);
    }
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', result.token);
            currentUser = result.user;
            updateUIForUser();
            hideModal('loginModal');
            showToast('Login successful!', 'success');
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Login failed. Please try again.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role')
    };
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', result.token);
            currentUser = result.user;
            updateUIForUser();
            hideModal('registerModal');
            showToast('Registration successful!', 'success');
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Registration failed. Please try again.', 'error');
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    updateUIForGuest();
    showToast('Logged out successfully', 'success');
}

function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (token) {
        // Verify token and get user info
        fetchUserProfile();
    } else {
        updateUIForGuest();
    }
}

async function fetchUserProfile() {
    try {
        const response = await fetch('/api/users/profile', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            const user = await response.json();
            currentUser = user;
            updateUIForUser();
        } else {
            localStorage.removeItem('token');
            updateUIForGuest();
        }
    } catch (error) {
        localStorage.removeItem('token');
        updateUIForGuest();
    }
}

// UI Update functions
function updateUIForUser() {
    document.getElementById('authButtons').classList.add('d-none');
    document.getElementById('userMenu').classList.remove('d-none');
    document.getElementById('userName').textContent = currentUser.name;
}

function updateUIForGuest() {
    document.getElementById('authButtons').classList.remove('d-none');
    document.getElementById('userMenu').classList.add('d-none');
}

// Modal functions
function showLoginModal() {
    const modal = new bootstrap.Modal(document.getElementById('loginModal'));
    modal.show();
}

function showRegisterModal() {
    const modal = new bootstrap.Modal(document.getElementById('registerModal'));
    modal.show();
}

function hideModal(modalId) {
    const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
    if (modal) modal.hide();
}

// Course functions
async function loadCourses() {
    try {
        const response = await fetch('/api/courses');
        const courses = await response.json();
        displayCourses(courses);
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

function displayCourses(courses) {
    const container = document.getElementById('coursesContainer');
    if (!container) return;
    
    container.innerHTML = courses.map(course => `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="card h-100">
                <img src="${course.thumbnail || '/images/course-placeholder.jpg'}" class="card-img-top" alt="${course.title}">
                <div class="card-body">
                    <h5 class="card-title">${course.title}</h5>
                    <p class="card-text">${course.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-primary">${course.level}</span>
                        <span class="text-muted">${course.category}</span>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary w-100" onclick="enrollCourse('${course._id}')">
                        Enroll Now
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

async function enrollCourse(courseId) {
    if (!currentUser) {
        showToast('Please login to enroll in courses', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/courses/enroll', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ courseId, userId: currentUser.id })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('Successfully enrolled!', 'success');
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Enrollment failed. Please try again.', 'error');
    }
}

// Quiz functions
function showQuizModal() {
    if (!currentUser) {
        showToast('Please login to take quizzes', 'warning');
        return;
    }
    
    // Load available quizzes
    loadAvailableQuizzes();
}

async function loadAvailableQuizzes() {
    try {
        const response = await fetch('/api/quiz/available');
        const quizzes = await response.json();
        
        // Show quiz selection modal
        showQuizSelectionModal(quizzes);
    } catch (error) {
        showToast('Error loading quizzes', 'error');
    }
}

function startQuiz(quizId) {
    // Load quiz and start
    loadQuiz(quizId);
}

async function loadQuiz(quizId) {
    try {
        const response = await fetch(`/api/quiz/${quizId}`);
        const quiz = await response.json();
        
        currentQuiz = quiz;
        displayQuiz(quiz);
        startQuizTimer(quiz.timeLimit);
        
        // Join quiz room
        socket.emit('join-quiz', quizId);
    } catch (error) {
        showToast('Error loading quiz', 'error');
    }
}

function displayQuiz(quiz) {
    // Create quiz interface
    const quizHTML = `
        <div class="quiz-container">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3>${quiz.title}</h3>
                <div class="quiz-timer">
                    <i class="fas fa-clock me-2"></i>
                    <span id="timer">${quiz.timeLimit}:00</span>
                </div>
            </div>
            <div id="quizQuestions"></div>
            <button class="btn btn-primary btn-lg" onclick="submitQuiz()">
                Submit Quiz
            </button>
        </div>
    `;
    
    // Replace main content
    document.querySelector('main').innerHTML = quizHTML;
    
    // Display questions
    displayQuestions(quiz.questions);
}

function displayQuestions(questions) {
    const container = document.getElementById('quizQuestions');
    
    container.innerHTML = questions.map((question, index) => `
        <div class="question-card mb-4">
            <h5 class="mb-3">Question ${index + 1}</h5>
            <p class="mb-3">${question.question}</p>
            <div class="options">
                ${question.options.map((option, optIndex) => `
                    <button class="option-btn" onclick="selectOption(${index}, ${optIndex})">
                        ${option}
                    </button>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function selectOption(questionIndex, optionIndex) {
    // Remove previous selection
    const questionCard = document.querySelectorAll('.question-card')[questionIndex];
    questionCard.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Select new option
    questionCard.querySelectorAll('.option-btn')[optionIndex].classList.add('selected');
    
    // Store answer
    if (!currentQuiz.userAnswers) currentQuiz.userAnswers = {};
    currentQuiz.userAnswers[questionIndex] = optionIndex;
}

function startQuizTimer(minutes) {
    let timeLeft = minutes * 60;
    
    quizTimer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        document.getElementById('timer').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(quizTimer);
            submitQuiz();
        }
        
        timeLeft--;
    }, 1000);
}

async function submitQuiz() {
    if (!currentQuiz.userAnswers) {
        showToast('Please answer at least one question', 'warning');
        return;
    }
    
    clearInterval(quizTimer);
    
    try {
        const response = await fetch('/api/quiz/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                quizId: currentQuiz._id,
                answers: currentQuiz.userAnswers
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showQuizResults(result);
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error submitting quiz', 'error');
    }
}

function showQuizResults(results) {
    const resultsHTML = `
        <div class="quiz-container text-center">
            <h3>Quiz Results</h3>
            <div class="results-summary mb-4">
                <h4>Score: ${results.score}/${results.totalPoints}</h4>
                <p>Percentage: ${Math.round((results.score / results.totalPoints) * 100)}%</p>
            </div>
            <button class="btn btn-primary" onclick="location.reload()">
                Back to Home
            </button>
        </div>
    `;
    
    document.querySelector('main').innerHTML = resultsHTML;
}

// Utility functions
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0`;
    toast.setAttribute('role', 'alert');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(toast);
    
    // Show toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove after hidden
    toast.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toast);
    });
}

function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
}

function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}
