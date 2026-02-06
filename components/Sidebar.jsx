"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MdDashboard, MdEmail, MdSettings, MdLogout } from 'react-icons/md';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('admin_auth');
        document.cookie = "admin_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        router.push('/login');
    };

    const isActive = (path) => pathname === path;

    return (
        <aside className="w-64 bg-slate-900 min-h-screen text-slate-100 flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold tracking-wider text-blue-400">ADMIN PANEL</h2>
            </div>
            
            <nav className="flex-1 mt-6 px-4 space-y-2">
                <Link href="/leads" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/leads') ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}>
                    <MdEmail size={20} />
                    <span className="font-medium">Leads</span>
                </Link>
                {/* 
                // Placeholder for future dashboard 
                <Link href="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/dashboard') ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}>
                    <MdDashboard size={20} />
                    <span className="font-medium">Dashboard</span>
                </Link>
                */}
            </nav>

            <div className="p-4 border-t border-slate-700">
                <button 
                    onClick={handleLogout} 
                    className="flex w-full items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition"
                >
                    <MdLogout size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
}
