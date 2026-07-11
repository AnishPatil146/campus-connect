'use client';

import React from 'react';
import LoginContainer from '../../../components/LoginContainer';

export default function TeacherLoginPage() {
  return (
    <LoginContainer 
      initialRole="TEACHER" 
      brandingMessage="Faculty Portal" 
    />
  );
}
