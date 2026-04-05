import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleGoogleSuccess = async (credentialResponse) => {
    const result = await login(credentialResponse.credential);
    if (!result.success) {
      console.error('Login failed:', result.error);
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src="/logo.png"
              alt="Skereal"
              className="h-16 mx-auto mb-4 object-contain"
            />
          </div>

          {/* Description */}
          <div className="mb-8 text-center">
            <p className="text-gray-600">
              Transform your sketches into stunning photorealistic images using AI technology.
            </p>
          </div>

          {/* Google Login Button */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              size="large"
              text="continue_with"
              shape="rectangular"
            />
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-400">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
