# Jobify - AI-Powered Job Board

**Jobify** is a modern, full-stack job board application that connects job seekers with employers through an intelligent, role-based platform. Built with Django REST Framework and React, it provides comprehensive job posting, application management, real-time messaging, and notification features.

## ✨ Features

### For Job Seekers
- **User Registration & Authentication** - Secure JWT-based authentication
- **Profile Management** - Upload resumes, set preferences, manage personal info
- **Advanced Job Search** - Filter by location, salary, job type, experience level
- **Job Applications** - Apply to jobs with custom cover letters and additional details
- **Real-time Messaging** - Direct communication with employers
- **Application Tracking** - Monitor application status and history
- **Email Notifications** - Stay updated on application responses

### For Employers  
- **Company Profiles** - Showcase company information and branding
- **Job Posting Management** - Create, edit, and manage job listings
- **Application Review** - Review and manage incoming applications
- **Candidate Communication** - Message potential candidates directly
- **Application Analytics** - Track job post performance and applicant metrics

### Technical Features
- **Real-time Communication** - WebSocket-powered messaging system
- **File Management** - Resume uploads and company logo storage
- **Advanced Filtering** - Dynamic search and filter capabilities
- **Responsive Design** - Mobile-friendly Bootstrap 5 interface
- **RESTful API** - Clean, documented API endpoints

## 🚀 Live Demo

Experience Jobify in action: **[https://jobboard-frontend-jj2h.onrender.com](https://jobboard-frontend-jj2h.onrender.com)**

## 🛠️ Technology Stack

### Backend
- **Django 5.2.5** - Web framework
- **Django REST Framework 3.16.0** - API framework
- **Django Channels 4.3.1** - WebSocket support
- **JWT Authentication** - Secure token-based auth
- **MySQL/SQLite** - Database (configurable)
- **Redis** - WebSocket message broker

### Frontend  
- **React 19.1.1** - UI framework
- **React Router** - Navigation
- **Redux Toolkit** - State management
- **Bootstrap 5** - UI components
- **Axios** - HTTP client

## 📦 Project Structure

```
jobBoard/
├── jobboard/           # Django backend
│   ├── jobboard/       # Django project settings
│   ├── users/          # User management app
│   ├── media/          # Uploaded files
│   ├── manage.py       # Django management script
│   └── requirements.txt # Python dependencies
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── contexts/   # React contexts
│   │   └── services/   # API services
│   ├── public/         # Static assets
│   └── package.json    # Node dependencies
└── README.md           # This file
```

## 🚀 Local Installation Guide

### Prerequisites

Before you begin, ensure you have the following installed:
- **Python 3.8+** ([Download Python](https://python.org/downloads/))
- **Node.js 14+** ([Download Node.js](https://nodejs.org/))
- **Git** ([Download Git](https://git-scm.com/))
- **MySQL** (optional, SQLite is used by default)

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/jobBoard.git
cd jobBoard
```

### Step 2: Backend Setup (Django)

1. **Create and activate a virtual environment:**

```powershell
# Windows PowerShell
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
```

2. **Install Python dependencies:**

```bash
pip install -r jobboard/requirements.txt
```

3. **Configure environment variables:**

Create a `.env` file in the `jobboard/jobboard/` directory:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

4. **Run database migrations:**

```bash
cd jobboard
python manage.py migrate
```

5. **Create a superuser (optional):**

```bash
python manage.py createsuperuser
```

6. **Start the Django development server:**

```bash
python manage.py runserver
```

The backend API will be available at `http://localhost:8000`

### Step 3: Frontend Setup (React)

1. **Navigate to the frontend directory:**

```bash
cd ../frontend  # or cd frontend from project root
```

2. **Install Node.js dependencies:**

```bash
npm install
```

3. **Start the React development server:**

```bash
npm start
```

The frontend will be available at `http://localhost:3000` and will automatically proxy API requests to the Django backend.

### Step 4: Verify Installation

1. **Visit the frontend:** Open `http://localhost:3000` in your browser
2. **Test API endpoints:** Visit `http://localhost:8000/api/` to see the API root
3. **Admin panel:** Visit `http://localhost:8000/admin/` (if you created a superuser)

## 🔧 Configuration

### Database Configuration

**SQLite (Default):**
No additional setup required. The database file will be created automatically.

**MySQL:**
1. Install MySQL and create a database
2. Update your `.env` file:
```env
DATABASE_URL=mysql://username:password@localhost:3306/jobboard_db
```

### Email Configuration

For email notifications to work, configure your Gmail settings in `.env`:

```env
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password  # Use App Password, not regular password
```

### Redis Configuration (for WebSocket messaging)

Install Redis and update settings if needed:
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Windows (via WSL or Docker)
docker run -d -p 6379:6379 redis:alpine
```

## 🎯 Usage

### For Job Seekers:
1. **Register** for a new account or **login**
2. **Complete your profile** - add personal info, upload resume
3. **Browse jobs** - use search and filters to find relevant positions
4. **Apply to jobs** - submit applications with cover letters
5. **Track applications** - monitor status and employer responses
6. **Message employers** - communicate directly through the platform

### For Employers:
1. **Register as an employer** and set up your company profile
2. **Post jobs** - create detailed job listings
3. **Review applications** - manage incoming candidate applications
4. **Contact candidates** - message potential hires
5. **Manage listings** - edit or close job postings

## 🚀 Development

### API Documentation
The Django REST API provides endpoints for:
- User authentication (`/api/auth/`)
- Job listings (`/api/jobs/`)
- Applications (`/api/applications/`)
- User profiles (`/api/users/`)
- Messaging (`/api/messages/`)

### Running Tests

**Backend tests:**
```bash
cd jobboard
python manage.py test
```

**Frontend tests:**
```bash
cd frontend
npm test
```

### Building for Production

**Frontend build:**
```bash
cd frontend
npm run build
```

**Django production setup:**
- Set `DEBUG=False` in settings
- Configure proper database settings
- Set up static file serving
- Configure ALLOWED_HOSTS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo:** [https://jobboard-frontend-jj2h.onrender.com](https://jobboard-frontend-jj2h.onrender.com)
- **Repository:** [GitHub Repository](https://github.com/YOUR_USERNAME/jobBoard)

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/YOUR_USERNAME/jobBoard/issues) page
2. Create a new issue with detailed information
3. Refer to the troubleshooting section below

## 🐛 Troubleshooting

**Common Issues:**

1. **Port already in use:**
   - Backend: Change port with `python manage.py runserver 8001`
   - Frontend: Set `PORT=3001` environment variable

2. **Database errors:**
   - Ensure migrations are run: `python manage.py migrate`
   - For MySQL: Verify database exists and credentials are correct

3. **Module not found errors:**
   - Ensure virtual environment is activated
   - Reinstall dependencies: `pip install -r requirements.txt`

4. **CORS errors:**
   - Verify `CORS_ALLOW_ALL_ORIGINS = True` in Django settings
   - Check that both servers are running

5. **WebSocket connection issues:**
   - Ensure Redis is running
   - Check Django Channels configuration
