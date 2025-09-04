// Global variables
let currentUser = null;
let socket = null;
let currentQuiz = null;
let quizTimer = null;
let liveClasses = [];
let modelTests = [];
let courses = [];
let leaderboard = [];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadAllContent();
    checkAuthStatus();
    initializeNotifications();
});

// Initialize application
function initializeApp() {
    // Initialize Socket.io
    socket = io();
    
    // Initialize AOS (Animate On Scroll)
    AOS.init({
        duration: 1000,
        once: true
    });
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup smooth scrolling
    setupSmoothScrolling();
    
    // Initialize real-time features
    initializeRealTimeFeatures();
}

// Initialize real-time features
function initializeRealTimeFeatures() {
    socket.on('live-class-started', function(data) {
        showNotification(`Live class "${data.title}" has started!`, 'success');
        loadLiveClasses(); // Refresh live classes
    });
    
    socket.on('new-model-test', function(data) {
        showNotification(`New model test "${data.title}" is available!`, 'info');
        loadModelTests(); // Refresh model tests
    });
    
    socket.on('leaderboard-updated', function(data) {
        loadLeaderboard(); // Refresh leaderboard
    });
}

// Load all content
async function loadAllContent() {
    await Promise.all([
        loadLiveClasses(),
        loadModelTests(),
        loadCourses(),
        loadLeaderboard()
    ]);
}

// Initialize notifications
function initializeNotifications() {
    // Show random notifications
    const notifications = [
        "🎉 New Live Classes Available! Join Now for Free",
        "📚 30,000+ Free Educational Videos",
        "🏆 Join 1M+ Students Learning with Us",
        "⚡ Take Model Tests and Improve Your Skills",
        "🎓 Get Certificates for Your Achievements"
    ];
    
    const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
    document.getElementById('notificationText').textContent = randomNotification;
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

// Live Classes Functions
async function loadLiveClasses() {
    try {
        // For demo purposes, create sample live classes
        liveClasses = [
            {
                id: 1,
                title: "Mathematics Class 10 - Algebra",
                teacher: "Dr. Rahman",
                time: "10:00 AM",
                duration: "45 min",
                students: 1250,
                isLive: true,
                thumbnail: "fas fa-calculator"
            },
            {
                id: 2,
                title: "English Grammar - Tenses",
                teacher: "Ms. Fatima",
                time: "2:00 PM",
                duration: "30 min",
                students: 890,
                isLive: false,
                thumbnail: "fas fa-language"
            },
            {
                id: 3,
                title: "Physics - Motion and Force",
                teacher: "Prof. Ahmed",
                time: "4:00 PM",
                duration: "60 min",
                students: 2100,
                isLive: true,
                thumbnail: "fas fa-atom"
            }
        ];
        displayLiveClasses(liveClasses);
    } catch (error) {
        console.error('Error loading live classes:', error);
    }
}

function displayLiveClasses(classes) {
    const container = document.getElementById('liveClassesContainer');
    if (!container) return;
    
    container.innerHTML = classes.map(cls => `
        <div class="col-lg-4 col-md-6 mb-4" data-aos="fade-up">
            <div class="live-class-card">
                ${cls.isLive ? '<div class="live-badge">LIVE</div>' : ''}
                <div class="class-thumbnail">
                    <i class="${cls.thumbnail}"></i>
                </div>
                <div class="class-info">
                    <h5 class="class-title">${cls.title}</h5>
                    <p class="class-teacher">by ${cls.teacher}</p>
                    <div class="class-meta">
                        <span class="class-time">
                            <i class="fas fa-clock me-1"></i>${cls.time}
                        </span>
                        <span class="class-students">
                            <i class="fas fa-users me-1"></i>${cls.students} students
                        </span>
                    </div>
                    <button class="btn btn-primary w-100" onclick="joinLiveClass('${cls.id}')">
                        ${cls.isLive ? '<i class="fas fa-play me-2"></i>Join Now' : '<i class="fas fa-calendar me-2"></i>Set Reminder'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Model Tests Functions
async function loadModelTests() {
    try {
        // For demo purposes, create sample model tests
        modelTests = [
            {
                id: 1,
                title: "SSC Mathematics Model Test 2024",
                subject: "Mathematics",
                questions: 50,
                duration: "90 min",
                difficulty: "Medium",
                attempts: 15420,
                avgScore: 78
            },
            {
                id: 2,
                title: "HSC Physics Practice Test",
                subject: "Physics",
                questions: 40,
                duration: "60 min",
                difficulty: "Hard",
                attempts: 8920,
                avgScore: 65
            },
            {
                id: 3,
                title: "English Grammar Test",
                subject: "English",
                questions: 30,
                duration: "45 min",
                difficulty: "Easy",
                attempts: 25680,
                avgScore: 85
            }
        ];
        displayModelTests(modelTests);
    } catch (error) {
        console.error('Error loading model tests:', error);
    }
}

function displayModelTests(tests) {
    const container = document.getElementById('modelTestsContainer');
    if (!container) return;
    
    container.innerHTML = tests.map(test => `
        <div class="col-lg-4 col-md-6 mb-4" data-aos="fade-up">
            <div class="model-test-card">
                <div class="test-header">
                    <h5 class="test-title">${test.title}</h5>
                    <span class="test-difficulty">${test.difficulty}</span>
                </div>
                <div class="test-stats">
                    <div class="test-stat">
                        <div class="test-stat-number">${test.questions}</div>
                        <div class="test-stat-label">Questions</div>
                    </div>
                    <div class="test-stat">
                        <div class="test-stat-number">${test.duration}</div>
                        <div class="test-stat-label">Duration</div>
                    </div>
                    <div class="test-stat">
                        <div class="test-stat-number">${test.avgScore}%</div>
                        <div class="test-stat-label">Avg Score</div>
                    </div>
                </div>
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <small class="text-muted">
                        <i class="fas fa-users me-1"></i>${test.attempts} attempts
                    </small>
                    <span class="badge bg-primary">${test.subject}</span>
                </div>
                <button class="btn btn-success w-100" onclick="startModelTest('${test.id}')">
                    <i class="fas fa-play me-2"></i>Start Test
                </button>
            </div>
        </div>
    `).join('');
}

// Leaderboard Functions
async function loadLeaderboard() {
    try {
        // For demo purposes, create sample leaderboard
        leaderboard = [
            { rank: 1, name: "Ahmed Rahman", score: 95, avatar: "A" },
            { rank: 2, name: "Fatima Khan", score: 92, avatar: "F" },
            { rank: 3, name: "Mohammad Ali", score: 89, avatar: "M" },
            { rank: 4, name: "Sara Ahmed", score: 87, avatar: "S" },
            { rank: 5, name: "Rahim Uddin", score: 85, avatar: "R" }
        ];
        displayLeaderboard(leaderboard);
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

function displayLeaderboard(leaderboardData) {
    const container = document.getElementById('leaderboardContainer');
    if (!container) return;
    
    container.innerHTML = leaderboardData.map(user => `
        <div class="leaderboard-item">
            <div class="leaderboard-rank rank-${user.rank <= 3 ? user.rank : 'other'}">
                ${user.rank}
            </div>
            <div class="leaderboard-user">
                <div class="leaderboard-name">${user.name}</div>
                <small class="text-muted">${user.avatar}</small>
            </div>
            <div class="leaderboard-score">${user.score}%</div>
        </div>
    `).join('');
}

// Course functions
async function loadCourses() {
    try {
        // For demo purposes, create sample courses
        courses = [
            {
                id: 1,
                title: "Ghore Boshe Spoken English",
                instructor: "Ms. Sarah",
                duration: "20 hours",
                students: 15420,
                rating: 4.8,
                price: "Free",
                thumbnail: "fas fa-comments"
            },
            {
                id: 2,
                title: "Video Editing with Premiere Pro",
                instructor: "Mr. Karim",
                duration: "15 hours",
                students: 8920,
                rating: 4.6,
                price: "৳2,500",
                thumbnail: "fas fa-video"
            },
            {
                id: 3,
                title: "Digital Marketing Masterclass",
                instructor: "Dr. Hasan",
                duration: "25 hours",
                students: 12300,
                rating: 4.9,
                price: "৳3,500",
                thumbnail: "fas fa-chart-line"
            }
        ];
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

// Action Functions for 10Minutes School + LiveMCQ Features

function joinLiveClass(classId) {
    if (!currentUser) {
        showToast('Please login to join live classes', 'warning');
        return;
    }
    
    const liveClass = liveClasses.find(cls => cls.id == classId);
    if (liveClass) {
        if (liveClass.isLive) {
            // Join live class
            showToast(`Joining live class: ${liveClass.title}`, 'success');
            // Here you would integrate with video streaming service
            window.open(`live-class.html?id=${classId}`, '_blank');
        } else {
            // Set reminder for upcoming class
            showToast(`Reminder set for: ${liveClass.title}`, 'info');
        }
    }
}

function startModelTest(testId) {
    if (!currentUser) {
        showToast('Please login to take model tests', 'warning');
        return;
    }
    
    const test = modelTests.find(t => t.id == testId);
    if (test) {
        showToast(`Starting model test: ${test.title}`, 'success');
        // Navigate to model test page
        window.location.href = `model-test.html?id=${testId}`;
    }
}

function loadMoreLiveClasses() {
    showToast('Loading more live classes...', 'info');
    // In real implementation, load more from API
    setTimeout(() => {
        showToast('More live classes loaded!', 'success');
    }, 1000);
}

function loadMoreModelTests() {
    showToast('Loading more model tests...', 'info');
    // In real implementation, load more from API
    setTimeout(() => {
        showToast('More model tests loaded!', 'success');
    }, 1000);
}

function loadMoreCourses() {
    showToast('Loading more courses...', 'info');
    // In real implementation, load more from API
    setTimeout(() => {
        showToast('More courses loaded!', 'success');
    }, 1000);
}

function closeNotification() {
    const notification = document.querySelector('.top-notification');
    if (notification) {
        notification.style.transform = 'translateY(-100%)';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 500);
    }
}

function showNotification(message, type = 'info') {
    // Create notification toast
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0 position-fixed top-0 end-0 m-3`;
    toast.setAttribute('role', 'alert');
    toast.style.zIndex = '9999';
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
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
