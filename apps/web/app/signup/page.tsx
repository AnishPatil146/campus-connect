'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge } from '@campus-connect/ui';
import { ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2, Building2, User, BookOpen, KeyRound, AlertCircle } from 'lucide-react';
import { api } from '../../utils/api';

export default function SignupWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [collegeId, setCollegeId] = useState('college-a');
  const [departmentId, setDepartmentId] = useState('dept-1');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [parentalConsent, setParentalConsent] = useState(false);
  
  // Student-specific fields
  const [rollNumber, setRollNumber] = useState('');
  const [divisionId, setDivisionId] = useState('div-a');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [parentContact, setParentContact] = useState('');

  // Teacher-specific fields
  const [staffId, setStaffId] = useState('');
  const [subjectsTaught, setSubjectsTaught] = useState('');

  // OTP Verification state
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Calculate age helper
  const isUnder18 = () => {
    if (!dateOfBirth) return false;
    const dob = new Date(dateOfBirth);
    const diffYears = (new Date().getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return diffYears < 18;
  };

  const handleNextStep = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!collegeId) {
        setErrorMsg('Please select your institution.');
        return;
      }
    } else if (step === 2) {
      if (!name.trim() || !email.trim() || !password || !dateOfBirth) {
        setErrorMsg('Please complete all required identity fields.');
        return;
      }
      if (isUnder18() && role === 'STUDENT' && !parentalConsent) {
        setErrorMsg('Parental consent is mandatory for students under 18 years of age.');
        return;
      }
    } else if (step === 3) {
      if (role === 'STUDENT') {
        if (!rollNumber.trim()) {
          setErrorMsg('Roll Number is required for student registration.');
          return;
        }
      } else {
        if (!staffId.trim()) {
          setErrorMsg('Staff ID is required for faculty registration.');
          return;
        }
      }
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSendOtp = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      setOtpSent(true);
      setSuccessMsg(Verification code sent to ${email});
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to send OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!otpCode || otpCode.length < 4) {
      setErrorMsg('Please enter the verification code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      // Simulate/call registration API
      setSuccessMsg('Account registered successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (e: any) {
      setErrorMsg(e.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-4">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center font-display font-extrabold text-white text-2xl shadow-lg">
            C
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold tracking-tight">
          Join Campus Connect
        </h2>
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Multi-Step Account Setup Wizard
        </p>

        {/* Progress Indicator */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-300 ease-out" 
            style={{ width: ${progressPercent}% }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span>Step {step} of 4</span>
          <span>{progressPercent}% Completed</span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              {step === 1 && <Building2 className="h-5 w-5 text-blue-500" />}
              {step === 2 && <User className="h-5 w-5 text-indigo-500" />}
              {step === 3 && <BookOpen className="h-5 w-5 text-emerald-500" />}
              {step === 4 && <KeyRound className="h-5 w-5 text-amber-500" />}
              {step === 1 && 'Step 1: Institution & Role Selection'}
              {step === 2 && 'Step 2: Account & Personal Identity'}
              {step === 3 && Step 3: }
              {step === 4 && 'Step 4: Review & Email OTP Verification'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            
            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Select Your Role</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRole('STUDENT')}
                      className={p-4 rounded-xl border text-center transition-all }
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('TEACHER')}
                      className={p-4 rounded-xl border text-center transition-all }
                    >
                      Faculty / Teacher
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Select College / Campus</label>
                  <select
                    value={collegeId}
                    onChange={(e) => setCollegeId(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="college-a">Pushpalata Mhatre Women's College</option>
                    <option value="college-b">Balasaheb Mhatre College (Junior)</option>
                    <option value="college-c">Balasaheb Mhatre College (Senior)</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Full Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ananya Sharma" />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Email Address</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@college.edu" />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Password</label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Date of Birth</label>
                  <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                </div>

                {isUnder18() && role === 'STUDENT' && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs space-y-2">
                    <p className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-amber-600" /> Minor Verification & Parental Consent Required
                    </p>
                    <p>As you are under 18 years of age, parental consent is required under DPDP Act 2023.</p>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={parentalConsent}
                        onChange={(e) => setParentalConsent(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>I confirm parental consent has been provided per our <Link href="/privacy" className="underline text-blue-600">Privacy Policy</Link>.</span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-4">
                {role === 'STUDENT' ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Roll Number</label>
                      <Input value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="e.g. 2024-BSCIT-042" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Father's Name (GuardianInfo)</label>
                      <Input value={fatherName} onChange={(e) => setFatherName(e.target.value)} placeholder="Father's full name" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Mother's Name (GuardianInfo)</label>
                      <Input value={motherName} onChange={(e) => setMotherName(e.target.value)} placeholder="Mother's full name" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Parent Contact Number</label>
                      <Input value={parentContact} onChange={(e) => setParentContact(e.target.value)} placeholder="+91 9876543210" />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Faculty Staff ID</label>
                      <Input value={staffId} onChange={(e) => setStaffId(e.target.value)} placeholder="e.g. FAC-2024-009" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Primary Subject(s) Taught</label>
                      <Input value={subjectsTaught} onChange={(e) => setSubjectsTaught(e.target.value)} placeholder="e.g. Database Systems, Web Tech" />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <form onSubmit={handleSubmitRegistration} className="space-y-6">
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2">Registration Review</h4>
                  <p><strong>Name:</strong> {name}</p>
                  <p><strong>Email:</strong> {email}</p>
                  <p><strong>Role:</strong> {role}</p>
                  <p><strong>College:</strong> {collegeId}</p>
                  {role === 'STUDENT' ? <p><strong>Roll No:</strong> {rollNumber}</p> : <p><strong>Staff ID:</strong> {staffId}</p>}
                </div>

                {!otpSent ? (
                  <Button type="button" onClick={handleSendOtp} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500">
                    {loading ? 'Sending OTP...' : 'Send Email Verification Code'}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">6-Digit Verification Code</label>
                      <Input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="123456" className="text-center font-mono tracking-widest text-lg" />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500">
                      {loading ? 'Verifying & Registering...' : 'Verify OTP & Complete Registration'}
                    </Button>
                  </div>
                )}
              </form>
            )}

            {/* Navigation buttons */}
            <div className="mt-8 flex justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={handlePrevStep} className="gap-1">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              ) : <div />}

              {step < 4 && (
                <Button type="button" onClick={handleNextStep} className="bg-blue-600 hover:bg-blue-500 gap-1 ml-auto">
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
