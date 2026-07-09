'use client';

import React from 'react';
import Login from '../../(auth)/login/page';

export default function StudentLoginPage() {
  return (
    <Login 
      initialRole="STUDENT" 
      brandingMessage="Student Portal" 
    />
  );
}
