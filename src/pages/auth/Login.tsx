import { SignIn, useClerk } from '@clerk/clerk-react';
import { useState } from 'react';

export default function Login() {
  const { signOut } = useClerk();
  const [showSwitchAccountInfo, setShowSwitchAccountInfo] = useState(false);

  const handleSwitchAccount = async () => {
    await signOut();
    // Reload page to reset Clerk session
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-4">
        {/* Google Account Switch Info */}
        {showSwitchAccountInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 mb-3">
              <strong>Using the wrong Google account?</strong> Click below to switch to your
              Cavendish email profile.
            </p>
            <button
              onClick={handleSwitchAccount}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Sign Out & Switch Google Account
            </button>
          </div>
        )}

        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/sign-up"
          forceRedirectUrl="/"
          appearance={{
            elements: {
              formButtonPrimary: 'bg-slate-900 hover:bg-slate-800',
            },
          }}
        />

        {/* Toggle switch account info */}
        <button
          onClick={() => setShowSwitchAccountInfo(!showSwitchAccountInfo)}
          className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-2 border-t border-slate-200"
        >
          {showSwitchAccountInfo ? 'Hide' : "Can't sign in with Cavendish account?"}
        </button>
      </div>
    </div>
  );
}
