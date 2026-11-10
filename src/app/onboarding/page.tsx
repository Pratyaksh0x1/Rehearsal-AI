'use client';

import React from 'react';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { AuthGate } from '@/components/auth/AuthGate';

export default function OnboardingPage() {
  return (
    <AuthGate>
      <OnboardingFlow />
    </AuthGate>
  );
}

