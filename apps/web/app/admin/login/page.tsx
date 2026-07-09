'use client';

import React from 'react';
import Login from '../../(auth)/login/page';

export default function AdminLoginPage() {
  return (
    <Login 
      initialRole="ADMIN" 
      brandingMessage="Admin Portal" 
    />
  );
}
