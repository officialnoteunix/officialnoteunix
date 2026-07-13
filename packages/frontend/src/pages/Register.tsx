import AuthContainer from '../components/auth/AuthContainer';
import SEO from '../components/seo/SEO';

export default function Register() {
  return (
    <>
      <SEO title="Register" description="Create your NoteUniX account to start sharing study notes" />
      <AuthContainer initialView="register" />
    </>
  );
}