'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { MdRefresh, MdStorage, MdEmail, MdPhone, MdPublic, MdCategory, MdLanguage, MdLink } from 'react-icons/md';
import { FaLinkedin, FaFacebook, FaInstagram, FaYoutube, FaTiktok } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

export default function OverviewPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastComputed, setLastComputed] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const isAuth = localStorage.getItem('admin_auth');
        const role = localStorage.getItem('user_role');

        if (!isAuth) {
            router.push('/login');
            return;
        }

        if (role !== 'admin') {
            router.push('/sales-dashboard');
            return;
        }

        fetchStats();
    }, []);

    const fetchStats = async (forceRefresh = false) => {
        setLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
            const url = `${API_URL}/api/merged/stats${forceRefresh ? '?refresh=true' : ''}`;
            const res = await fetch(url);
            const responseData = await res.json();
            if (responseData.success) {
                setStats(responseData.data);
                setLastComputed(responseData.data.lastComputed);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !stats) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
            <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-sm text-slate-400">Scanning CSV data for accurate stats...</p>
            </div>
        </div>
    );

    const summary = stats?.summary || {};

    return (
        <AdminLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Data Overview</h1>
                    <p className="text-slate-500 mt-1">Accurate statistics from merged datasets</p>
                    {lastComputed && (
                        <p className="text-xs text-slate-400 mt-1">
                            Last computed: {new Date(lastComputed).toLocaleString()}
                            {stats?.computeTimeSeconds && ` (${stats.computeTimeSeconds}s)`}
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchStats(false)}
                        disabled={loading}
                        className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition flex items-center gap-2 font-medium cursor-pointer disabled:opacity-50"
                    >
                        <MdRefresh size={20} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={() => fetchStats(true)}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium cursor-pointer disabled:opacity-50"
                    >
                        <MdRefresh size={20} className={loading ? 'animate-spin' : ''} />
                        Force Rescan
                    </button>
                </div>
            </div>

            {/* Primary Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <SummaryCard
                    title="Total Records"
                    value={summary.totalRecords?.toLocaleString()}
                    icon={<MdStorage className="text-blue-600" size={24} />}
                    color="blue"
                />
                <SummaryCard
                    title="Total Emails"
                    value={summary.totalEmails?.toLocaleString()}
                    icon={<MdEmail className="text-emerald-600" size={24} />}
                    color="emerald"
                />
                <SummaryCard
                    title="Total Phones"
                    value={summary.totalPhones?.toLocaleString()}
                    icon={<MdPhone className="text-purple-600" size={24} />}
                    color="purple"
                />
                <SummaryCard
                    title="Total Websites"
                    value={summary.totalWebsites?.toLocaleString()}
                    icon={<MdLanguage className="text-orange-600" size={24} />}
                    color="orange"
                />
            </div>

            {/* Secondary Stats - Social Media */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <MiniCard title="LinkedIn" value={summary.totalLinkedin?.toLocaleString()} icon={<FaLinkedin className="text-blue-700" />} />
                <MiniCard title="Facebook" value={summary.totalFacebook?.toLocaleString()} icon={<FaFacebook className="text-blue-600" />} />
                <MiniCard title="Instagram" value={summary.totalInstagram?.toLocaleString()} icon={<FaInstagram className="text-pink-600" />} />
                <MiniCard title="Twitter/X" value={summary.totalTwitter?.toLocaleString()} icon={<FaXTwitter className="text-slate-800" />} />
                <MiniCard title="TikTok" value={summary.totalTiktok?.toLocaleString()} icon={<FaTiktok className="text-slate-800" />} />
                <MiniCard title="YouTube" value={summary.totalYoutube?.toLocaleString()} icon={<FaYoutube className="text-red-600" />} />
            </div>

            {/* Meta Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <SummaryCard
                    title="Countries"
                    value={summary.totalCountries}
                    icon={<MdPublic className="text-cyan-600" size={24} />}
                    color="cyan"
                />
                <SummaryCard
                    title="Categories"
                    value={summary.totalCategories?.toLocaleString()}
                    icon={<MdCategory className="text-amber-600" size={24} />}
                    color="amber"
                />
                <SummaryCard
                    title="Data Coverage"
                    value={summary.totalRecords > 0 ? `${Math.round((summary.totalEmails / summary.totalRecords) * 100)}% emails` : '0%'}
                    icon={<MdLink className="text-indigo-600" size={24} />}
                    color="indigo"
                />
            </div>

            {/* Country Breakdown */}
            <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-700">Country Breakdown</h2>
                    <p className="text-sm text-slate-400 mt-1">Accurate data counts per country from merged CSVs</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 tracking-wider">
                            <tr className="border-b border-slate-100">
                                <th className="px-6 py-4">Country</th>
                                <th className="px-6 py-4 text-right">Records</th>
                                <th className="px-6 py-4 text-right">Emails</th>
                                <th className="px-6 py-4 text-right">Phones</th>
                                <th className="px-6 py-4 text-right">Websites</th>
                                <th className="px-6 py-4 text-right">Categories</th>
                                <th className="px-6 py-4 text-right">Size</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stats?.countries?.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 bg-slate-50/50">
                                        No country data available
                                    </td>
                                </tr>
                            ) : (
                                stats?.countries?.map((country, index) => (
                                    <tr key={index} className="hover:bg-slate-50 transition duration-150">
                                        <td className="px-6 py-4 font-medium text-slate-800">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{getFlag(country.code)}</span>
                                                <div>
                                                    <p className="font-semibold">{country.name}</p>
                                                    <p className="text-xs text-slate-400">{country.code}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-slate-700">{country.totalRecords?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-emerald-600">{country.totalEmails?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-purple-600">{country.totalPhones?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-orange-600">{country.totalWebsites?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-slate-600">{country.totalCategories}</td>
                                        <td className="px-6 py-4 text-right text-slate-400 text-xs">{country.totalSize}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}

function SummaryCard({ title, value, icon, color }) {
    return (
        <div className={`bg-white p-6 rounded-xl shadow-md border-l-4 border-${color}-500 flex items-center justify-between hover:shadow-lg transition-shadow`}>
            <div>
                <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{value || 0}</h3>
            </div>
            <div className={`p-3 rounded-full bg-${color}-50`}>
                {icon}
            </div>
        </div>
    );
}

function MiniCard({ title, value, icon }) {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="p-2 rounded-lg bg-slate-50">
                {icon}
            </div>
            <div>
                <p className="text-xs text-slate-400 font-medium">{title}</p>
                <p className="text-lg font-bold text-slate-700">{value || 0}</p>
            </div>
        </div>
    );
}

function getFlag(code) {
    const flags = { US: '🇺🇸', UK: '🇬🇧', CA: '🇨🇦', AU: '🇦🇺', IN: '🇮🇳', DE: '🇩🇪', FR: '🇫🇷', JP: '🇯🇵', BR: '🇧🇷', MX: '🇲🇽' };
    return flags[code] || '🌍';
}
