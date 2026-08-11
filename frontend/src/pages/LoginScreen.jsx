import { useNavigate } from 'react-router-dom';
import { Bot, Mail } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export default function Login() {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      // Firebase ka Google Login popup open hoga
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Logged in user:", result.user.displayName);
      
      // Login success hone ke baad seedha Chat page par bhej dega
      navigate('/chat');
      
    } catch (error) {
      console.error("Error during Google Login:", error.message);
      alert("Failed to login with Google. Please check your connection.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white font-sans relative overflow-hidden">
      {/* Background glowing effects - Ek dum premium feel ke liye */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50"></div>

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
          
          {/* Logo */}
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <Bot size={32} className="text-white" />
          </div>
          
          <h2 className="text-3xl font-bold mb-2">Welcome to NovaAI</h2>
          <p className="text-gray-400 mb-8 text-center">Your intelligent companion. Sign in to continue.</p>

          <div className="w-full space-y-4">
            
            {/* Email authentication has not been configured for this app. */}
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-500" size={20} />
              <input
                type="email" 
                placeholder="Email address" 
                disabled
                aria-label="Email sign-in is unavailable"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button type="button" disabled className="w-full bg-gray-700 text-gray-400 font-semibold py-3 rounded-xl cursor-not-allowed">
              Email sign-in unavailable
            </button>

            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-800"></div>
              <span className="px-4 text-gray-500 text-sm">OR</span>
              <div className="flex-grow border-t border-gray-800"></div>
            </div>

            {/* Asli Google Login Button */}
            <button 
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-3"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>
          </div>
          
          <p className="mt-8 text-xs text-gray-500 text-center">
            By continuing, you agree to NovaAI's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
