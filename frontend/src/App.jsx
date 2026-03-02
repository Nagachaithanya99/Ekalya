import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthToken } from "./hooks/useAuth";

/* Layouts */
import PublicLayout from "./layouts/PublicLayout";
import AdminLayout from "./layouts/AdminLayout";
import StudentLayout from "./layouts/StudentLayout";

/* Guards */
import ProtectedRoute from "./components/ProtectedRoute";
import RoleGuard from "./components/RoleGuard";

/* Public Pages */
import Home from "./pages/public/Home";
import Courses from "./pages/public/Courses";
import CourseDetails from "./pages/public/CourseDetails";
import Blog from "./pages/public/Blog";
import BlogDetails from "./pages/public/BlogDetails";
import Contact from "./pages/public/Contact";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import Redirect from "./pages/public/Redirect";
import DashboardRedirect from "./pages/public/DashboardRedirect";
import SsoCallback from "./pages/public/SsoCallback";

/* Student Pages */
import StudentDashboard from "./pages/student/Dashboard";
import MyCourses from "./pages/student/MyCourses";
import Watch from "./pages/student/Watch";
import Progress from "./pages/student/Progress";
import StudentCertificates from "./pages/student/Certificates";
import CertificateTemplates from "./pages/student/CertificateTemplates";
import Profile from "./pages/student/Profile";
import Quiz from "./pages/student/Quiz";
import PayEnroll from "./pages/student/PayEnroll";
import StudentPayments from "./pages/student/Payments";

/* Admin Pages */
import AdminDashboard from "./pages/admin/Dashboard";
import AdminCourses from "./pages/admin/Courses";
import AddCourse from "./pages/admin/AddCourse";
import EditCourse from "./pages/admin/EditCourse";
import Lessons from "./pages/admin/Lessons";
import Students from "./pages/admin/Students";
import Blogs from "./pages/admin/Blogs";
import AdminCertificates from "./pages/admin/Certificates";
import Messages from "./pages/admin/Messages";
import Payments from "./pages/admin/Payments";
import PaymentsTable from "./pages/admin/PaymentsTable";
/* Quiz Admin */
import AdminQuizzes from "./pages/admin/Quizzes";
import AdminCourseList from "./pages/admin/AdminCourseList";
import AdminCourseEditor from "./pages/admin/AdminCourseEditor";
import StudentCourseList from "./pages/student/StudentCourseList";
import StudentCourseDashboard from "./pages/student/StudentCourseDashboard";
import LessonViewer from "./pages/student/LessonViewer";
import LessonQuiz from "./pages/student/LessonQuiz";
import FinalQuiz from "./pages/student/FinalQuiz";
import CertificateTemplateSelect from "./pages/student/CertificateTemplateSelect";
import CertificateDownload from "./pages/student/CertificateDownload";

export default function App() {
  // 🔐 Attach Clerk token to axios globally
  useAuthToken();

  return (
    <Routes>
      {/* ================= PUBLIC ================= */}
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:id" element={<CourseDetails />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:id" element={<BlogDetails />} />
        <Route path="contact" element={<Contact />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        <Route path="sso-callback" element={<SsoCallback />} />
        <Route path="redirect" element={<Redirect />} />

        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* ================= STUDENT ================= */}
      <Route
        path="student"
        element={
          <ProtectedRoute>
            <RoleGuard allow={["student"]}>
              <StudentLayout />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="my-courses" element={<MyCourses />} />
        <Route path="watch/:id" element={<Watch />} />
        <Route path="progress" element={<Progress />} />
        <Route path="certificates" element={<StudentCertificates />} />
        <Route path="certificates/templates" element={<CertificateTemplates />} />
        <Route path="profile" element={<Profile />} />
        <Route path="pay/:id" element={<PayEnroll />} />
        <Route path="payments" element={<StudentPayments />} />
        <Route path="v2/courses" element={<StudentCourseList />} />
        <Route path="v2/courses/:id" element={<StudentCourseDashboard />} />
        <Route path="v2/lesson/:courseId/:lessonId" element={<LessonViewer />} />
        <Route path="v2/lesson-quiz/:quizId" element={<LessonQuiz />} />
        <Route path="v2/final-quiz/:courseId" element={<FinalQuiz />} />
        <Route
          path="v2/courses/:courseId/certificate/template"
          element={<CertificateTemplateSelect />}
        />
        <Route path="v2/courses/:courseId/certificate" element={<CertificateDownload />} />
      </Route>

      {/* ================= STUDENT QUIZ (Standalone Screen) ================= */}
      <Route
        path="student/quiz/:courseId"
        element={
          <ProtectedRoute>
            <RoleGuard allow={["student"]}>
              <Quiz />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      {/* ================= ADMIN ================= */}
      <Route
        path="admin"
        element={
          <ProtectedRoute>
            <RoleGuard allow={["admin"]}>
              <AdminLayout />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="courses" element={<AdminCourses />} />
        <Route path="courses/add" element={<AddCourse />} />
        <Route path="courses/:id/edit" element={<EditCourse />} />
        <Route path="lessons" element={<Lessons />} />
        <Route path="students" element={<Students />} />
        <Route path="blogs" element={<Blogs />} />
        <Route path="certificates" element={<AdminCertificates />} />
        <Route path="messages" element={<Messages />} />
        <Route path="payments" element={<Payments />} />
        <Route path="quizzes" element={<AdminQuizzes />} />
        <Route path="payments-table" element={<PaymentsTable />} />
        <Route path="quizzes/:courseId" element={<AdminQuizzes />} />
        <Route path="course-list" element={<AdminCourseList />} />
        <Route path="course-editor/:id" element={<AdminCourseEditor />} />
      </Route>

      {/* ================= FALLBACK ================= */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
