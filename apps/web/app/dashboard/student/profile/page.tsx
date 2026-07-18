'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@campus-connect/ui';
import { useAuth } from '../../../../components/AuthProvider';
import { Mail, Calendar, School, GraduationCap, User, Phone, MapPin, Shield, Edit2, CheckCircle, Save, X } from 'lucide-react';
import { api } from '../../../../utils/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [completion, setCompletion] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  
  // Guardians
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');

  // Address
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    const resp = await api.getMe();
    if (resp.success && resp.data) {
      const student = resp.data.studentProfile;
      setProfile(student);
      setCompletion(resp.data.profileCompletionPercentage || 0);

      // Map values to form
      setName(resp.data.name || '');
      setPhone(student?.profile?.phone || '');
      setRollNumber(student?.rollNumber || '');
      setRegistrationNumber(student?.registrationNumber || '');
      setPhotoUrl(student?.profile?.photoUrl || '');
      setDateOfBirth(student?.profile?.dob ? new Date(student.profile.dob).toISOString().split('T')[0] : '');
      setBloodGroup(student?.profile?.bloodGroup || student?.medical?.bloodGroup || '');
      
      const guardian = student?.guardians?.[0] || {};
      setFatherName(guardian?.fatherName || '');
      setMotherName(guardian?.motherName || '');
      setGuardianPhone(guardian?.guardianPhone || '');

      const address = student?.addresses?.[0] || {};
      setAddressLine(address?.addressLine || '');
      setCity(address?.city || '');
      setState(address?.state || '');
      setPostalCode(address?.postalCode || '');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      name,
      firstName: name.split(' ')[0] || '',
      lastName: name.split(' ')[1] || '',
      phone,
      rollNumber,
      registrationNumber,
      photoUrl,
      dateOfBirth,
      bloodGroup,
      fatherName,
      motherName,
      guardianPhone,
      addressLine,
      city,
      state,
      postalCode,
    };

    const resp = await api.updateSelfProfile(payload);
    if (resp.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      
      // Update local storage user details if needed
      const storedUser = localStorage.getItem('cc_user');
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          userObj.name = name;
          userObj.profileCompletionPercentage = resp.data?.profileCompletionPercentage;
          localStorage.setItem('cc_user', JSON.stringify(userObj));
        } catch (_) {}
      }
      
      await fetchProfile();
    } else {
      setMessage({ type: 'error', text: resp.message || 'Failed to update profile.' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <DashboardLayout title="Student Profile" icon={<User className="h-6 w-6" />}>
        <div className="max-w-3xl mx-auto flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const divisionName = profile?.division?.name || 'Division A';
  const semesterName = profile?.division?.semester?.name || 'Semester 1';
  const courseName = profile?.division?.semester?.academicSession?.course?.name || 'Undergraduate';
  const departmentName = profile?.division?.semester?.academicSession?.course?.department?.name || 'Science & IT';
  const collegeName = profile?.division?.semester?.academicSession?.course?.department?.college?.name || "Pushpalata Mhatre Women's College";

  return (
    <DashboardLayout title="Student Profile" icon={<User className="h-6 w-6" />}>
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Profile Tracker Header Card */}
        <Card className="overflow-hidden border-slate-100 bg-white dark:bg-slate-950">
          <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              {photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt={name} 
                  className="h-20 w-20 rounded-2xl object-cover shadow-md border-2 border-slate-100 dark:border-slate-800"
                />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-blue-600 dark:bg-blue-500 text-white font-extrabold text-3xl flex items-center justify-center shadow-lg shadow-blue-500/10 shrink-0">
                  {name.charAt(0)}
                </div>
              )}
            </div>
            <div className="text-center md:text-left flex-1 space-y-1">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-200">{name}</h2>
              <p className="text-xs text-slate-400 font-semibold">ID: {profile?.rollNumber || 'STU-NEW'}</p>
              
              {/* Profile Completion percentage */}
              <div className="flex flex-col mt-4 space-y-1.5 max-w-xs mx-auto md:mx-0">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  <span>Profile Completion</span>
                  <span className={completion === 100 ? "text-blue-600 dark:text-blue-400" : "text-blue-500 dark:text-blue-400/80"}>
                    {completion}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-150 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${completion === 100 ? 'bg-blue-600' : 'bg-blue-400'}`} 
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="shrink-0 mt-4 md:mt-0">
              {!isEditing ? (
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 rounded-xl text-xs font-semibold px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 transition-all cursor-pointer"
                >
                  <Edit2 className="h-4.5 w-4.5 text-slate-450" />
                  Edit Profile
                </Button>
              ) : (
                <Button 
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 rounded-xl text-xs font-semibold px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 transition-all cursor-pointer"
                >
                  <X className="h-4.5 w-4.5 text-slate-450" />
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {message && (
          <div className={`p-4 border rounded-xl flex items-start gap-3 text-xs leading-relaxed ${
            message.type === 'success' 
              ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-400' 
              : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400'
          }`}>
            <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{message.text}</span>
          </div>
        )}

        {/* Display Mode vs Edit Mode */}
        {!isEditing ? (
          /* DISPLAY MODE */
          <div className="grid grid-cols-1 gap-6">
            
            {/* Academic Registry Profile */}
            <Card className="border-slate-100 bg-white dark:bg-slate-950">
              <CardHeader>
                <CardTitle>Academic Registry Profile</CardTitle>
                <p className="text-xs text-slate-500">Official student details from college databases</p>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                    <Mail className="h-5 w-5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Email Address</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{user?.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                    <Phone className="h-5 w-5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Phone Number</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{phone || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                    <Calendar className="h-5 w-5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Date of Birth</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{dateOfBirth || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                    <Shield className="h-5 w-5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Blood Group</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{bloodGroup || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                    <School className="h-5 w-5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Affiliated College</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{collegeName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                    <GraduationCap className="h-5 w-5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Department / Branch</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{departmentName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                    <GraduationCap className="h-5 w-5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Course & Semester</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{courseName} • {semesterName} ({divisionName})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                    <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Address</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                        {addressLine ? `${addressLine}, ${city}, ${state} ${postalCode}` : 'N/A'}
                      </span>
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* Parent & Guardian details */}
            <Card className="border-slate-100 bg-white dark:bg-slate-950">
              <CardHeader>
                <CardTitle>Guardians & Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Father's Name</span>
                    <span className="text-xs font-semibold text-slate-750 dark:text-slate-300 block mt-1">{fatherName || 'N/A'}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Mother's Name</span>
                    <span className="text-xs font-semibold text-slate-750 dark:text-slate-300 block mt-1">{motherName || 'N/A'}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Guardian Phone</span>
                    <span className="text-xs font-semibold text-slate-750 dark:text-slate-300 block mt-1">{guardianPhone || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        ) : (
          /* EDIT MODE FORM */
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="border-slate-100 bg-white dark:bg-slate-950">
              <CardHeader>
                <CardTitle>Edit Profile Information</CardTitle>
                <p className="text-xs text-slate-550">Complete all required fields to reach 100% completion</p>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-5">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-750 dark:text-slate-300 uppercase tracking-wider block">Full Name *</label>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-750 dark:text-slate-300 uppercase tracking-wider block">Phone Number *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. +91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* Roll Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-750 dark:text-slate-300 uppercase tracking-wider block">Roll Number *</label>
                    <input 
                      type="text" 
                      required
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* Registration Number / PRN */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-750 dark:text-slate-300 uppercase tracking-wider block">PRN / Registration Number *</label>
                    <input 
                      type="text" 
                      required
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* Profile Photo URL */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-750 dark:text-slate-300 uppercase tracking-wider block">Profile Photo URL *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="https://example.com/photo.jpg"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* DOB */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-750 dark:text-slate-300 uppercase tracking-wider block">Date of Birth (Optional)</label>
                    <input 
                      type="date" 
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* Blood Group */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-750 dark:text-slate-300 uppercase tracking-wider block">Blood Group (Optional)</label>
                    <select 
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Guardian Information (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-750 dark:text-slate-300 uppercase tracking-wider block">Father's Name</label>
                      <input 
                        type="text" 
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-750 dark:text-slate-300 uppercase tracking-wider block">Mother's Name</label>
                      <input 
                        type="text" 
                        value={motherName}
                        onChange={(e) => setMotherName(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-slate-750 dark:text-slate-300 uppercase tracking-wider block">Guardian Phone</label>
                      <input 
                        type="text" 
                        value={guardianPhone}
                        onChange={(e) => setGuardianPhone(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>

                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Contact Address (Optional)</h4>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-755 dark:text-slate-300 uppercase tracking-wider block">Address Line</label>
                      <input 
                        type="text" 
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-755 dark:text-slate-300 uppercase tracking-wider block">City</label>
                        <input 
                          type="text" 
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-755 dark:text-slate-300 uppercase tracking-wider block">State</label>
                        <input 
                          type="text" 
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-755 dark:text-slate-300 uppercase tracking-wider block">Postal Code</label>
                        <input 
                          type="text" 
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3.5">
              <Button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-xl text-xs font-bold px-5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={saving}
                className="flex items-center gap-2 rounded-xl text-xs font-bold px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white border-transparent cursor-pointer"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        )}

      </div>
    </DashboardLayout>
  );
}
