"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MdDashboard, MdEmail, MdSettings, MdLogout, MdStorage, MdClose, MdViewKanban, MdPublic } from 'react-icons/md';

export default function Sidebar({ isOpen, onClose }) {
    const pathname = usePathname();
    const router = useRouter();

    const [userRole, setUserRole] = React.useState('admin');
    const [unreadCount, setUnreadCount] = React.useState(0);

    React.useEffect(() => {
        const role = localStorage.getItem('user_role') || 'admin';
        setUserRole(role);

        // Fetch unread count immediately and then poll every 15 seconds
        const fetchUnreadCount = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6969';
                const res = await fetch(`${API_URL}/api/forms/unread-count`);
                const data = await res.json();
                if (data.success) {
                    setUnreadCount(data.data.count);
                }
            } catch (err) {
                console.error("Error fetching unread count:", err);
            }
        };

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 15000); // 15 seconds

        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('admin_auth');
        localStorage.removeItem('user_role');
        document.cookie = "admin_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
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
                {userRole === 'admin' && (
                    <Link 
                        href="/overview" 
                        onClick={onClose}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/overview') ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
                    >
                        <MdDashboard size={20} />
                        <span className="font-medium">Overview</span>
                    </Link>
                )}
                
                <Link 
                    href="/sales-dashboard" 
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/sales-dashboard') ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
                >
                    <MdViewKanban size={20} />
                    <span className="font-medium">Sales Pipeline</span>
                </Link>

                <Link 
                    href="/leads" 
                    onClick={onClose}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all ${isActive('/leads') ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
                >
                    <div className="flex items-center gap-3">
                        <MdEmail size={20} />
                        <span className="font-medium">All Leads</span>
                    </div>
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse shadow-sm shadow-red-500/50">
                            {unreadCount}
                        </span>
                    )}
                </Link>

                {userRole === 'admin' && (
                    <>
                        <Link 
                            href="/b2b-data" 
                            onClick={onClose}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/b2b-data') ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
                        >
                            <MdStorage size={20} />
                            <span className="font-medium">B2B Database</span>
                        </Link>

                        <Link 
                            href="/scraped-data" 
                            onClick={onClose}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/scraped-data') ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
                        >
                            <MdPublic size={20} />
                            <span className="font-medium">Scraped Data</span>
                        </Link>

                        <Link 
                            href="/team" 
                            onClick={onClose}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/team') ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
                        >
                            <MdSettings size={20} />
                            <span className="font-medium">Team Settings</span>
                        </Link>
                    </>
                )}
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
