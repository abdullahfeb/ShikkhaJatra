// Dashboard functionality
let currentUser = null;
let userStats = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupNavigation();
    loadDashboardData();
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
            currentUser = await response.json();
            updateUserInfo();
            loadDashboardData();
        } else {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        }
    } catch (error) {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }
}

function updateUserInfo() {
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.name;
    }
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show corresponding section
            const targetId = this.getAttribute('href').substring(1);
            showSection(targetId);
        });
    });
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('d-none');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('d-none');
    }
    
    // Load section-specific data
    switch(sectionId) {
        case 'courses':
            loadEnrolledCourses();
            break;
        case 'quizzes':
            loadQuizHistory();
            break;
        case 'progress':
            loadProgressData();
            break;
        case 'certificates':
            loadCertificates();
            break;
    }
}

async function loadDashboardData() {
    await Promise.all([
        loadUserStats(),
        loadRecentActivity()
    ]);
}

async function loadUserStats() {
    try {
        const response = await fetch('/api/users/stats', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            userStats = await response.json();
            updateStatsDisplay();
        }
    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

function updateStatsDisplay() {
    if (userStats) {
        document.getElementById('enrolledCoursesCount').textContent = userStats.enrolledCourses || 0;
        document.getElementById('completedQuizzesCount').textContent = userStats.completedQuizzes || 0;
        document.getElementById('averageScore').textContent = `${userStats.averageScore || 0}%`;
        document.getElementById('studyTime').textContent = `${userStats.studyTime || 0}h`;
    }
}

async function loadRecentActivity() {
    try {
        const response = await fetch('/api/users/activity', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            const activities = await response.json();
            displayRecentActivity(activities);
        }
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

function displayRecentActivity(activities) {
    const container = document.getElementById('recentActivity');
    
    if (activities.length === 0) {
        container.innerHTML = '<p class="text-muted">No recent activity</p>';
        return;
    }
    
    container.innerHTML = activities.map(activity => `
        <div class="d-flex align-items-center mb-3">
            <div class="flex-shrink-0">
                <i class="fas fa-${getActivityIcon(activity.type)} text-primary"></i>
            </div>
            <div class="flex-grow-1 ms-3">
                <p class="mb-0">${activity.description}</p>
                <small class="text-muted">${new Date(activity.timestamp).toLocaleDateString()}</small>
            </div>
        </div>
    `).join('');
}

function getActivityIcon(type) {
    const icons = {
        'course_enrolled': 'book',
        'quiz_completed': 'check-circle',
        'lesson_completed': 'graduation-cap',
        'certificate_earned': 'certificate'
    };
    return icons[type] || 'info-circle';
}

async function loadEnrolledCourses() {
    try {
        const response = await fetch('/api/users/courses', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            const courses = await response.json();
            displayEnrolledCourses(courses);
        }
    } catch (error) {
        console.error('Error loading enrolled courses:', error);
    }
}

function displayEnrolledCourses(courses) {
    const container = document.getElementById('enrolledCourses');
    
    if (courses.length === 0) {
        container.innerHTML = '<p class="text-muted">No courses enrolled yet</p>';
        return;
    }
    
    container.innerHTML = courses.map(course => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <h5 class="card-title">${course.title}</h5>
                        <p class="card-text">${course.description}</p>
                        <div class="progress mb-2">
                            <div class="progress-bar" style="width: ${course.progress || 0}%"></div>
                        </div>
                        <small class="text-muted">Progress: ${course.progress || 0}%</small>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-primary" onclick="continueCourse('${course._id}')">
                            Continue Learning
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadQuizHistory() {
    try {
        const response = await fetch('/api/users/quiz-history', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
            const quizzes = await response.json();
            displayQuizHistory(quizzes);
        }
    } catch (error) {
        console.error('Error loading quiz history:', error);
    }
}

function displayQuizHistory(quizzes) {
    const container = document.getElementById('quizHistory');
    
    if (quizzes.length === 0) {
        container.innerHTML = '<p class="text-muted">No quiz history available</p>';
        return;
    }
    
    container.innerHTML = quizzes.map(quiz => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <h5 class="card-title">${quiz.title}</h5>
                        <p class="card-text">Score: ${quiz.score}/${quiz.totalPoints}</p>
                        <small class="text-muted">Completed: ${new Date(quiz.completedAt).toLocaleDateString()}</small>
                    </div>
                    <div class="col-md-4 text-end">
                        <span class="badge bg-${getScoreBadgeColor(quiz.score, quiz.totalPoints)}">
                            ${Math.round((quiz.score / quiz.totalPoints) * 100)}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function getScoreBadgeColor(score, total) {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'danger';
}

// Quiz Creation Functions
function showCreateQuizModal() {
    if (currentUser.role !== 'teacher' && currentUser.role !== 'admin') {
        alert('Only teachers can create quizzes');
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('createQuizModal'));
    modal.show();
}

function addQuestion() {
    const container = document.getElementById('questionsContainer');
    const questionIndex = container.children.length;
    
    const questionHTML = `
        <div class="question-item border rounded p-3 mb-3">
            <div class="row">
                <div class="col-md-8">
                    <div class="mb-3">
                        <label class="form-label">Question ${questionIndex + 1}</label>
                        <textarea class="form-control" name="questions[${questionIndex}][question]" required></textarea>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="mb-3">
                        <label class="form-label">Points</label>
                        <input type="number" class="form-control" name="questions[${questionIndex}][points]" value="1" min="1">
                    </div>
                </div>
            </div>
            <div class="options-container">
                <label class="form-label">Options</label>
                <div class="mb-2">
                    <input type="text" class="form-control" name="questions[${questionIndex}][options][]" placeholder="Option 1" required>
                </div>
                <div class="mb-2">
                    <input type="text" class="form-control" name="questions[${questionIndex}][options][]" placeholder="Option 2" required>
                </div>
                <div class="mb-2">
                    <input type="text" class="form-control" name="questions[${questionIndex}][options][]" placeholder="Option 3" required>
                </div>
                <div class="mb-2">
                    <input type="text" class="form-control" name="questions[${questionIndex}][options][]" placeholder="Option 4" required>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Correct Answer (Option number: 1-4)</label>
                <input type="number" class="form-control" name="questions[${questionIndex}][correctAnswer]" min="1" max="4" required>
            </div>
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeQuestion(this)">
                Remove Question
            </button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', questionHTML);
}

function removeQuestion(button) {
    button.closest('.question-item').remove();
    reorderQuestions();
}

function reorderQuestions() {
    const questions = document.querySelectorAll('.question-item');
    questions.forEach((question, index) => {
        question.querySelector('label').textContent = `Question ${index + 1}`;
        question.querySelectorAll('input, textarea').forEach(input => {
            const name = input.name;
            if (name.includes('[')) {
                input.name = name.replace(/\[\d+\]/, `[${index}]`);
            }
        });
    });
}

// Form submission
document.getElementById('createQuizForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const quizData = {
        title: formData.get('title'),
        description: formData.get('description'),
        timeLimit: parseInt(formData.get('timeLimit')),
        googleFormId: formData.get('googleFormId'),
        questions: []
    };
    
    // Extract questions data
    const questions = document.querySelectorAll('.question-item');
    questions.forEach(question => {
        const options = Array.from(question.querySelectorAll('input[name*="[options]"]')).map(input => input.value);
        const correctAnswer = parseInt(question.querySelector('input[name*="[correctAnswer]"]').value) - 1;
        const points = parseInt(question.querySelector('input[name*="[points]"]').value);
        
        quizData.questions.push({
            question: question.querySelector('textarea').value,
            options,
            correctAnswer,
            points
        });
    });
    
    try {
        const response = await fetch('/api/quiz/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(quizData)
        });
        
        if (response.ok) {
            const result = await response.json();
            alert('Quiz created successfully!');
            bootstrap.Modal.getInstance(document.getElementById('createQuizModal')).hide();
            this.reset();
            document.getElementById('questionsContainer').innerHTML = '';
        } else {
            const error = await response.json();
            alert('Error creating quiz: ' + error.message);
        }
    } catch (error) {
        alert('Error creating quiz. Please try again.');
    }
});

function continueCourse(courseId) {
    // Navigate to course page
    window.location.href = `course.html?id=${courseId}`;
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}
