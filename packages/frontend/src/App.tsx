import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoadingSpinner from './components/ui/LoadingSpinner';
import LandingSkeleton from './components/skeletons/LandingSkeleton';
import RateLimitBanner from './components/ui/RateLimitBanner';
import NetworkBanner from './components/ui/NetworkBanner';
import PublicLayout from './components/layout/PublicLayout';
import UserLayout from './components/layout/UserLayout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import MaintainerRoute from './components/auth/MaintainerRoute';
import MaintainerLayout, { firstMaintainerPath } from './components/layout/MaintainerLayout';

function MaintainerIndex() {
  const { user } = useAuth();
  return <Navigate to={firstMaintainerPath(user?.permissions, user?.role)} replace />;
}

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const DiscoverBrowse = lazy(() => import('./pages/DiscoverBrowse'));
const NoteDetail = lazy(() => import('./pages/NoteDetail'));
const UniversityDetail = lazy(() => import('./pages/UniversityDetail'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const SemesterDetail = lazy(() => import('./pages/SemesterDetail'));
const SubjectPage = lazy(() => import('./pages/SubjectPage'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Contact = lazy(() => import('./pages/Contact'));
const Support = lazy(() => import('./pages/Support'));
const CommunityFeed = lazy(() => import('./pages/community/CommunityFeed'));
const PostDetail = lazy(() => import('./pages/community/PostDetail'));
const CommunityProfile = lazy(() => import('./pages/community/CommunityProfile'));
const UserDashboard = lazy(() => import('./pages/user/Dashboard'));
const DiscoverBrowseUser = lazy(() => import('./pages/DiscoverBrowse'));
const UserProfile = lazy(() => import('./pages/user/Profile'));
const UserBookmarks = lazy(() => import('./pages/user/Bookmarks'));
const UserMyNotes = lazy(() => import('./pages/user/MyNotes'));
const UserUpload = lazy(() => import('./pages/user/Upload'));
const UserReports = lazy(() => import('./pages/user/Reports'));
const UserSettings = lazy(() => import('./pages/user/Settings'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminContent = lazy(() => import('./pages/admin/Content'));
const AdminNotes = lazy(() => import('./pages/admin/Notes'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const AdminAds = lazy(() => import('./pages/admin/Ads'));
const AdminMessages = lazy(() => import('./pages/admin/Messages'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));
const AdminComments = lazy(() => import('./pages/admin/Comments'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const AdminMail = lazy(() => import('./pages/admin/Mail'));
const UserDetail = lazy(() => import('./pages/admin/UserDetail'));
const CommunityModeration = lazy(() => import('./pages/admin/CommunityModeration'));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>;
}

export default function App() {
  const { loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <SuspenseWrapper>
      <RateLimitBanner />
      <NetworkBanner />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Suspense fallback={<LandingSkeleton />}><Landing /></Suspense>} />
          <Route path="/notes" element={<DiscoverBrowse />} />
          <Route path="/notes/:id" element={<NoteDetail />} />
          <Route path="/universities/:id" element={<UniversityDetail />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/semesters/:id" element={<SemesterDetail />} />
          <Route path="/subjects/:id" element={<SubjectPage />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/support" element={<Support />} />
          <Route path="/community" element={<CommunityFeed />} />
          <Route path="/community/post/:id" element={<PostDetail />} />
          <Route path="/community/:id" element={<CommunityProfile />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route
          path="/user"
          element={
            <ProtectedRoute>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="browse" element={<DiscoverBrowseUser />} />
          <Route path="bookmarks" element={<UserBookmarks />} />
          <Route path="my-notes" element={<UserMyNotes />} />
          <Route path="upload" element={<UserUpload />} />
          <Route path="reports" element={<UserReports />} />
          <Route path="settings" element={<UserSettings />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="notes" element={<AdminNotes />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="ads" element={<AdminAds />} />
          <Route path="comments" element={<AdminComments />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="mail" element={<AdminMail />} />
          <Route path="community" element={<CommunityModeration />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        <Route
          path="/maintainer"
          element={
            <MaintainerRoute>
              <MaintainerLayout />
            </MaintainerRoute>
          }
        >
          <Route index element={<MaintainerIndex />} />
          <Route path="notes" element={<AdminNotes />} />
          <Route path="comments" element={<AdminComments />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="ads" element={<AdminAds />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="community" element={<CommunityModeration />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SuspenseWrapper>
  );
}
