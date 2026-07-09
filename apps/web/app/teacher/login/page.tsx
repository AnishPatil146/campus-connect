'use client';

import React from 'react';
import Login from '../../(auth)/login/page';

export default function TeacherLoginPage() {
  return (
    <Login 
      initialRole="TEACHER" 
      brandingMessage="Faculty Portal" 
    />
  );
}
