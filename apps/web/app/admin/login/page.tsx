'use client';

import React from 'react';
import LoginContainer from '../../../components/LoginContainer';

export default function AdminLoginPage() {
  return (
    <LoginContainer 
      initialRole="ADMIN" 
      brandingMessage="Admin Portal" 
    />
  );
}
