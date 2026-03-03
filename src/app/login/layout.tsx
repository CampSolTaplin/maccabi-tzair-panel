import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Iniciar Sesión — Maccabi Tzair Miami',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
