import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { registerUser, loginUser, googleLogin } from '../api/auth';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom'; // npm install react-router-dom

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      console.log('Registration successful:', data.message);
      setIsLogin(true); // Switch to login after successful registration
      alert('Registration successful! Please log in.'); // Use a custom modal in a real app
    },
    onError: (error) => {
      alert(`Registration failed: ${error.message}`); // Use a custom modal
    },
  });

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      console.log('Login successful:', data.message);
      authLogin(data.data!.token); // Store token in AuthContext
      navigate('/'); // Redirect to home page
    },
    onError: (error) => {
      alert(`Login failed: ${error.message}`); // Use a custom modal
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      loginMutation.mutate({ email, password });
    } else {
      registerMutation.mutate({ name, email, password });
    }
  };

  return (
    <div className="font-inter flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
          {isLogin ? 'Login' : 'Register'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1"
              />
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending || registerMutation.isPending}
          >
            {isLogin
              ? loginMutation.isPending
                ? 'Logging In...'
                : 'Login'
              : registerMutation.isPending
                ? 'Registering...'
                : 'Register'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button variant="link" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
          </Button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="px-2 text-sm text-gray-500">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <Button onClick={googleLogin} className="mt-4 w-full bg-red-600 hover:bg-red-700">
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}

export default AuthPage;
