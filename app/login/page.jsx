'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MdLockOutline, MdEmail, MdPerson, MdVisibility, MdVisibilityOff } from 'react-icons/md';

export default function AdminLoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6969';
            const res = await fetch(`${API_URL}/api/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (data.success) {
                const userRole = data.data.role; // 'admin' or 'sales'
                localStorage.setItem('admin_auth', 'true');
                localStorage.setItem('user_role', userRole);
                document.cookie = "admin_auth=true; path=/";
                document.cookie = `user_role=${userRole}; path=/`;

                if (userRole === 'admin') {
                    router.push('/overview');
                } else {
                    router.push('/sales-dashboard');
                }
            } else {
                setError(data.message || 'Invalid username or password');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Could not connect to the server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-2xl w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                        <MdLockOutline className="text-white text-3xl" />
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h2>
                    <p className="text-slate-300 mt-2">Sign in to access your dashboard</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="text-sm font-medium text-slate-300 block mb-2 ml-1">Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <MdPerson className="text-slate-400" />
                            </div>
                            <input 
                                type="text" 
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-600 text-white px-10 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
                                placeholder="Enter your username"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-300 block mb-2 ml-1">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <MdLockOutline className="text-slate-400" />
                            </div>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-600 text-white pl-10 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
                                placeholder="Enter secure password"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>
                
                <div className="mt-8 text-center">
                    <p className="text-slate-400 text-xs">
                        &copy; 2026 Admin Panel. Secure System.
                    </p>
                </div>
            </div>
        </div>
    );
}
