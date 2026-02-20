'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { MdRefresh, MdSearch, MdFilterList, MdLocationOn, MdCategory, MdEmail, MdPhone, MdStorage, MdChevronLeft, MdChevronRight } from 'react-icons/md';

export default function OverviewPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 20;
    
    // Reset page on search
    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    // Fetch on page or search change
    useEffect(() => {
        const isAuth = localStorage.getItem('admin_auth');
        const role = localStorage.getItem('user_role');

        if (!isAuth) {
            router.push('/login');
            return;
        }

        if (role !== 'admin') {
            router.push('/sales-dashboard'); // Redirect sales away from here
            return;
        }

        const timer = setTimeout(() => {
            fetchOverview(page, searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [page, searchTerm]);

    const router = useRouter();

    const fetchOverview = async (pageNum, search) => {
        setLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
            const res = await fetch(`${API_URL}/api/scraper/dataset/global-stats?page=${pageNum}&limit=${limit}&search=${encodeURIComponent(search)}`);
            const responseData = await res.json();
            if (responseData.success) {
                setData(responseData.data);
                if (responseData.data.pagination) {
                    setTotalPages(responseData.data.pagination.totalPages);
                }
            }
        } catch (error) {
            console.error("Error fetching overview:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper for pagination UI
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    if (loading && !data) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <AdminLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Data Overview</h1>
                    <p className="text-slate-500 mt-1">Comprehensive statistics of your B2B database</p>
                </div>
                <button 
                    onClick={() => fetchOverview(page, searchTerm)} 
                    className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition flex items-center gap-2 font-medium cursor-pointer"
                >
                    <MdRefresh size={20} />
                    Refresh Stats
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <SummaryCard 
                    title="Total Records" 
                    value={data?.summary?.totalRecords?.toLocaleString()} 
                    icon={<MdStorage className="text-blue-600" size={24} />} 
                    color="blue"
                />
                <SummaryCard 
                    title="Total Emails" 
                    value={data?.summary?.totalEmails?.toLocaleString()} 
                    icon={<MdEmail className="text-emerald-600" size={24} />} 
                    color="emerald"
                />
                <SummaryCard 
                    title="Total Phones" 
                    value={data?.summary?.totalPhones?.toLocaleString()} 
                    icon={<MdPhone className="text-purple-600" size={24} />} 
                    color="purple"
                />
                <SummaryCard 
                    title="Unique Locations" 
                    value={data?.summary?.uniqueLocations?.toLocaleString()} 
                    icon={<MdLocationOn className="text-orange-600" size={24} />} 
                    color="orange"
                />
            </div>

            {/* Detailed Table */}
            <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-lg font-bold text-slate-700">Database Breakdown</h2>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Filter by Category or Location..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
                        />
                        <MdSearch className="absolute left-3 top-2.5 text-slate-400" size={20} />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 tracking-wider">
                            <tr className="border-b border-slate-100">
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4 text-right">Records</th>
                                <th className="px-6 py-4 text-right">Emails</th>
                                <th className="px-6 py-4 text-right">Phones</th>

                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data?.details?.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 bg-slate-50/50">
                                        <div className="flex flex-col items-center">
                                            <MdFilterList size={40} className="mb-2 opacity-50" />
                                            <p>No data found matching your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data?.details?.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50 transition duration-150">
                                        <td className="px-6 py-4 font-medium text-slate-800">
                                            <div className="flex items-center gap-2">
                                                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                                                    <MdCategory />
                                                </span>
                                                {item.category}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <MdLocationOn className="text-slate-400" />
                                                {item.location}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-slate-700">{item.totalRecords?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-emerald-600">{item.totalEmails?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-purple-600">{item.totalPhones?.toLocaleString()}</td>

                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data?.pagination?.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                        <p className="text-xs text-slate-500">
                            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, data?.pagination?.total)} of {data?.pagination?.total}
                        </p>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={() => handlePageChange(Math.max(1, page - 1))} 
                                disabled={page === 1} 
                                className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-30 transition"
                            >
                                <MdChevronLeft size={20} />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) pageNum = i + 1;
                                else if (page <= 3) pageNum = i + 1;
                                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                                else pageNum = page - 2 + i;
                                return (
                                    <button 
                                        key={pageNum} 
                                        onClick={() => handlePageChange(pageNum)} 
                                        className={`w-8 h-8 rounded-md text-sm font-medium transition ${page === pageNum ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button 
                                onClick={() => handlePageChange(Math.min(totalPages, page + 1))} 
                                disabled={page === totalPages} 
                                className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-30 transition"
                            >
                                <MdChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
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
