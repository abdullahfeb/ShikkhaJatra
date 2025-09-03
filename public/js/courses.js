// Courses functionality
let currentUser = null;
let allCourses = [];
let filteredCourses = [];
let currentPage = 1;
let coursesPerPage = 12;

document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    loadCourses();
    setupEventListeners();
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
            document.getElementById('userName').textContent = currentUser.name;
        } else {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        }
    } catch (error) {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(searchCourses, 300));
    
    // Category filter
    document.getElementById('categoryFilter').addEventListener('change', filterCourses);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function loadCourses() {
    try {
        showLoading();
        
        const response = await fetch('/api/courses');
        if (response.ok) {
            allCourses = await response.json();
            filteredCourses = [...allCourses];
            displayCourses();
        } else {
            showError('Error loading courses');
        }
    } catch (error) {
        showError('Error loading courses');
    } finally {
        hideLoading();
    }
}

function displayCourses() {
    const container = document.getElementById('coursesContainer');
    const startIndex = (currentPage - 1) * coursesPerPage;
    const endIndex = startIndex + coursesPerPage;
    const coursesToShow = filteredCourses.slice(startIndex, endIndex);
    
    if (currentPage === 1) {
        container.innerHTML = '';
    }
    
    if (coursesToShow.length === 0) {
        if (currentPage === 1) {
            container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">No courses found</p></div>';
        }
        return;
    }
    
    const coursesHTML = coursesToShow.map(course => `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="card h-100 course-card">
                <div class="card-img-top-container">
                    <img src="${course.thumbnail || '/images/course-placeholder.jpg'}" 
                         class="card-img-top" 
                         alt="${course.title}"
                         onerror="this.src='/images/course-placeholder.jpg'">
                    <div class="card-img-overlay">
                        <span class="badge bg-primary">${course.level}</span>
                    </div>
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${course.title}</h5>
                    <p class="card-text flex-grow-1">${truncateText(course.description, 100)}</p>
                    
                    <div class="course-meta mb-3">
                        <div class="row text-center">
                            <div class="col-4">
                                <small class="text-muted">
                                    <i class="fas fa-clock me-1"></i>
                                    ${course.totalDuration || 0}h
                                </small>
                            </div>
                            <div class="col-4">
                                <small class="text-muted">
                                    <i class="fas fa-book me-1"></i>
                                    ${course.lessons ? course.lessons.length : 0} lessons
                                </small>
                            </div>
                            <div class="col-4">
                                <small class="text-muted">
                                    <i class="fas fa-users me-1"></i>
                                    ${course.enrolledStudents ? course.enrolledStudents.length : 0}
                                </small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="course-rating mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="rating-stars">
                                ${generateStarRating(course.rating || 0)}
                            </div>
                            <small class="text-muted">(${course.totalRatings || 0} ratings)</small>
                        </div>
                    </div>
                    
                    <div class="mt-auto">
                        <button class="btn btn-primary w-100 mb-2" onclick="viewCourse('${course._id}')">
                            View Details
                        </button>
                        <button class="btn btn-outline-primary w-100" onclick="enrollInCourse('${course._id}')">
                            Enroll Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    container.insertAdjacentHTML('beforeend', coursesHTML);
    
    // Show/hide load more button
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    if (endIndex < filteredCourses.length) {
        loadMoreContainer.style.display = 'block';
    } else {
        loadMoreContainer.style.display = 'none';
    }
}

function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star text-warning"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt text-warning"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star text-warning"></i>';
    }
    
    return starsHTML;
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function searchCourses() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredCourses = allCourses.filter(course => 
        course.title.toLowerCase().includes(searchTerm) ||
        course.description.toLowerCase().includes(searchTerm) ||
        course.category.toLowerCase().includes(searchTerm)
    );
    
    currentPage = 1;
    displayCourses();
}

function filterCourses() {
    const category = document.getElementById('categoryFilter').value;
    
    if (category === '') {
        filteredCourses = [...allCourses];
    } else {
        filteredCourses = allCourses.filter(course => course.category === category);
    }
    
    currentPage = 1;
    displayCourses();
}

function loadMoreCourses() {
    currentPage++;
    displayCourses();
}

async function viewCourse(courseId) {
    try {
        const response = await fetch(`/api/courses/${courseId}`);
        if (response.ok) {
            const course = await response.json();
            showCourseModal(course);
        } else {
            showError('Error loading course details');
        }
    } catch (error) {
        showError('Error loading course details');
    }
}

function showCourseModal(course) {
    document.getElementById('courseModalTitle').textContent = course.title;
    
    const modalBody = document.getElementById('courseModalBody');
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-4">
                <img src="${course.thumbnail || '/images/course-placeholder.jpg'}" 
                     class="img-fluid rounded" 
                     alt="${course.title}">
            </div>
            <div class="col-md-8">
                <h6>Description</h6>
                <p>${course.description}</p>
                
                <div class="row mb-3">
                    <div class="col-6">
                        <strong>Category:</strong> ${course.category}
                    </div>
                    <div class="col-6">
                        <strong>Level:</strong> ${course.level}
                    </div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-6">
                        <strong>Duration:</strong> ${course.totalDuration || 0} hours
                    </div>
                    <div class="col-6">
                        <strong>Students:</strong> ${course.enrolledStudents ? course.enrolledStudents.length : 0}
                    </div>
                </div>
                
                <div class="mb-3">
                    <strong>Rating:</strong> ${generateStarRating(course.rating || 0)} (${course.rating || 0}/5)
                </div>
                
                ${course.lessons && course.lessons.length > 0 ? `
                    <h6>Course Content</h6>
                    <div class="list-group">
                        ${course.lessons.map((lesson, index) => `
                            <div class="list-group-item d-flex justify-content-between align-items-center">
                                <span>${index + 1}. ${lesson.title}</span>
                                <span class="badge bg-secondary">${lesson.duration || 0} min</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Update enroll button
    const enrollBtn = document.getElementById('enrollBtn');
    if (course.enrolledStudents && course.enrolledStudents.includes(currentUser.id)) {
        enrollBtn.textContent = 'Already Enrolled';
        enrollBtn.disabled = true;
        enrollBtn.className = 'btn btn-secondary';
    } else {
        enrollBtn.textContent = 'Enroll Now';
        enrollBtn.disabled = false;
        enrollBtn.className = 'btn btn-primary';
    }
    
    // Store course ID for enrollment
    enrollBtn.setAttribute('data-course-id', course._id);
    
    const modal = new bootstrap.Modal(document.getElementById('courseModal'));
    modal.show();
}

async function enrollInCourse(courseId) {
    if (!courseId) {
        courseId = document.getElementById('enrollBtn').getAttribute('data-course-id');
    }
    
    try {
        const response = await fetch('/api/courses/enroll', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                courseId: courseId,
                userId: currentUser.id
            })
        });
        
        if (response.ok) {
            showSuccess('Successfully enrolled in the course!');
            
            // Update UI
            const enrollBtn = document.getElementById('enrollBtn');
            enrollBtn.textContent = 'Already Enrolled';
            enrollBtn.disabled = true;
            enrollBtn.className = 'btn btn-secondary';
            
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('courseModal')).hide();
            
            // Refresh courses to update enrollment status
            loadCourses();
        } else {
            const error = await response.json();
            showError(error.message || 'Error enrolling in course');
        }
    } catch (error) {
        showError('Error enrolling in course');
    }
}

function showLoading() {
    const container = document.getElementById('coursesContainer');
    container.innerHTML = `
        <div class="col-12 text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
}

function hideLoading() {
    // Loading is handled by displayCourses
}

function showSuccess(message) {
    // Create success toast
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-success border-0 position-fixed top-0 end-0 m-3';
    toast.setAttribute('role', 'alert');
    
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

function showError(message) {
    alert(message); // Replace with better error handling
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}
