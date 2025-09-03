# Shikkha Jatra - Advanced Educational Platform

A comprehensive educational platform inspired by LiveMCQ and 10Minutes School, featuring interactive quizzes, course management, and real-time learning experiences.

## �� Features

### Core Functionality
- **User Authentication System** - Secure login/registration with JWT tokens
- **Course Management** - Create, enroll, and track learning progress
- **Interactive Quiz System** - Take timed quizzes with real-time feedback
- **Google Forms Integration** - Import quizzes from Google Forms
- **Real-time Features** - Live quiz updates and student progress tracking
- **Responsive Design** - Modern UI that works on all devices

### Advanced Features
- **Student Dashboard** - Track progress, view certificates, and manage courses
- **Teacher Portal** - Create quizzes, manage courses, and monitor student performance
- **Progress Analytics** - Detailed insights into learning progress
- **Certificate System** - Award certificates upon course completion
- **Multi-language Support** - Bangla and English interface

## 🛠 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **Google APIs** - Forms integration

### Frontend
- **HTML5/CSS3** - Modern, responsive design
- **JavaScript (ES6+)** - Interactive functionality
- **Bootstrap 5** - UI framework
- **Font Awesome** - Icons
- **Socket.io Client** - Real-time updates

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Google Cloud Platform account (for Forms integration)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd shikkha-jatra
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/shikkha-jatra
JWT_SECRET=your-super-secret-jwt-key
GOOGLE_APPLICATION_CREDENTIALS=path/to/google-credentials.json
```

### 4. Database Setup
```bash
# Start MongoDB (if not running as a service)
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env file
```

### 5. Google Forms Integration
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Forms API
4. Create service account credentials
5. Download JSON file and update path in `.env`

### 6. Start the Application
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:5000`

## 📁 Project Structure

```
shikkha-jatra/
├── models/              # Database models
│   ├── User.js         # User schema
│   ├── Course.js       # Course schema
│   └── Quiz.js         # Quiz schema
├── routes/              # API routes
│   ├── auth.js         # Authentication routes
│   ├── courses.js      # Course management
│   ├── quiz.js         # Quiz operations
│   └── users.js        # User management
├── services/            # Business logic
│   └── googleForms.js  # Google Forms integration
├── public/              # Frontend assets
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   └── images/         # Images and assets
├── server.js            # Main server file
├── package.json         # Dependencies
└── README.md           # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Courses
- `GET /api/courses` - Get all published courses
- `GET /api/courses/:id` - Get specific course
- `POST /api/courses/enroll` - Enroll in a course

### Quizzes
- `GET /api/quiz/available` - Get available quizzes
- `GET /api/quiz/:id` - Get specific quiz
- `POST /api/quiz/create` - Create new quiz
- `POST /api/quiz/submit` - Submit quiz answers

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/stats` - Get user statistics

## 🎯 Usage Examples

### Creating a Quiz
1. Login as a teacher
2. Go to Dashboard
3. Click "Create Quiz"
4. Fill in quiz details
5. Add questions and options
6. Set time limit and points
7. Save quiz

### Taking a Quiz
1. Login as a student
2. Go to Quiz section
3. Select available quiz
4. Answer questions within time limit
5. Submit and view results

### Google Forms Integration
1. Create quiz in Google Forms
2. Copy Form ID
3. Use Form ID when creating quiz
4. System automatically imports questions

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet.js security headers

## 📱 Responsive Design

The platform is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment
```bash
npm start
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- Video streaming integration
- AI-powered learning recommendations
- Mobile app development
- Advanced analytics dashboard
- Multi-tenant architecture
- Payment gateway integration

---

**Built with ❤️ for better education**
