'use client';

import React from 'react';
import LoginContainer from '../../../components/LoginContainer';

export default function StudentLoginPage() {
  return (
    <LoginContainer 
      initialRole="STUDENT" 
      brandingMessage="Student Portal" 
    />
  );
}
