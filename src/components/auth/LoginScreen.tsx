"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "./AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();

  return (
    <div className="flex w-full h-full flex-col items-center justify-center bg-brand-bg relative overflow-hidden">
      <div className="z-10 bg-brand-card p-12 rounded-lg border border-brand-border flex flex-col items-center shadow-2xl max-w-md w-full text-center">
        <h1 className="text-4xl text-brand-accent mb-2">GHOSTBOND</h1>
        <h2 className="text-2xl font-bebas tracking-wider text-brand-text/80 mb-8">Action Engine Portal</h2>
        
        <p className="text-sm text-brand-text/60 mb-8">
          Sign in with your @ghostbond.com or @prohairlabs.com workspace account to continue.
        </p>

        <GoogleLogin
          onSuccess={(credentialResponse) => {
            if (credentialResponse.credential) {
              login(credentialResponse.credential);
            }
          }}
          onError={() => {
            console.error('Login Failed');
          }}
          useOneTap
          theme="filled_black"
          shape="rectangular"
          text="signin_with"
        />
      </div>
      
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/5 to-transparent pointer-events-none" />
    </div>
  );
}
