'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, MOCK_USERS } from '../../../components/AuthProvider';
import { useTheme } from '../../../components/ThemeProvider';
import { Button, Card, Input } from '@campus-connect/ui';
import { CollegeId, UserRole } from '@campus-connect/types';
import { AlertCircle, Sun, Moon, ArrowRight, User as UserIcon, ShieldCheck, GraduationCap, School } from 'lucide-react';

export default function Login() {
  const { login, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [collegeId, setCollegeId] = useState<CollegeId>('college-a');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showManual, setShowManual] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Please enter your email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    const success = await login(email, collegeId, role);
    if (success) {
      redirectUser(role);
    } else {
      setError('Invalid credentials. Check your custom inputs.');
    }
  };

  const redirectUser = (userRole: UserRole) => {
    if (userRole === 'STUDENT') router.push('/dashboard/student');
    else if (userRole === 'TEACHER') router.push('/dashboard/teacher');
    else if (userRole === 'ADMIN') router.push('/dashboard/admin');
    else if (userRole === 'SUPER_ADMIN') router.push('/dashboard/super-admin');
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setError(null);
    const demo = MOCK_USERS[demoEmail];
    if (demo) {
      const success = await login(demo.email, demo.collegeId, demo.role);
      if (success) {
        redirectUser(demo.role);
      } else {
        setError('Demo login failed.');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden font-sans">
      {/* Background radial effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/5 dark:bg-blue-600/5 blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 dark:bg-indigo-600/5 blur-[120px] -z-10 pointer-events-none" />

      {/* Floating Header with Theme Toggle */}
      <header className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-blue-500/20">
            C
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            CampusConnect
          </span>
        </div>

        <button
          onClick={toggleTheme}
          type="button"
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all duration-200"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-4xl w-full flex flex-col items-center">
          
          <div className="text-center max-w-xl mb-12">
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-slate-900 dark:text-slate-50">
              Welcome to the Campus Portal
            </h1>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              One platform connecting all system divisions. Choose your role below to log in directly, or expand the manual login if needed.
            </p>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mb-8">
            {/* Student Login Card */}
            <button
              onClick={() => handleQuickLogin('student@collegea.edu')}
              className="group p-5 text-left border border-slate-200 dark:border-slate-850 rounded-2xl bg-white dark:bg-slate-900 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all duration-200 flex items-start gap-4"
            >
              <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1.5">
                  Student Portal <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Anish ΓÇó BSc IT (College A)</p>
              </div>
            </button>

            {/* Teacher Login Card */}
            <button
              onClick={() => handleQuickLogin('teacher@collegeb.edu')}
              className="group p-5 text-left border border-slate-200 dark:border-slate-850 rounded-2xl bg-white dark:bg-slate-900 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-md transition-all duration-200 flex items-start gap-4"
            >
              <div className="h-11 w-11 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <UserIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 flex items-center gap-1.5">
                  Teacher Portal <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Dr. Sarah Jenkins (College B)</p>
              </div>
            </button>

            {/* College Admin Login Card */}
            <button
              onClick={() => handleQuickLogin('admin@collegec.edu')}
              className="group p-5 text-left border border-slate-200 dark:border-slate-850 rounded-2xl bg-white dark:bg-slate-900 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all duration-200 flex items-start gap-4"
            >
              <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <School className="h-5.5 w-5.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center gap-1.5">
                  College Admin <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Dean Marcus Vance (College C)</p>
              </div>
            </button>

            {/* Super Admin Login Card */}
            <button
              onClick={() => handleQuickLogin('super@campusconnect.com')}
              className="group p-5 text-left border border-slate-200 dark:border-slate-850 rounded-2xl bg-white dark:bg-slate-900 hover:border-slate-800 dark:hover:border-slate-300 hover:shadow-md transition-all duration-200 flex items-start gap-4"
            >
              <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5.5 w-5.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-white flex items-center gap-1.5">
                  Super Admin <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">System Administrator</p>
              </div>
            </button>
          </div>

          {/* Toggle Manual Form */}
          <div className="w-full max-w-md mt-4 flex flex-col items-center">
            <button
              onClick={() => setShowManual(!showManual)}
              type="button"
              className="text-xs font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors uppercase tracking-wider mb-4"
            >
              {showManual ? 'Hide Custom Credentials' : 'Or Use Custom Credentials'}
            </button>

            {showManual && (
              <Card className="glass-card shadow-xl p-6 w-full border-slate-200 dark:border-slate-850 bg-white/70 dark:bg-slate-900/70 transition-all duration-300">
                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-xs">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* College Selection */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      College
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['college-a', 'college-b', 'college-c'] as CollegeId[]).map((id) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setCollegeId(id)}
                          className={`py-2 px-1 rounded-lg border text-[10px] font-bold text-center transition-all duration-200 ${
                            collegeId === id
                              ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/20 dark:border-blue-500 dark:text-blue-400 shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                          }`}
                        >
                          {id === 'college-a' && 'College A'}
                          {id === 'college-b' && 'College B'}
                          {id === 'college-c' && 'College C'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      Role
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN'] as UserRole[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          className={`py-2 px-0.5 rounded-lg border text-[8px] font-bold text-center uppercase tracking-wide transition-all duration-200 ${
                            role === r
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-500 dark:text-indigo-400 shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                          }`}
                        >
                          {r.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="name@college.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                      label="Password"
                      type="password"
                      placeholder="ΓÇóΓÇóΓÇóΓÇóΓÇóΓÇóΓÇóΓÇó"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full h-10 rounded-xl text-sm shadow-md mt-2"
                  >
                    Sign In manually
                  </Button>
                </form>
              </Card>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 flex items-center justify-center border-t border-slate-100 dark:border-slate-900 z-10 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
        Campus Connect ΓÇó ┬⌐ 2026
      </footer>
    </div>
  );
}
