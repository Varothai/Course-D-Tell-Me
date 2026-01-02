"use client";

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { signIn } from "next-auth/react";

export default function CMUEntraIDCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // Get the authorization code from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");

      if (code) {
        try {
          // First handle CMU token
          const response = await fetch("/api/signIn", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ authorizationCode: code }),
          });

          const data = await response.json();

          if (data.ok) {
            // Then sign in with NextAuth using the CMU provider
            const result = await signIn("cmu", { 
              redirect: false,
              callbackUrl: "/homepage"
            });
            
            if (result?.ok) {
              router.push("/homepage");
            } else {
              console.error("NextAuth sign in failed");
              router.push("/homepage");
            }
          } else {
            console.error("Login failed:", data.message);
            router.push("/homepage");
          }
        } catch (error) {
          console.error("Error during login:", error);
          router.push("/homepage");
        }
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Logging you in...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  );
}
