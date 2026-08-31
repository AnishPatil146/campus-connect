import './globals.css';
import { AuthProvider } from '../components/AuthProvider';
import { ThemeProvider } from '../components/ThemeProvider';
import { StudentDataProvider } from '../components/StudentDataProvider';
import { SocketProvider } from '../components/SocketProvider';
import { LoadingProvider } from '../components/LoadingProvider';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#090d16',
};

export const metadata = {
  title: 'Campus Connect',
  description: 'One Platform. Three Colleges. Connected Together.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Campus Connect',
  },
};

export default function RootLayout({
  children,
}: {
  children: any;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --role-primary: #2563EB;
            --role-secondary: #3B82F6;
            --role-tertiary: #60A5FA;
            --role-bg: #F8FAFC;
            --role-sidebar-bg: #FFFFFF;
            --role-header-bg: #FFFFFF;
            --role-card-bg: #FFFFFF;
            --role-border: #E2E8F0;
            --role-surface: #EFF6FF;
            --role-surface-hover: #DBEAFE;
            --role-login-from: #02225B;
            --role-login-to: #0A3B8B;
            --role-login-glow: #3B82F6;
          }
          html.dark, .dark {
            --role-primary: #3B82F6;
            --role-secondary: #60A5FA;
            --role-tertiary: #93C5FD;
            --role-bg: #0B0F19;
            --role-sidebar-bg: #0F172A;
            --role-header-bg: #0F172A;
            --role-card-bg: #131B2E;
            --role-border: #1E293B;
            --role-surface: #1E293B;
            --role-surface-hover: #334155;
            --role-login-from: #0F172A;
            --role-login-to: #1E3A8A;
            --role-login-glow: #3B82F6;
          }
          html[data-role="admin"] {
            --role-primary: #7C3AED;
            --role-secondary: #8B5CF6;
            --role-tertiary: #A78BFA;
            --role-surface: #F5F3FF;
            --role-surface-hover: #EDE9FE;
          }
          html[data-role="admin"].dark {
            --role-primary: #8B5CF6;
            --role-secondary: #A78BFA;
            --role-tertiary: #C4B5FD;
            --role-surface: rgba(139, 92, 246, 0.12);
            --role-surface-hover: rgba(139, 92, 246, 0.22);
          }
          html[data-role="teacher"] {
            --role-primary: #059669;
            --role-secondary: #10B981;
            --role-tertiary: #34D399;
            --role-surface: #ECFDF5;
            --role-surface-hover: #D1FAE5;
          }
          html[data-role="teacher"].dark {
            --role-primary: #10B981;
            --role-secondary: #34D399;
            --role-tertiary: #6EE7B7;
            --role-surface: rgba(16, 185, 129, 0.12);
            --role-surface-hover: rgba(16, 185, 129, 0.22);
          }
        ` }} />
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          } catch (_) {}
        ` }} />
      </head>
      <body>
        <ThemeProvider>
          <LoadingProvider>
            <AuthProvider>
              <SocketProvider>
                <StudentDataProvider>
                  {children}
                </StudentDataProvider>
              </SocketProvider>
            </AuthProvider>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
