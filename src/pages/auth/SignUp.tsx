import React from "react";
import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <SignUp routing="path" path="/sign-up" signInUrl="/login" forceRedirectUrl="/onboarding" />
    </div>
  );
}
