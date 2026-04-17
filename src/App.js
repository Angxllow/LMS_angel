import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

import Dashboard from './pages/dashboard/Dashboard';
import CourseCatalog from './pages/courses/CourseCatalog';
import MyCourses from './pages/courses/MyCourses';
import CourseViewer from './pages/courses/CourseViewer';
import QuizSubmission from './pages/courses/QuizSubmission';
import TaskSubmission from './pages/courses/TaskSubmission';
import MaterialViewer from './pages/courses/MaterialViewer';
import Forums from './pages/forums/Forums';

import CreateCourse from './pages/courses/CreateCourse';
import ManageCourse from './pages/courses/ManageCourse';
import SubmissionsList from './pages/courses/SubmissionsList';
import CourseCalendar from './pages/calendar/CourseCalendar';
import DirectChat from './pages/chat/DirectChat';
import MeetingRoom from './pages/meetings/MeetingRoom';
import QuizEditor from './pages/courses/QuizEditor';
import GradesView from './pages/grades/GradesView';
import AdminPanel from './pages/admin/AdminPanel';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/catalog" element={<CourseCatalog />} />
                <Route path="/my-courses" element={<MyCourses />} />
                <Route path="/course/:id" element={<CourseViewer />} />
                <Route path="/quiz/:idCuestionario" element={<QuizSubmission />} />
                <Route path="/task/:idTarea" element={<TaskSubmission />} />
                <Route path="/material/:idMaterial" element={<MaterialViewer />} />
                <Route path="/forums" element={<Forums />} />

                {/* Multi-features Nuevos */}
                <Route path="/calendar" element={<CourseCalendar />} />
                <Route path="/chat" element={<DirectChat />} />
                <Route path="/meeting/:idCurso" element={<MeetingRoom />} />

                {/* Nuevas rutas de gestión */}
                <Route path="/create-course" element={<CreateCourse />} />
                <Route path="/manage-course/:id" element={<ManageCourse />} />
                <Route path="/manage-task/:idTarea/submissions" element={<SubmissionsList />} />
                <Route path="/manage-quiz/:idCuestionario" element={<QuizEditor />} />
                <Route path="/grades" element={<GradesView />} />
                <Route path="/admin" element={<AdminPanel />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
