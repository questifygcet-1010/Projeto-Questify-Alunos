import AuthCard from '@/components/auth/AuthCard';

export const metadata = { title: { absolute: 'Questify - Login' } };

export default function LoginPage() {
  return <AuthCard registering={false} />;
}
