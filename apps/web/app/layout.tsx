import './globals.css';
import { AuthProvider } from '../components/AuthProvider';
import { ThemeProvider } from '../components/ThemeProvider';
import { StudentDataProvider } from '../components/StudentDataProvider';
import { SocketProvider } from '../components/SocketProvider';
import { LoadingProvider } from '../components/LoadingProvider';

export const metadata = {
  title: 'Campus Connect',
  description: 'One Platform. Three Colleges. Connected Together.',
  manifest: '/manifest.json',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
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
