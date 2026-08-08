'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@campus-connect/ui';

export default function SignupWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [collegeId, setCollegeId] = useState('college-a');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [parentalConsent, setParentalConsent] = useState(false);
  
  // Student-specific fields
  const [rollNumber, setRollNumber] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [parentContact, setParentContact] = useState('');

  // Teacher-specific fields
  const [staffId, setStaffId] = useState('');
  const [subjectsTaught, setSubjectsTaught] = useState('');

  // OTP Verification state
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const isUnder18 = () => {
    if (!dateOfBirth) return false;
    const dob = new Date(dateOfBirth);
    const diffYears = (new Date().getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return diffYears < 18;
  };

  const handleNextStep = () => {
    setErrorMsg(null);
    if (step === 1 && !collegeId) {
      setErrorMsg('Please select your institution.');
      return;
    }
    if (step === 2) {
      if (!name.trim() || !email.trim() || !password || !dateOfBirth) {
        setErrorMsg('Please complete all required identity fields.');
        return;
      }
      if (isUnder18() && role === 'STUDENT' && !parentalConsent) {
        setErrorMsg('Parental consent is mandatory for students under 18 years of age.');
        return;
      }
    }
    if (step === 3) {
      if (role === 'STUDENT' && !rollNumber.trim()) {
        setErrorMsg('Roll Number is required for student registration.');
        return;
      }
      if (role === 'TEACHER' && !staffId.trim()) {
        setErrorMsg('Staff ID is required for faculty registration.');
        return;
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
    setOtpSent(true);
    setSuccessMsg(`Verification code sent to ${email}`);
    setLoading(false);
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setErrorMsg('Please enter the verification code sent to your email.');
      return;
    }

    setLoading(true);
    setSuccessMsg('Account registered successfully! Redirecting to login...');
    setTimeout(() => router.push('/login'), 1500);
  };

  const progressPercent = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-4">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">Join Campus Connect</h2>
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div className="bg-blue-600 h-full transition-all duration-300 ease-out" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <CardTitle className="text-lg font-bold">
              {step === 1 && 'Step 1: Institution & Role Selection'}
              {step === 2 && 'Step 2: Account & Personal Identity'}
              {step === 3 && `Step 3: ${role === 'STUDENT' ? 'Academic & Guardian Details' : 'Faculty Credentials'}`}
              {step === 4 && 'Step 4: Review & Email OTP Verification'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {errorMsg && <div className="mb-4 p-3 bg-rose-500/10 text-rose-600 rounded-xl text-sm">{errorMsg}</div>}
            {successMsg && <div className="mb-4 p-3 bg-emerald-500/10 text-emerald-600 rounded-xl text-sm">{successMsg}</div>}

            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setRole('STUDENT')} className={`p-4 rounded-xl border ${role === 'STUDENT' ? 'border-blue-600 bg-blue-50 text-blue-600 font-bold' : ''}`}>Student</button>
                  <button type="button" onClick={() => setRole('TEACHER')} className={`p-4 rounded-xl border ${role === 'TEACHER' ? 'border-blue-600 bg-blue-50 text-blue-600 font-bold' : ''}`}>Teacher</button>
                </div>
                <select value={collegeId} onChange={(e) => setCollegeId(e.target.value)} className="w-full p-3 rounded-xl border bg-white dark:bg-slate-900 text-sm">
                  <option value="college-a">Pushpalata Mhatre Women's College</option>
                  <option value="college-b">Balasaheb Mhatre College (Junior)</option>
                  <option value="college-c">Balasaheb Mhatre College (Senior)</option>
                </select>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
                <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                {isUnder18() && role === 'STUDENT' && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs rounded-xl">
                    <p className="font-bold mb-1">Parental Consent Required (&lt; 18)</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={parentalConsent} onChange={(e) => setParentalConsent(e.target.checked)} />
                      <span>Parental consent verified per <Link href="/privacy" className="underline">Privacy Policy</Link>.</span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                {role === 'STUDENT' ? (
                  <>
                    <Input value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="Roll Number" />
                    <Input value={fatherName} onChange={(e) => setFatherName(e.target.value)} placeholder="Father's Name (GuardianInfo)" />
                    <Input value={motherName} onChange={(e) => setMotherName(e.target.value)} placeholder="Mother's Name (GuardianInfo)" />
                    <Input value={parentContact} onChange={(e) => setParentContact(e.target.value)} placeholder="Parent Contact Number" />
                  </>
                ) : (
                  <>
                    <Input value={staffId} onChange={(e) => setStaffId(e.target.value)} placeholder="Faculty Staff ID" />
                    <Input value={subjectsTaught} onChange={(e) => setSubjectsTaught(e.target.value)} placeholder="Subjects Taught" />
                  </>
                )}
              </div>
            )}

            {step === 4 && (
              <form onSubmit={handleSubmitRegistration} className="space-y-4">
                {!otpSent ? (
                  <Button type="button" onClick={handleSendOtp} disabled={loading} className="w-full bg-blue-600">
                    {loading ? 'Sending Code...' : 'Send Email Verification Code'}
                  </Button>
                ) : (
                  <>
                    <Input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="Enter 6-Digit OTP" className="text-center font-mono" />
                    <Button type="submit" disabled={loading} className="w-full bg-emerald-600">
                      {loading ? 'Verifying...' : 'Verify OTP & Register'}
                    </Button>
                  </>
                )}
              </form>
            )}

            <div className="mt-6 flex justify-between pt-4 border-t">
              {step > 1 && <Button type="button" variant="outline" onClick={handlePrevStep}>Back</Button>}
              {step < 4 && <Button type="button" onClick={handleNextStep} className="bg-blue-600 ml-auto">Next</Button>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}