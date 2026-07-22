'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';
import { useLoading } from './LoadingProvider';
import { Button } from '@campus-connect/ui';
import { CollegeId, UserRole } from '@campus-connect/types';
import { 
  AlertCircle, 
  Sun, 
  Moon, 
  User as UserIcon, 
  GraduationCap, 
  School, 
  Lock, 
  Eye, 
  EyeOff, 
  Shield 
} from 'lucide-react';
import { auth, googleProvider } from '../config/firebase';
import { sendPasswordResetEmail, signInWithPopup } from 'firebase/auth';
import { api } from '../utils/api';

export default function LoginContainer({ initialRole, brandingMessage }: { initialRole?: UserRole; brandingMessage?: string }) {
  const { login, loginWithGoogle, isLoading } = useAuth();
  const { theme, toggleTheme, setRole: setGlobalRole } = useTheme();
  const { startLoading, stopLoading } = useLoading();
  const router = useRouter();

  const [collegeId, setCollegeId] = useState<CollegeId>('college-a');
  const [role, setRole] = useState<UserRole>(initialRole || 'STUDENT');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Custom password visibility toggle
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Sign up states
  const [showSignUp, setShowSignUp] = useState(false);
  const [signUpFirstName, setSignUpFirstName] = useState('');
  const [signUpSurname, setSignUpSurname] = useState('');
  const [signUpGmail, setSignUpGmail] = useState('');         // Gmail (login email)
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  
  // Student-specific required fields
  const [signUpClassroom, setSignUpClassroom] = useState('Division A');
  const [signUpRollNo, setSignUpRollNo] = useState('');
  const [signUpDegree, setSignUpDegree] = useState('BSc IT'); // Used for Student degree or Teacher degree
  const [signUpSemester, setSignUpSemester] = useState('Semester 1');

  // Other Student-specific fields
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpAdmissionNo, setSignUpAdmissionNo] = useState('');
  const [signUpAddress, setSignUpAddress] = useState('');
  const [signUpMotherName, setSignUpMotherName] = useState('');
  const [signUpFatherName, setSignUpFatherName] = useState('');
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

  // Onboarding flow states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingEmail, setOnboardingEmail] = useState('');
  const [onboardingName, setOnboardingName] = useState('');
  const [onboardingRole, setOnboardingRole] = useState<UserRole>('STUDENT');
  const [onboardingPrn, setOnboardingPrn] = useState('');
  const [onboardingCourse, setOnboardingCourse] = useState<'11' | '12' | 'DEGREE'>('DEGREE');
  const [onboardingSemester, setOnboardingSemester] = useState('Semester 1');
  const [onboardingDegree, setOnboardingDegree] = useState('BSc IT');
  const [onboardingClassroom, setOnboardingClassroom] = useState('Division A');
  const [onboardingEmployeeId, setOnboardingEmployeeId] = useState('');
  const [onboardingDepartment, setOnboardingDepartment] = useState('');
  const [showPendingApproval, setShowPendingApproval] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [isOnboardingSubmitting, setIsOnboardingSubmitting] = useState(false);

  // Sync selected role to theme provider and prefetch dashboard routes
  React.useEffect(() => {
    const activeRole = showOnboarding ? onboardingRole : (showSignUp ? signUpRole : role);
    setGlobalRole(activeRole.toLowerCase() as any);
    
    // Prefetch target dashboard routes for instant page transitions after login
    router.prefetch('/dashboard/student');
    router.prefetch('/dashboard/teacher');
    router.prefetch('/dashboard/admin');
  }, [role, signUpRole, showSignUp, showOnboarding, onboardingRole, setGlobalRole, router]);

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

  const handleGoogleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsGoogleLoading(true);
    startLoading("Authenticating with Google...");

    try {
      // Trigger the real Google OAuth popup via static Firebase import (instant response)
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email || '';
      const displayName = result.user.displayName || '';
      // Get the real Firebase ID token to send to our backend
      const idToken = await result.user.getIdToken();

      try {
        const success = await loginWithGoogle(idToken, collegeId, role);
        if (success) {
          redirectUser(role);
        } else {
          setError('Google login failed. Make sure your Google account email is registered in this college and matches the selected role.');
          stopLoading();
        }
      } catch (err: any) {
        stopLoading();
        if (err.errorCode === 'AUTH_007') {
          // Unregistered Google user -> start onboarding!
          setOnboardingRole(role);
          setOnboardingEmail(email);
          setOnboardingName(displayName || email.split('@')[0]);
          setShowOnboarding(true);
        } else {
          setError(err.message || 'Google sign-in failed. Please try again.');
        }
      }
    } catch (err: any) {
      stopLoading();
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User closed the popup — not an error
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this site and try again.');
      } else {
        setError('Google sign-in failed. Please try again or use email/password login.');
        console.error('[Google Login]', err);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingError(null);
    setIsOnboardingSubmitting(true);

    try {
      const derivedPassword = Math.random().toString(36).substring(2, 10);
      const emailPrefix = onboardingEmail.split('@')[0];
      const derivedFirstName = onboardingName.split(' ')[0] || emailPrefix;
      const derivedSurname = onboardingName.split(' ')[1] || 'User';

      const payload = {
        name: onboardingName || `${derivedFirstName} ${derivedSurname}`.trim(),
        firstName: derivedFirstName,
        lastName: derivedSurname,
        surname: derivedSurname,
        email: onboardingEmail,
        password: derivedPassword,
        role: onboardingRole,
        collegeId: collegeId,
        rollNumber: onboardingRole === 'STUDENT' ? (onboardingPrn || `ROLL-${Date.now()}`) : undefined,
        admissionNumber: onboardingRole === 'STUDENT' ? `ADM-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
        gender: onboardingRole === 'STUDENT' ? 'Male' : undefined,
        mobile: 'N/A',
        divisionId: onboardingRole === 'STUDENT' ? (onboardingClassroom === 'Division B' ? 'div-b' : 'div-a') : undefined,
        departmentId: onboardingRole === 'TEACHER' ? onboardingDepartment : undefined,
        courseType: onboardingRole === 'STUDENT' ? onboardingCourse : undefined,
        semester: onboardingRole === 'STUDENT' ? onboardingSemester : undefined,
        classroom: onboardingRole === 'STUDENT' ? onboardingClassroom : undefined,
        degree: onboardingRole === 'STUDENT' ? onboardingDegree : undefined,
        employeeId: onboardingRole === 'TEACHER' ? onboardingEmployeeId : undefined,
      };

      const resp = await api.register(payload);
      if (resp.success) {
        setShowPendingApproval(true);
      } else {
        setOnboardingError(resp.data?.message || 'Onboarding submission failed.');
      }
    } catch (err: any) {
      setOnboardingError(err.message || 'An error occurred during onboarding.');
    } finally {
      setIsOnboardingSubmitting(false);
    }
  };


  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);
    setSignUpSuccess(null);

    if (!signUpGmail || !signUpPassword) {
      setSignUpError('Gmail and Password are required.');
      return;
    }
    if (!/^[^@]+@gmail\.com$/.test(signUpGmail)) {
      setSignUpError('Please enter a valid Gmail address (e.g., name@gmail.com).');
      return;
    }

    setIsSigningUp(true);
    try {
      const emailPrefix = signUpGmail.split('@')[0];
      const derivedFirstName = signUpFirstName || emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      const derivedSurname = signUpSurname || 'Student';

      const payload = {
        name: `${derivedFirstName} ${derivedSurname}`.trim(),
        firstName: derivedFirstName,
        lastName: derivedSurname,
        surname: derivedSurname,
        email: signUpGmail,
        password: signUpPassword,
        role: signUpRole,
        collegeId: collegeId,
        rollNumber: signUpRole === 'STUDENT' ? (signUpRollNo || `ROLL-${Date.now()}`) : undefined,
        admissionNumber: signUpRole === 'STUDENT' ? (signUpAdmissionNo || `ADM-${Math.floor(100000 + Math.random() * 900000)}`) : undefined,
        gender: signUpRole === 'STUDENT' ? 'Male' : undefined,
        mobile: signUpRole === 'STUDENT' ? (signUpPhone || 'N/A') : (signUpMobile || 'N/A'),
        address: signUpRole === 'STUDENT' ? (signUpAddress || 'N/A') : undefined,
        parentName: signUpRole === 'STUDENT' ? `Father: ${signUpFatherName || 'N/A'}, Mother: ${signUpMotherName || 'N/A'}` : undefined,
        motherName: signUpRole === 'STUDENT' ? (signUpMotherName || 'N/A') : undefined,
        fatherName: signUpRole === 'STUDENT' ? (signUpFatherName || 'N/A') : undefined,
        parentMobile: signUpRole === 'STUDENT' ? (signUpParentMobile || 'N/A') : undefined,
        divisionId: signUpRole === 'STUDENT' ? (signUpClassroom === 'Division B' ? 'div-b' : 'div-a') : undefined,
        departmentId: signUpRole === 'TEACHER' ? (signUpDeptId || 'dept-id') : undefined,
        courseType: signUpRole === 'STUDENT' ? signUpCourseType : undefined,
        stream: signUpRole === 'STUDENT' ? signUpStream : undefined,
        subjects: signUpRole === 'STUDENT' ? (signUpCourseType === 'DEGREE' ? [signUpDegree] : signUpSubjects.length > 0 ? signUpSubjects : ['English']) : undefined,
        semester: signUpRole === 'STUDENT' ? signUpSemester : undefined,
        classroom: signUpRole === 'STUDENT' ? signUpClassroom : undefined,
        degree: signUpRole === 'STUDENT' ? signUpDegree : (signUpRole === 'TEACHER' ? signUpDegree : undefined),
      };

      const resp = await api.register(payload);
      if (resp.success) {
        setSignUpSuccess('Profile created successfully! Confirmation email has been sent.');
        setSignUpFirstName('');
        setSignUpSurname('');
        setSignUpGmail('');
        setSignUpPassword('');
        setSignUpRollNo('');
        setSignUpClassroom('Division A');
        setSignUpDegree('BSc IT');
        setSignUpSemester('Semester 1');
        setSignUpAdmissionNo('');
        setSignUpPhone('');
        setSignUpAddress('');
        setSignUpMotherName('');
        setSignUpFatherName('');
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

    startLoading("Signing you in...");
    try {
      const success = await login(email, collegeId, role, password);
      if (success) {
        redirectUser(role);
      } else {
        setError('Invalid credentials. Check your selected college, role, and details.');
        stopLoading();
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Check your selected college, role, and details.');
      stopLoading();
    }
  };

  const redirectUser = (userRole: UserRole) => {
    if (userRole === 'STUDENT') router.push('/dashboard/student');
    else if (userRole === 'TEACHER') router.push('/dashboard/teacher');
    else if (userRole === 'ADMIN') router.push('/dashboard/admin');
  };

  const collegeList: { id: CollegeId; name: string }[] = [
    { id: 'college-a', name: "Pushpalata Mhatre Women's College" },
    { id: 'college-b', name: 'Balasaheb Mhatre College (Junior)' },
    { id: 'college-c', name: 'Balasaheb Mhatre College (Senior)' }
  ];

  const rolesConfig = [
    {
      role: 'STUDENT' as UserRole,
      label: 'Student',
      icon: GraduationCap,
      colorClass: 'text-blue-500 dark:text-blue-400',
      selectedBorderClass: 'border-blue-500 dark:border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]',
      selectedBgClass: 'bg-blue-500/5 dark:bg-blue-950/20',
      selectedIconClass: 'text-blue-600 dark:text-blue-400',
      selectedLabelClass: 'text-blue-600 dark:text-blue-400'
    },
    {
      role: 'TEACHER' as UserRole,
      label: 'Teacher',
      icon: UserIcon,
      colorClass: 'text-emerald-500 dark:text-emerald-400',
      selectedBorderClass: 'border-emerald-500 dark:border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]',
      selectedBgClass: 'bg-emerald-500/5 dark:bg-emerald-950/20',
      selectedIconClass: 'text-emerald-600 dark:text-emerald-400',
      selectedLabelClass: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      role: 'ADMIN' as UserRole,
      label: 'Admin',
      icon: Shield,
      colorClass: 'text-purple-500 dark:text-purple-400',
      selectedBorderClass: 'border-purple-500 dark:border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]',
      selectedBgClass: 'bg-purple-500/5 dark:bg-purple-950/20',
      selectedIconClass: 'text-purple-600 dark:text-purple-400',
      selectedLabelClass: 'text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-role-bg text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden font-sans">
      {/* Background radial effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-role-login-glow/5 blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-role-login-glow/5 blur-[120px] -z-10 pointer-events-none" />

      {/* Floating Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          type="button"
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all duration-205 cursor-pointer"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 z-10">
        <div className="w-full max-w-5xl bg-role-card-bg dark:bg-slate-900/40 rounded-[2rem] shadow-2xl overflow-hidden border border-role-border dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 min-h-[760px] transition-all">
          
          {/* Left Column (Hero Welcome Banner) */}
          <div className="hidden md:flex md:col-span-5 flex-col justify-between p-10 text-white relative overflow-hidden rounded-l-[1.95rem]">
            {/* Premium Full-Height Background Image */}
            <div className="absolute inset-0 w-full h-full select-none pointer-events-none z-0">
              <img 
                src="/campus_dusk.png" 
                alt="Campus Skyline" 
                className="w-full h-full object-cover object-center opacity-70 transition-transform duration-700 hover:scale-105"
              />
            </div>

            {/* Role-specific Premium Gradient Overlay */}
            <div className={`absolute inset-0 z-10 transition-colors duration-500 opacity-90 ${
              role === 'STUDENT' ? 'bg-gradient-to-b from-blue-950/75 via-slate-950/85 to-[#020817]/95' :
              role === 'TEACHER' ? 'bg-gradient-to-b from-emerald-950/75 via-slate-950/85 to-[#020817]/95' :
              'bg-gradient-to-b from-purple-950/75 via-slate-950/85 to-[#020817]/95'
            }`} />

            {/* Soft highlight */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_60%)] pointer-events-none z-20" />
            
            {/* Top Logo branding */}
            <div className="z-30 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="font-display font-extrabold text-sm tracking-tight text-white block animate-pulse">
                  Campus Connect
                </span>
                <span className="text-[9px] text-white/50 font-semibold tracking-wider uppercase block -mt-0.5">
                  Smart Campus. Better Future.
                </span>
              </div>
            </div>

            {/* Title / Description */}
            <div className="z-30 my-auto py-8 space-y-4">
              <h1 className="font-display font-extrabold text-3xl leading-tight">
                {brandingMessage ? (
                  brandingMessage
                ) : (
                  <>
                     Welcome to <br />
                     <span className="text-white">Campus </span>
                     <span className="text-white/80">Connect</span>
                  </>
                )}
              </h1>
              <p className="text-[11px] text-white/70 leading-relaxed font-normal max-w-[240px]">
                {role === 'STUDENT' ? 'Access your lectures, check attendance, download learning notes, and track your performance index.' :
                 role === 'TEACHER' ? 'Manage attendance, publish assignments, grade student submissions, and upload notes.' :
                 'Manage college departments, courses, student and teacher databases, timetable slots, and system settings.'}
              </p>
              <div className="h-[2px] w-8 bg-white/40 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Right Column (Forms Panel) */}
          <div className="col-span-12 md:col-span-7 flex flex-col justify-center p-6 sm:p-10 md:p-12 bg-white dark:bg-slate-900 transition-colors">
            
            {showPendingApproval ? (
              /* ONBOARDING PENDING APPROVAL SCREEN */
              <div className="space-y-6 text-center py-6 animate-fade-in">
                <div className="mx-auto w-16 h-16 bg-blue-500/10 dark:bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/25">
                  <Shield className="h-8 w-8 text-blue-500 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-display font-extrabold text-2xl tracking-tight text-slate-900 dark:text-slate-50">
                    Awaiting Approval
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Your profile has been created successfully for <b className="font-semibold text-slate-700 dark:text-slate-300">{onboardingEmail}</b>. 
                    An administrator will verify your credentials and approve access shortly.
                  </p>
                </div>
                <div className="pt-4">
                  <Button
                    onClick={() => {
                      setShowPendingApproval(false);
                      setShowOnboarding(false);
                    }}
                    className="h-11 px-8 rounded-xl text-xs font-semibold shadow-md bg-role-primary hover:bg-role-secondary text-white border-transparent transition-all cursor-pointer"
                  >
                    Back to Sign In
                  </Button>
                </div>
              </div>

            ) : showOnboarding ? (
              /* GOOGLE ONBOARDING DETAILS FORM */
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="font-display font-extrabold text-2xl tracking-tight text-slate-900 dark:text-slate-50">
                    Onboarding Details
                  </h2>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Provide the remaining details to complete your profile registration.
                  </p>
                </div>

                {onboardingError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span>{onboardingError}</span>
                  </div>
                )}

                <form onSubmit={handleOnboardingSubmit} className="space-y-4">
                  <div className="max-h-[460px] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    
                    {/* Display Prefilled Info */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 flex flex-col gap-1 text-xs">
                      <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">Google Account</p>
                      <p className="font-semibold text-slate-850 dark:text-slate-200">{onboardingName}</p>
                      <p className="text-slate-500 dark:text-slate-400">{onboardingEmail}</p>
                      <p className="text-[10px] font-bold text-role-primary uppercase tracking-wider mt-1.5">Role: {onboardingRole}</p>
                    </div>

                    {onboardingRole === 'STUDENT' ? (
                      /* Student Onboarding Fields */
                      <>
                        <div className="space-y-1.5 animate-fade-in">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">PRN / Roll Number</label>
                          <input
                            type="text"
                            required
                            placeholder="Enter your PRN or Roll Number"
                            value={onboardingPrn}
                            onChange={(e) => setOnboardingPrn(e.target.value)}
                            className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 font-medium"
                          />
                        </div>

                        <div className="space-y-1.5 animate-fade-in">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Class / Program Type</label>
                          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700">
                            {(['11', '12', 'DEGREE'] as const).map((ct) => (
                              <button
                                key={ct}
                                type="button"
                                onClick={() => setOnboardingCourse(ct)}
                                className={`py-1.5 rounded-lg text-[10px] font-bold text-center uppercase tracking-wide transition-all duration-150 cursor-pointer ${
                                  onboardingCourse === ct
                                    ? 'bg-white dark:bg-slate-900 text-role-primary shadow-sm border border-slate-200/40 dark:border-slate-700'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent'
                                }`}
                              >
                                {ct === 'DEGREE' ? 'Degree' : `${ct}th`}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5 animate-fade-in">
                          {onboardingCourse === 'DEGREE' ? (
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Select Degree</label>
                              <select
                                value={onboardingDegree}
                                onChange={(e) => setOnboardingDegree(e.target.value)}
                                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                              >
                                <option value="BSc IT">BSc IT</option>
                                <option value="BMS">BMS</option>
                                <option value="BCom">BCom</option>
                                <option value="BSc CS">BSc CS</option>
                                <option value="BA">BA</option>
                              </select>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Classroom / Division</label>
                              <select
                                value={onboardingClassroom}
                                onChange={(e) => setOnboardingClassroom(e.target.value)}
                                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                              >
                                <option value="Division A">Division A</option>
                                <option value="Division B">Division B</option>
                              </select>
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Semester</label>
                            <select
                              value={onboardingSemester}
                              onChange={(e) => setOnboardingSemester(e.target.value)}
                              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                              <option value="Semester 1">Semester 1</option>
                              <option value="Semester 2">Semester 2</option>
                              {onboardingCourse === 'DEGREE' && (
                                <>
                                  <option value="Semester 3">Semester 3</option>
                                  <option value="Semester 4">Semester 4</option>
                                  <option value="Semester 5">Semester 5</option>
                                  <option value="Semester 6">Semester 6</option>
                                </>
                              )}
                            </select>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Teacher Onboarding Fields */
                      <>
                        <div className="space-y-1.5 animate-fade-in">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider block">Employee ID</label>
                          <input
                            type="text"
                            required
                            placeholder="Enter your Employee ID"
                            value={onboardingEmployeeId}
                            onChange={(e) => setOnboardingEmployeeId(e.target.value)}
                            className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 font-medium"
                          />
                        </div>

                        <div className="space-y-1.5 animate-fade-in">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider block">Department</label>
                          <select
                            required
                            value={onboardingDepartment}
                            onChange={(e) => setOnboardingDepartment(e.target.value)}
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="">Select Department</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Information Technology">Information Technology</option>
                            <option value="Science">Science</option>
                            <option value="Commerce">Commerce</option>
                            <option value="Arts">Arts</option>
                            <option value="Mathematics">Mathematics</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  <Button
                    type="submit"
                    isLoading={isOnboardingSubmitting}
                    className="w-full h-11 rounded-xl text-xs font-semibold shadow-md bg-role-primary hover:bg-role-secondary text-white border-transparent transition-all mt-2 cursor-pointer"
                  >
                    Complete Onboarding
                  </Button>

                  <button
                    type="button"
                    onClick={() => setShowOnboarding(false)}
                    className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors pt-1 block cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              </div>

            ) : showForgotPassword ? (
              /* PASSWORD RECOVERY FORM */
              <div className="space-y-6">
                <div>
                  <h2 className="font-display font-extrabold text-2xl tracking-tight text-slate-900 dark:text-slate-50 animate-fade-in">
                    Password Recovery
                  </h2>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Recover your account via Email or Admin Office
                  </p>
                </div>

                {resetStatus && (
                  <div className={`p-4 border rounded-xl flex items-start gap-3 text-xs leading-relaxed ${
                    resetStatus.type === 'success' 
                      ? 'bg-emerald-50 border-emerald-250 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400' 
                      : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400'
                  }`}>
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span>{resetStatus.text}</span>
                  </div>
                )}

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-505">
                        <UserIcon className="h-5 w-5" />
                      </div>
                      <input
                        type="email"
                        placeholder="Enter registered email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-450 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 font-medium"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    isLoading={isResetting}
                    className="w-full h-11 rounded-xl text-xs font-semibold shadow-md bg-role-primary hover:bg-role-secondary text-white border-transparent transition-all"
                  >
                    Send Password Reset Link
                  </Button>

                  <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-250/60 dark:border-amber-900/30 p-4 rounded-xl text-xs leading-relaxed text-amber-800 dark:text-amber-400 space-y-1.5 mt-4 animate-pulse">
                    <p className="font-bold uppercase tracking-wider text-[10px]">Need immediate reset?</p>
                    <p>Please visit the <b className="font-semibold">Admin Office</b> to reset your password directly. The system administrator can change your credentials instantly.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors pt-2 block"
                  >
                    Back to Sign In
                  </button>
                </form>
              </div>

            ) : showSignUp ? (
              /* SIGN UP FORM (CREATE PROFILE) */
              <div className="space-y-6">
                <div>
                  <h2 className="font-display font-extrabold text-2xl tracking-tight text-slate-900 dark:text-slate-50">
                    Create New Profile
                  </h2>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Join your college community portal
                  </p>
                </div>

                {signUpError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span>{signUpError}</span>
                  </div>
                )}

                {signUpSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-250 rounded-xl flex items-start gap-2.5 text-emerald-700 text-xs">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span>{signUpSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSignUpSubmit} className="space-y-4">
                  <div className="max-h-[500px] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    
                    {/* SignUp Role Selection Tabs */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        I am a
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700">
                        {(['STUDENT', 'TEACHER'] as const).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setSignUpRole(r)}
                            className={`py-2 rounded-lg text-[10px] font-bold text-center uppercase tracking-wide transition-all duration-150 cursor-pointer ${
                              signUpRole === r
                                ? 'bg-white dark:bg-slate-900 text-role-primary shadow-sm border border-slate-200/40 dark:border-slate-700'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Identity Details Header */}
                    <div className="pt-2 pb-1 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest">Identity & Credentials</p>
                    </div>

                    {/* Institution Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                        Institution / College
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-505">
                          <School className="h-5 w-5" />
                        </div>
                        <select
                          value={collegeId}
                          onChange={(e) => setCollegeId(e.target.value as CollegeId)}
                          className="flex h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-8 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 appearance-none font-medium cursor-pointer"
                        >
                          {collegeList.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-450">
                          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      {/* First Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">First Name</label>
                        <input
                          type="text"
                          placeholder="Rahul"
                          value={signUpFirstName}
                          onChange={(e) => setSignUpFirstName(e.target.value)}
                          className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 font-medium"
                        />
                      </div>
                      {/* Surname */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Surname</label>
                        <input
                          type="text"
                          placeholder="Patil"
                          value={signUpSurname}
                          onChange={(e) => setSignUpSurname(e.target.value)}
                          className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 font-medium"
                        />
                      </div>
                    </div>

                    {/* Gmail */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Gmail Address</label>
                      <input
                        type="email"
                        placeholder="yourname@gmail.com"
                        value={signUpGmail}
                        onChange={(e) => setSignUpGmail(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 font-medium"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Password</label>
                      <input
                        type="password"
                        placeholder="Min 6 characters"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 font-medium"
                      />
                    </div>

                    {/* STUDENT-SPECIFIC FIELDS */}
                    {signUpRole === 'STUDENT' ? (
                      <>
                        <div className="pt-2 pb-1 border-t border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest">Contact & Parent Details</p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Student Phone Number</label>
                          <input
                            type="text"
                            placeholder="e.g. +91 9876543210"
                            value={signUpPhone}
                            onChange={(e) => setSignUpPhone(e.target.value)}
                            className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 font-medium"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Father's Name</label>
                            <input
                              type="text"
                              placeholder="Father's Name"
                              value={signUpFatherName}
                              onChange={(e) => setSignUpFatherName(e.target.value)}
                              className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 font-medium"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Mother's Name</label>
                            <input
                              type="text"
                              placeholder="Mother's Name"
                              value={signUpMotherName}
                              onChange={(e) => setSignUpMotherName(e.target.value)}
                              className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 font-medium"
                            />
                          </div>
                        </div>

                        <div className="pt-2 pb-1 border-t border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest">Classroom & Roll Number</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Classroom / Division</label>
                            <select
                              value={signUpClassroom}
                              onChange={(e) => setSignUpClassroom(e.target.value)}
                              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="Division A">Division A</option>
                              <option value="Division B">Division B</option>
                              <option value="Division C">Division C</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Roll Number</label>
                            <input
                              type="text"
                              placeholder="e.g. 42"
                              value={signUpRollNo}
                              onChange={(e) => setSignUpRollNo(e.target.value)}
                              className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 font-medium"
                            />
                          </div>
                        </div>

                        <div className="pt-2 pb-1 border-t border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest">Program & Semester</p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Class / Program Type</label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700">
                            {(['11', '12', 'DEGREE'] as const).map((ct) => (
                              <button
                                key={ct}
                                type="button"
                                onClick={() => { setSignUpCourseType(ct); setSignUpSubjects([]); }}
                                className={`py-1.5 rounded-lg text-[10px] font-bold text-center uppercase tracking-wide transition-all duration-150 cursor-pointer ${
                                  signUpCourseType === ct
                                    ? 'bg-white dark:bg-slate-900 text-role-primary shadow-sm border border-slate-200/40 dark:border-slate-700'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent'
                                }`}
                              >
                                {ct === 'DEGREE' ? 'Degree' : `${ct}th`}
                              </button>
                            ))}
                          </div>
                        </div>

                        {signUpCourseType === 'DEGREE' ? (
                          <div className="grid grid-cols-2 gap-3.5">
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Select Degree</label>
                              <select
                                value={signUpDegree}
                                onChange={(e) => setSignUpDegree(e.target.value)}
                                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="BSc IT">BSc IT</option>
                                <option value="BMS">BMS</option>
                                <option value="BCom">BCom</option>
                                <option value="BSc CS">BSc CS</option>
                                <option value="BA">BA</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Semester</label>
                              <select
                                value={signUpSemester}
                                onChange={(e) => setSignUpSemester(e.target.value)}
                                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 animate-fade-in"
                              >
                                <option value="Semester 1">Semester 1</option>
                                <option value="Semester 2">Semester 2</option>
                                <option value="Semester 3">Semester 3</option>
                                <option value="Semester 4">Semester 4</option>
                                <option value="Semester 5">Semester 5</option>
                                <option value="Semester 6">Semester 6</option>
                              </select>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 gap-3.5">
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Stream</label>
                                <select
                                  value={signUpStream}
                                  onChange={(e) => { setSignUpStream(e.target.value); setSignUpSubjects([]); }}
                                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="Science">Science</option>
                                  <option value="Commerce">Commerce</option>
                                  <option value="Arts">Arts</option>
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Semester</label>
                                <select
                                  value={signUpSemester}
                                  onChange={(e) => setSignUpSemester(e.target.value)}
                                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="Semester 1">Semester 1</option>
                                  <option value="Semester 2">Semester 2</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                                Subjects <span className="text-slate-400 font-normal normal-case">(select all you study)</span>
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {getSubjectList().map((sub) => (
                                  <button
                                    key={sub}
                                    type="button"
                                    onClick={() => toggleSubject(sub)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all duration-150 cursor-pointer ${
                                      signUpSubjects.includes(sub)
                                        ? 'bg-role-primary border-role-primary text-white'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:border-role-primary'
                                    }`}
                                  >
                                    {sub}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      /* TEACHER-SPECIFIC FIELDS */
                      <>
                        <div className="pt-2 pb-1 border-t border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest">Professional Details</p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Degree / Qualification</label>
                          <input
                            type="text"
                            placeholder="e.g. M.Sc. in IT, Ph.D. in CS"
                            value={signUpDegree}
                            onChange={(e) => setSignUpDegree(e.target.value)}
                            className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Department</label>
                          <select
                            value={signUpDeptId}
                            onChange={(e) => setSignUpDeptId(e.target.value)}
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Department</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Information Technology">Information Technology</option>
                            <option value="Science">Science</option>
                            <option value="Commerce">Commerce</option>
                            <option value="Arts">Arts</option>
                            <option value="Mathematics">Mathematics</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  <Button
                    type="submit"
                    isLoading={isSigningUp}
                    className="w-full h-11 rounded-xl text-xs font-semibold shadow-md bg-role-primary hover:bg-role-secondary text-white border-transparent transition-all mt-2 cursor-pointer"
                  >
                    Create Profile
                  </Button>

                  <button
                    type="button"
                    onClick={() => setShowSignUp(false)}
                    className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors pt-1 block cursor-pointer"
                  >
                    Already have an account? Sign In
                  </button>
                </form>
              </div>

            ) : (
              /* STANDARD LOGIN FORM */
              <div className="space-y-6">
                <div>
                  <h2 className="font-display font-extrabold text-2xl tracking-tight text-slate-900 dark:text-slate-50">
                    Welcome Back!
                  </h2>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Login to your account to continue
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Role selection row */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                      Login as
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {rolesConfig.map((item) => {
                        const isSelected = role === item.role;
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.role}
                            type="button"
                            onClick={() => setRole(item.role)}
                            className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-300 bg-white dark:bg-slate-900 cursor-pointer hover:shadow-md hover:scale-[1.05] active:scale-[0.97] ${
                              isSelected
                                ? `${item.selectedBorderClass} ${item.selectedBgClass} scale-[1.03]`
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <div className={`p-2 rounded-xl mb-1.5 transition-colors ${
                              isSelected ? item.selectedBgClass : 'bg-slate-50 dark:bg-slate-800/50'
                            }`}>
                              <Icon className={`h-6 w-6 transition-colors ${
                                isSelected ? item.selectedIconClass : item.colorClass
                              }`} />
                            </div>
                            <span className={`text-[11px] font-bold transition-colors ${
                              isSelected ? item.selectedLabelClass : 'text-slate-650 dark:text-slate-355'
                            }`}>
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Institution Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Institution / College
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-505">
                        <School className="h-5 w-5" />
                      </div>
                      <select
                        value={collegeId}
                        onChange={(e) => setCollegeId(e.target.value as CollegeId)}
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-8 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 appearance-none font-medium cursor-pointer"
                      >
                        {collegeList.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-450">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Email or Username */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Email or Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-505">
                        <UserIcon className="h-5 w-5" />
                      </div>
                      <input
                        type="email"
                        required
                        placeholder="Enter your email or username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(email);
                          setShowForgotPassword(true);
                          setResetStatus(null);
                        }}
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-505">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type={showPasswordText ? 'text' : 'password'}
                        required
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordText(!showPasswordText)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        {showPasswordText ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    isLoading={isLoading || isGoogleLoading}
                    className="w-full h-11 rounded-xl text-xs font-semibold shadow-md bg-role-primary hover:bg-role-secondary text-white border-transparent transition-all mt-4 cursor-pointer"
                  >
                    Login
                  </Button>

                  <div className="relative flex items-center justify-center my-3.5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                    </div>
                    <span className="relative px-3 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">or</span>
                  </div>

                  <Button
                    type="button"
                    onClick={handleGoogleLoginSubmit}
                    isLoading={isGoogleLoading || isLoading}
                    className="w-full h-[52px] rounded-xl text-xs font-semibold shadow-sm border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-500/20 active:scale-[0.98]"
                  >
                    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" width="24" height="24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Continue as {role === 'STUDENT' ? 'Student' : role === 'TEACHER' ? 'Teacher' : 'Admin'} with Google</span>
                  </Button>

                  <button
                    type="button"
                    onClick={() => setShowSignUp(true)}
                    className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200 transition-colors pt-2 block cursor-pointer"
                  >
                    New here? Create New Profile
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 flex items-center justify-center border-t border-slate-200/50 dark:border-slate-900 z-10 text-[10px] font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
        Campus Connect • © 2026
      </footer>
    </div>
  );
}
