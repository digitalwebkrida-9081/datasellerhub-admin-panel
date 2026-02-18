"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MdDashboard, MdEmail, MdSettings, MdLogout, MdStorage, MdClose } from 'react-icons/md';

export default function Sidebar({ isOpen, onClose }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('admin_auth');
        document.cookie = "admin_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        router.push('/login');
    };

    const isActive = (path) => pathname === path;

    return (
        <aside className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col shadow-2xl 
            transition-transform duration-300 ease-in-out 
            md:translate-x-0 md:static md:inset-auto
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-wider text-blue-400">ADMIN PANEL</h2>
                <button 
                    onClick={onClose}
                    className="md:hidden text-slate-400 hover:text-white transition"
                >
                    <MdClose size={24} />
                </button>
            </div>
            
            <nav className="flex-1 mt-6 px-4 space-y-2">
                <Link 
                    href="/overview" 
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/overview') ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
                >
                    <MdDashboard size={20} />
                    <span className="font-medium">Overview</span>
                </Link>
                <Link 
                    href="/leads" 
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/leads') ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
                >
                    <MdEmail size={20} />
                    <span className="font-medium">Leads</span>
                </Link>
                <Link 
                    href="/b2b-data" 
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/b2b-data') ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
                >
                    <MdStorage size={20} />
                    <span className="font-medium">B2B Database</span>
                </Link>
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
