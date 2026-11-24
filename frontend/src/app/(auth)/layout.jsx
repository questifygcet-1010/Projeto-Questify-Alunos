import './auth.css';

export default function AuthLayout({ children }) {
  return (
    <div className="legacy-auth">
      <div>{children}</div>
    </div>
  );
}
