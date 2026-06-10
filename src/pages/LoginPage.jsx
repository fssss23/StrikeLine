import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Zap, Smartphone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StrikeLineLogo } from '../components/logo/StrikeLineLogo';
import { MarketTicker } from '../components/ticker/MarketTicker';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const signupForm = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' }
  });

  const onLogin = async (data) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });
    
    if (error) {
      loginForm.setError('root', { message: error.message });
    } else {
      navigate('/');
    }
    setIsLoading(false);
  };

  const onSignup = async (data) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { display_name: data.name } }
    });
    
    if (error) {
      signupForm.setError('root', { message: error.message });
    } else {
      navigate('/');
    }
    setIsLoading(false);
  };

  const EyeIcon = showPassword ? EyeOff : Eye;
  
  const watchPassword = signupForm.watch("password");
  const getStrength = (pass) => {
    if (!pass) return 0;
    let s = 0;
    if (pass.length > 5) s += 1;
    if (/[A-Z]/.test(pass)) s += 1;
    if (/[0-9]/.test(pass)) s += 1;
    if (/[^A-Za-z0-9]/.test(pass)) s += 1;
    return s;
  };
  const strength = getStrength(watchPassword);
  const strengthColors = ['bg-surface-border', 'bg-signal-red', 'bg-signal-amber', 'bg-signal-green', 'bg-signal-green'];

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col w-1/2 bg-brand-navy relative overflow-hidden">
        <div className="p-6">
          <StrikeLineLogo variant="inverse" />
        </div>
        
        <div className="flex-1 flex flex-col justify-center px-16 xl:px-24">
          <h1 className="text-4xl font-bold text-text-inverse max-w-xs leading-tight">
            Never miss a price level again.
          </h1>
          <p className="mt-3 text-sidebar-textInactive text-sm max-w-xs">
            Real-time PSX alerts delivered straight to your devices so you can focus on trading, not staring at charts.
          </p>
          
          <div className="mt-8 flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-blue/20 flex items-center justify-center text-brand-blue shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-text-inverse text-[15px] font-medium">60-second data refresh</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-blue/20 flex items-center justify-center text-brand-blue shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-text-inverse text-[15px] font-medium">Push, WhatsApp & email alerts</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-blue/20 flex items-center justify-center text-brand-blue shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-text-inverse text-[15px] font-medium">Built for PSX traders</span>
            </div>
          </div>
        </div>

        <MarketTicker className="absolute bottom-0 w-full" />
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex flex-col bg-surface-card relative">
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 md:px-24 py-12">
          
          <div className="w-full max-w-[380px] mx-auto">
            <div className="lg:hidden mb-8 flex justify-center">
              <StrikeLineLogo variant="full" />
            </div>

            <div className="flex relative border-b border-surface-border mb-8">
              {['login', 'signup'].map((tab) => (
                <button
                  key={tab}
                  className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
                    activeTab === tab ? 'text-brand-navy' : 'text-text-secondary hover:text-text-primary'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'login' ? 'Log In' : 'Sign Up'}
                  {activeTab === tab && (
                    <motion.div 
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-navy"
                      initial={false}
                    />
                  )}
                </button>
              ))}
            </div>

            {activeTab === 'login' ? (
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="flex flex-col gap-5">
                <Input 
                  label="Email address" 
                  type="email" 
                  leftIcon={Mail} 
                  error={loginForm.formState.errors.email?.message}
                  {...loginForm.register("email")}
                />
                
                <div className="flex flex-col gap-1.5">
                  <Input 
                    label="Password" 
                    type={showPassword ? "text" : "password"} 
                    leftIcon={Lock} 
                    rightIcon={() => (
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none">
                        <EyeIcon className="w-5 h-5" />
                      </button>
                    )}
                    error={loginForm.formState.errors.password?.message}
                    {...loginForm.register("password")}
                  />
                  <div className="flex justify-end">
                    <a href="#" className="text-xs font-medium text-brand-blue hover:underline">Forgot password?</a>
                  </div>
                </div>

                {loginForm.formState.errors.root && (
                  <span className="text-signal-red text-[13px]">{loginForm.formState.errors.root.message}</span>
                )}

                <Button type="submit" variant="primary" fullWidth loading={isLoading}>
                  Log In
                </Button>
              </form>
            ) : (
              <form onSubmit={signupForm.handleSubmit(onSignup)} className="flex flex-col gap-5">
                <Input 
                  label="Display name" 
                  leftIcon={User} 
                  error={signupForm.formState.errors.name?.message}
                  {...signupForm.register("name")}
                />
                <Input 
                  label="Email address" 
                  type="email" 
                  leftIcon={Mail} 
                  error={signupForm.formState.errors.email?.message}
                  {...signupForm.register("email")}
                />
                <div className="flex flex-col gap-1.5">
                  <Input 
                    label="Password" 
                    type={showPassword ? "text" : "password"} 
                    leftIcon={Lock} 
                    error={signupForm.formState.errors.password?.message}
                    {...signupForm.register("password")}
                  />
                  <div className="flex gap-1 h-1.5 mt-1">
                    {[1, 2, 3, 4].map(idx => (
                      <div key={idx} className={`flex-1 rounded-full transition-colors ${strength >= idx ? strengthColors[strength] : 'bg-surface-border'}`} />
                    ))}
                  </div>
                </div>

                {signupForm.formState.errors.root && (
                  <span className="text-signal-red text-[13px]">{signupForm.formState.errors.root.message}</span>
                )}

                <Button type="submit" variant="primary" fullWidth loading={isLoading}>
                  Create Account
                </Button>
              </form>
            )}

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-surface-border" />
              <span className="text-xs text-text-secondary">or</span>
              <div className="flex-1 h-px bg-surface-border" />
            </div>

            <Button variant="secondary" fullWidth className="bg-white border border-surface-border hover:bg-surface-page shadow-sm font-medium">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                <path d="M1 1h22v22H1z" fill="none"/>
              </svg>
              Continue with Google
            </Button>

            {activeTab === 'signup' && (
              <p className="text-center text-xs text-text-secondary mt-6">
                By signing up, you agree to our Terms and Privacy Policy
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
