import AuthContainer from '../components/auth/AuthContainer';
import SEO from '../components/seo/SEO';

export default function Login() {
  return (
    <>
      <SEO title="Login" description="Log in to your NoteUniX account" />
      <AuthContainer initialView="login" />
    </>
  );
}