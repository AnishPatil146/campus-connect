'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../components/AuthProvider';
import { useTheme } from '../../../components/ThemeProvider';
import { Button, Card, Input } from '@campus-connect/ui';
import { CollegeId, UserRole } from '@campus-connect/types';
import { getCollegeName, getCollegeLogo } from '@campus-connect/utils';
import { AlertCircle, Sun, Moon, User as UserIcon, GraduationCap, School, KeyRound } from 'lucide-react';
import { auth } from '../../../config/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { api } from '../../../utils/api';

export default function Login() {
  const { login, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [collegeId, setCollegeId] = useState<CollegeId>('college-a');
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Sign up states
  const [showSignUp, setShowSignUp] = useState(false);
  const [signUpName, setSignUpName] = useState('');           // Name as per Aadhaar
  const [signUpGmail, setSignUpGmail] = useState('');         // Gmail (login email)
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  // Student-specific
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpSection, setSignUpSection] = useState('A');
  const [signUpRollNo, setSignUpRollNo] = useState('');
  const [signUpAdmissionNo, setSignUpAdmissionNo] = useState('');
  const [signUpGender, setSignUpGender] = useState('Male');
  const [signUpAddress, setSignUpAddress] = useState('');
  const [signUpParentName, setSignUpParentName] = useState('');
  const [signUpParentMobile, setSignUpParentMobile] = useState('');
  // Course (11th / 12th)
  const [signUpCourseType, setSignUpCourseType] = useState<'11' | '12' | 'DEGREE'>('11');
  const [signUpStream, setSignUpStream] = useState('Science');
  const [signUpSubjects, setSignUpSubjects] = useState<string[]>([]);
  // Teacher-specific
  const [signUpDeptId, setSignUpDeptId] = useState('');
  const [signUpMobile, setSignUpMobile] = useState('');

  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Subject lists per stream
  const scienceSubjects = ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Computer Science', 'English'];
  const commerceSubjects = ['Accountancy', 'Business Studies', 'Economics', 'Mathematics', 'Computer Science', 'English'];
  const artsSubjects = ['History', 'Geography', 'Political Science', 'Sociology', 'Psychology', 'English'];

  const getSubjectList = () => {
    if (signUpStream === 'Science') return scienceSubjects;
    if (signUpStream === 'Commerce') return commerceSubjects;
    return artsSubjects;
  };

  const toggleSubject = (sub: string) => {
    setSignUpSubjects(prev =>
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus(null);
    if (!resetEmail) {
      setResetStatus({ type: 'error', text: 'Please enter your email address.' });
      return;
    }
    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetStatus({ 
        type: 'success', 
        text: 'A password reset link has been sent to your email. If you need immediate help, please visit the admin office.' 
      });
    } catch (err: any) {
      console.error(err);
      setResetStatus({ 
        type: 'error', 
        text: 'Failed to send reset email. Please visit the admin office to reset your password.' 
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);
    setSignUpSuccess(null);

    if (!signUpName || !signUpGmail || !signUpPassword) {
      setSignUpError('Name as per Aadhaar, Gmail, and password are required.');
      return;
    }
    if (!/^[^@]+@gmail\.com$/.test(signUpGmail)) {
      setSignUpError('Please enter a valid Gmail address (e.g., name@gmail.com).');
      return;
    }
    if (signUpRole === 'STUDENT' && signUpSubjects.length < 2) {
      setSignUpError('Please select at least 2 subjects.');
      return;
    }

    setIsSigningUp(true);
    try {
      const payload = {
        name: signUpName,
        email: signUpGmail,
        password: signUpPassword,
        role: signUpRole,
        collegeId: collegeId,
        rollNumber: signUpRole === 'STUDENT' ? (signUpRollNo || null) : undefined,
        admissionNumber: signUpRole === 'STUDENT' ? (signUpAdmissionNo || null) : undefined,
        gender: signUpRole === 'STUDENT' ? (signUpGender || null) : undefined,
        mobile: signUpRole === 'STUDENT' ? (signUpPhone || null) : (signUpMobile || null),
        address: signUpRole === 'STUDENT' ? (signUpAddress || null) : undefined,
        parentName: signUpRole === 'STUDENT' ? (signUpParentName || null) : undefined,
        parentMobile: signUpRole === 'STUDENT' ? (signUpParentMobile || null) : undefined,
        divisionId: signUpSection ? `div-${signUpSection.toLowerCase()}` : 'div-a',
        departmentId: signUpRole === 'TEACHER' ? (signUpDeptId || 'dept-id') : undefined,
        // Extra info stored as admissionNumber field if needed
        courseType: signUpRole === 'STUDENT' ? signUpCourseType : undefined,
        stream: signUpRole === 'STUDENT' ? signUpStream : undefined,
        subjects: signUpRole === 'STUDENT' ? signUpSubjects : undefined,
        section: signUpRole === 'STUDENT' ? signUpSection : undefined,
      };

      const resp = await api.register(payload);
      if (resp.success) {
        setSignUpSuccess('Profile created successfully! You can now sign in with your Gmail and password.');
        setSignUpName('');
        setSignUpGmail('');
        setSignUpPassword('');
        setSignUpRollNo('');
        setSignUpAdmissionNo('');
        setSignUpPhone('');
        setSignUpAddress('');
        setSignUpParentName('');
        setSignUpParentMobile('');
        setSignUpDeptId('');
        setSignUpMobile('');
        setSignUpSubjects([]);
        
        setTimeout(() => {
          setShowSignUp(false);
          setEmail(signUpGmail);
          setPassword(signUpPassword);
          setRole(signUpRole);
        }, 2500);
      } else {
        const errorMsg = resp.data?.message || 'Registration failed. Check details.';
        setSignUpError(errorMsg);
      }
    } catch (err: any) {
      setSignUpError(err.message || 'An error occurred during registration.');
    } finally {
      setIsSigningUp(false);
    }
  };

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

    const success = await login(email, collegeId, role, password);
    if (success) {
      redirectUser(role);
    } else {
      setError('Invalid credentials. Check your selected college, role, and details.');
    }
  };

  const redirectUser = (userRole: UserRole) => {
    if (userRole === 'STUDENT') router.push('/dashboard/student');
    else if (userRole === 'TEACHER') router.push('/dashboard/teacher');
    else if (userRole === 'ADMIN') router.push('/dashboard/admin');
  };

  const handleQuickLogin = async (demoEmail: string, demoRole: UserRole, demoCollegeId: CollegeId) => {
    setError(null);
    setEmail(demoEmail);
    setPassword('password123');
    setRole(demoRole);
    setCollegeId(demoCollegeId);

    const success = await login(demoEmail, demoCollegeId, demoRole, 'password123');
    if (success) {
      redirectUser(demoRole);
    } else {
      setError('Demo login failed.');
    }
  };

  const collegeList: { id: CollegeId; name: string }[] = [
    { id: 'college-a', name: "Pushpalata Mhatre Women's College" },
    { id: 'college-b', name: 'Balasaheb Mhatre College (Junior)' },
    { id: 'college-c', name: 'Balasaheb Mhatre College (Senior)' }
  ];

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
          
          <div className="text-center max-w-xl mb-8">
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-slate-900 dark:text-slate-50">
              Welcome to the Campus Portal
            </h1>
            <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Balasaheb Mhatre Education Group Unified Campus Management System
            </p>
          </div>

          <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            
            {/* Left Column: College Selector */}
            <div className="md:col-span-5 flex flex-col gap-3">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Select Your Institution
              </label>
              
              <div className="flex flex-col gap-3 flex-1 justify-between">
                {collegeList.map((col) => {
                  const isSelected = collegeId === col.id;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setCollegeId(col.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center gap-3 bg-white dark:bg-slate-900 hover:shadow-sm ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/10 dark:border-blue-500'
                          : 'border-slate-200 dark:border-slate-850 hover:border-slate-350 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800 p-0.5 bg-white flex items-center justify-center shadow-xs">
                        <img
                          src={getCollegeLogo(col.id)}
                          alt={col.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-250 line-clamp-2">
                        {col.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Main Login Form */}
            <div className="md:col-span-7">
              <Card className="glass-card shadow-xl p-6 border-slate-250/70 dark:border-slate-850 bg-white/70 dark:bg-slate-900/70 flex flex-col justify-between h-full">
                
                {/* Dynamically shown prominent logo */}
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="h-20 w-20 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-850 p-1.5 bg-white shadow-md mb-3 flex items-center justify-center">
                    <img
                      src={getCollegeLogo(collegeId)}
                      alt="Current College Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h3 className="font-bold text-sm text-slate-850 dark:text-slate-150 line-clamp-1">
                    {getCollegeName(collegeId)}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-widest font-semibold">
                    {showSignUp ? 'Create New Profile' : 'Authorized Sign In'}
                  </p>
                </div>

                {showForgotPassword ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="text-center mb-4">
                      <h4 className="font-bold text-sm text-slate-850 dark:text-slate-150 flex items-center justify-center gap-1.5">
                        <KeyRound className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        Password Recovery
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Recover your account via Email or Admin Office
                      </p>
                    </div>

                    {resetStatus && (
                      <div className={`p-3 border rounded-xl flex items-start gap-2 text-[10px] leading-relaxed ${
                        resetStatus.type === 'success' 
                          ? 'bg-emerald-50 border-emerald-250 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400' 
                          : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400'
                      }`}>
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{resetStatus.text}</span>
                      </div>
                    )}

                    <Input
                      label="Your Email Address"
                      type="email"
                      placeholder="Enter registered email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />

                    <Button
                      type="submit"
                      isLoading={isResetting}
                      className="w-full h-10.5 rounded-xl text-xs font-semibold shadow-md bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 border border-transparent mt-1 transition-all"
                    >
                      Send Password Reset Link
                    </Button>

                    <div className="bg-amber-50/50 dark:bg-amber-955/10 border border-amber-250/60 dark:border-amber-900/30 p-3.5 rounded-xl text-[10px] leading-relaxed text-amber-800 dark:text-amber-400 space-y-1 mt-4">
                      <p className="font-bold uppercase tracking-wider">Need immediate reset?</p>
                      <p>Please visit the <b>Admin Office</b> to reset your password directly. The system administrator can change your credentials instantly.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors pt-2 block"
                    >
                      Back to Sign In
                    </button>
                  </form>
                ) : showSignUp ? (
                  <form onSubmit={handleSignUpSubmit} className="space-y-4">
                    <div className="text-center mb-2">
                      <h4 className="font-bold text-sm text-slate-850 dark:text-slate-150 flex items-center justify-center gap-1.5">
                        <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        Create New Profile
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Join your college community portal
                      </p>
                    </div>

                    {signUpError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-xs">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{signUpError}</span>
                      </div>
                    )}

                    {signUpSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-250 rounded-xl flex items-start gap-2 text-emerald-700 text-xs">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{signUpSuccess}</span>
                      </div>
                    )}

                    <div className="max-h-[340px] overflow-y-auto pr-1 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                      {/* Role Selector */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          I am a
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-105 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800">
                          {(['STUDENT', 'TEACHER'] as const).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setSignUpRole(r)}
                              className={`py-1.5 rounded-lg text-[9px] font-bold text-center uppercase tracking-wide transition-all duration-150 ${
                                signUpRole === r
                                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/40 dark:border-slate-800/40'
                                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ── IDENTITY ── */}
                      <div className="pt-1 pb-0.5 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Identity</p>
                      </div>

                      <Input
                        label="Full Name (as per Aadhaar Card)"
                        placeholder="e.g. Rahul Anish Patil"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                      />

                      <Input
                        label="Gmail Address"
                        type="email"
                        placeholder="yourname@gmail.com"
                        value={signUpGmail}
                        onChange={(e) => setSignUpGmail(e.target.value)}
                      />

                      <Input
                        label="Password"
                        type="password"
                        placeholder="Min 6 characters"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                      />

                      {/* ── STUDENT FIELDS ── */}
                      {signUpRole === 'STUDENT' ? (
                        <>
                          {/* Course / Class */}
                          <div className="pt-1 pb-0.5 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Class & Course</p>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              Class
                            </label>
                            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-105 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800">
                              {(['11', '12', 'DEGREE'] as const).map((ct) => (
                                <button
                                  key={ct}
                                  type="button"
                                  onClick={() => { setSignUpCourseType(ct); setSignUpSubjects([]); }}
                                  className={`py-1.5 rounded-lg text-[9px] font-bold text-center uppercase tracking-wide transition-all duration-150 ${
                                    signUpCourseType === ct
                                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/40 dark:border-slate-800/40'
                                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                  }`}
                                >
                                  {ct === 'DEGREE' ? 'Degree' : `${ct}th`}
                                </button>
                              ))}
                            </div>
                          </div>

                          {signUpCourseType !== 'DEGREE' && (
                            <div>
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                Stream
                              </label>
                              <select
                                value={signUpStream}
                                onChange={(e) => { setSignUpStream(e.target.value); setSignUpSubjects([]); }}
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="Science">Science</option>
                                <option value="Commerce">Commerce</option>
                                <option value="Arts">Arts</option>
                              </select>
                            </div>
                          )}

                          {signUpCourseType !== 'DEGREE' && (
                            <div>
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                                Subjects <span className="text-slate-400 font-normal normal-case">(select all you study)</span>
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {getSubjectList().map((sub) => (
                                  <button
                                    key={sub}
                                    type="button"
                                    onClick={() => toggleSubject(sub)}
                                    className={`px-2.5 py-1 rounded-lg text-[9px] font-semibold border transition-all duration-150 ${
                                      signUpSubjects.includes(sub)
                                        ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500 text-white'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-400'
                                    }`}
                                  >
                                    {sub}
                                  </button>
                                ))}
                              </div>
                              {signUpSubjects.length > 0 && (
                                <p className="text-[9px] text-slate-400 mt-1.5">{signUpSubjects.length} subject(s) selected</p>
                              )}
                            </div>
                          )}

                          {/* Contact */}
                          <div className="pt-1 pb-0.5 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Contact & Class Info</p>
                          </div>

                          <Input
                            label="Phone Number"
                            type="tel"
                            placeholder="+91 9876543210"
                            value={signUpPhone}
                            onChange={(e) => setSignUpPhone(e.target.value)}
                          />

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                Section
                              </label>
                              <select
                                value={signUpSection}
                                onChange={(e) => setSignUpSection(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                {['A', 'B', 'C', 'D', 'E'].map(s => (
                                  <option key={s} value={s}>Section {s}</option>
                                ))}
                              </select>
                            </div>
                            <Input
                              label="Roll Number"
                              placeholder="e.g. 42"
                              value={signUpRollNo}
                              onChange={(e) => setSignUpRollNo(e.target.value)}
                            />
                          </div>

                          <Input
                            label="Admission Number"
                            placeholder="ADM-2026-089"
                            value={signUpAdmissionNo}
                            onChange={(e) => setSignUpAdmissionNo(e.target.value)}
                          />

                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              Gender
                            </label>
                            <select
                              value={signUpGender}
                              onChange={(e) => setSignUpGender(e.target.value)}
                              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          {/* Parent Info */}
                          <div className="pt-1 pb-0.5 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Parent / Guardian Info</p>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              label="Parent Name"
                              placeholder="Ramesh Patil"
                              value={signUpParentName}
                              onChange={(e) => setSignUpParentName(e.target.value)}
                            />
                            <Input
                              label="Parent Phone"
                              placeholder="+91 9876543211"
                              value={signUpParentMobile}
                              onChange={(e) => setSignUpParentMobile(e.target.value)}
                            />
                          </div>

                          <Input
                            label="Residential Address"
                            placeholder="Flat 101, Star Heights, Thane"
                            value={signUpAddress}
                            onChange={(e) => setSignUpAddress(e.target.value)}
                          />
                        </>
                      ) : (
                        <>
                          {/* Teacher fields */}
                          <div className="pt-1 pb-0.5 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Professional Details</p>
                          </div>

                          <Input
                            label="Phone Number"
                            type="tel"
                            placeholder="+91 9876543210"
                            value={signUpMobile}
                            onChange={(e) => setSignUpMobile(e.target.value)}
                          />

                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              Department
                            </label>
                            <select
                              value={signUpDeptId}
                              onChange={(e) => setSignUpDeptId(e.target.value)}
                              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">Select Department</option>
                              <option value="dept-cs">Computer Science</option>
                              <option value="dept-it">Information Technology</option>
                              <option value="dept-science">Science</option>
                              <option value="dept-commerce">Commerce</option>
                              <option value="dept-arts">Arts</option>
                              <option value="dept-maths">Mathematics</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>

                    <Button
                      type="submit"
                      isLoading={isSigningUp}
                      className="w-full h-10.5 rounded-xl text-xs font-semibold shadow-md bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 border border-transparent mt-1 transition-all"
                    >
                      Create Profile
                    </Button>

                    <button
                      type="button"
                      onClick={() => setShowSignUp(false)}
                      className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors pt-1 block"
                    >
                      Already have an account? Sign In
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-xs">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Hidden inputs to support autofill role */}
                    <div className="space-y-3.5">
                      {/* Role selector tabs */}
                      <div>
                        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-105 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800">
                          {(['STUDENT', 'TEACHER', 'ADMIN'] as UserRole[]).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setRole(r)}
                              className={`py-1.5 rounded-lg text-[9px] font-bold text-center uppercase tracking-wide transition-all duration-150 ${
                                role === r
                                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/40 dark:border-slate-800/40'
                                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                              }`}
                            >
                              {r.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Input
                        label="Email Address"
                        type="email"
                        placeholder="anish@college.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Password</label>
                          <button
                            type="button"
                            onClick={() => {
                              setResetEmail(email);
                              setShowForgotPassword(true);
                              setResetStatus(null);
                            }}
                            className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      isLoading={isLoading}
                      className="w-full h-10.5 rounded-xl text-xs font-semibold shadow-md bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 border border-transparent mt-2 transition-all"
                    >
                      Sign In to Portal
                    </Button>

                    <button
                      type="button"
                      onClick={() => setShowSignUp(true)}
                      className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors pt-2 block"
                    >
                      New here? Create New Profile
                    </button>
                  </form>
                )}

              </Card>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 flex items-center justify-center border-t border-slate-100 dark:border-slate-900 z-10 text-[10px] font-semibold text-slate-450 uppercase tracking-wider">
        Campus Connect • © 2026
      </footer>
    </div>
  );
}
