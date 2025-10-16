import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Radiology Reporting App',
  description: 'AI-powered radiology reporting application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
