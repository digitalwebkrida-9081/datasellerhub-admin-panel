'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { MdRefresh, MdSearch, MdFilterList, MdStorage, MdPublic, MdCategory, MdChevronLeft, MdChevronRight, MdFileDownload, MdVisibility, MdClose, MdExpandMore } from 'react-icons/md';

const DATA_API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function ScrapedDataPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [countries, setCountries] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
    const limit = 20;
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewRow, setPreviewRow] = useState(null);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);

    // Auth check
    useEffect(() => {
        const isAuth = localStorage.getItem('admin_auth');
        const role = localStorage.getItem('user_role');
        if (!isAuth) { router.push('/login'); return; }
        if (role !== 'admin') { router.push('/sales-dashboard'); return; }
        fetchCountries();
        fetchStats();
    }, []);

    // Fetch countries
    const fetchCountries = async () => {
        try {
            const res = await fetch(`${DATA_API_URL}/api/merged/countries`);
            const json = await res.json();
            if (json.success) setCountries(json.data.countries);
        } catch (err) { console.error('Error fetching countries:', err); }
        finally { setLoading(false); }
    };

    // Fetch stats
    const fetchStats = async () => {
        try {
            const res = await fetch(`${DATA_API_URL}/api/merged/stats`);
            const json = await res.json();
            if (json.success) setStats(json.data);
        } catch (err) { console.error('Error fetching stats:', err); }
    };

    // Fetch categories when country changes
    useEffect(() => {
        if (!selectedCountry) { setCategories([]); setSelectedCategory(''); setData([]); return; }
        setCategoriesLoading(true);
        setSelectedCategory('');
        setData([]);
        fetch(`${DATA_API_URL}/api/merged/categories?country=${selectedCountry}`)
            .then(res => res.json())
            .then(json => { if (json.success) setCategories(json.data.categories); })
            .catch(err => console.error('Error:', err))
            .finally(() => setCategoriesLoading(false));
    }, [selectedCountry]);

    // Fetch data when category or page or search changes
    useEffect(() => {
        if (!selectedCountry || !selectedCategory) return;
        const timer = setTimeout(() => fetchData(), 400);
        return () => clearTimeout(timer);
    }, [selectedCountry, selectedCategory, page, searchTerm]);

    // Reset page on filter change
    useEffect(() => { setPage(1); }, [selectedCountry, selectedCategory, searchTerm]);

    const fetchData = async () => {
        setDataLoading(true);
        try {
            const params = new URLSearchParams({
                country: selectedCountry,
                category: selectedCategory,
                page: page.toString(),
                limit: limit.toString(),
                search: searchTerm
            });
            const res = await fetch(`${DATA_API_URL}/api/merged/data?${params}`);
            const json = await res.json();
            if (json.success) {
                setData(json.data.data);
                setPagination(json.data.pagination);
            }
        } catch (err) { console.error('Error fetching data:', err); }
        finally { setDataLoading(false); }
    };

    // Get dynamic column headers from data
    const columns = data.length > 0 ? Object.keys(data[0]).slice(0, 8) : [];
    const allColumns = data.length > 0 ? Object.keys(data[0]) : [];

    const formatColumnName = (col) => col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Scraped Data</h1>
                    <p className="text-slate-500 mt-1">Browse merged datasets from all countries</p>
                </div>
                <button
                    onClick={() => { fetchCountries(); fetchStats(); }}
                    className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition flex items-center gap-2 font-medium cursor-pointer"
                >
                    <MdRefresh size={20} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatsCard
                        title="Countries"
                        value={stats.summary.totalCountries}
                        icon={<MdPublic className="text-blue-600" size={24} />}
                        color="blue"
                    />
                    <StatsCard
                        title="Categories"
                        value={stats.summary.totalCategories?.toLocaleString()}
                        icon={<MdCategory className="text-emerald-600" size={24} />}
                        color="emerald"
                    />
                    <StatsCard
                        title="Total Records"
                        value={stats.summary.totalRecords?.toLocaleString()}
                        icon={<MdStorage className="text-purple-600" size={24} />}
                        color="purple"
                    />
                </div>
            )}

            {/* Country Cards */}
            {!selectedCountry && stats?.countries && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {stats.countries.map(country => (
                        <div
                            key={country.code}
                            onClick={() => setSelectedCountry(country.code)}
                            className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{getFlag(country.code)}</span>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition">{country.name}</h3>
                                        <p className="text-sm text-slate-500">{country.code}</p>
                                    </div>
                                </div>
                                <MdChevronRight size={24} className="text-slate-300 group-hover:text-blue-500 transition" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-slate-50 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-slate-800">{country.totalCategories}</p>
                                    <p className="text-xs text-slate-500">Categories</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-slate-800">{formatNumber(country.totalRecords)}</p>
                                    <p className="text-xs text-slate-500">Records</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-slate-800">{country.totalSize}</p>
                                    <p className="text-xs text-slate-500">Size</p>
                                </div>
                            </div>
                            {/* Top Categories */}
                            {country.topCategories && country.topCategories.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Top Categories</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {country.topCategories.slice(0, 5).map((cat, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md font-medium">
                                                {cat.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Filters (when country is selected) */}
            {selectedCountry && (
                <>
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 mb-6">
                        <button onClick={() => { setSelectedCountry(''); setSelectedCategory(''); setData([]); }} className="text-blue-600 hover:text-blue-800 font-medium text-sm transition">
                            All Countries
                        </button>
                        <MdChevronRight className="text-slate-400" size={16} />
                        <span className="text-slate-500 text-sm flex items-center gap-1.5">
                            {getFlag(selectedCountry)} {countries.find(c => c.code === selectedCountry)?.name || selectedCountry}
                        </span>
                        {selectedCategory && (
                            <>
                                <MdChevronRight className="text-slate-400" size={16} />
                                <span className="text-slate-800 font-medium text-sm">{formatColumnName(selectedCategory)}</span>
                            </>
                        )}
                    </div>

                    {/* Category Selector + Search */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                disabled={categoriesLoading}
                                className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white appearance-none disabled:bg-slate-100"
                            >
                                <option value="">Select Category... ({categories.length} available)</option>
                                {categories.map(cat => (
                                    <option key={cat.name} value={cat.name}>
                                        {cat.displayName} ({cat.fileSizeFormatted})
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-[2.1rem] pointer-events-none text-slate-500">
                                <MdExpandMore size={16} />
                            </div>
                        </div>

                        <div className="relative md:col-span-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Search</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search within data..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    disabled={!selectedCategory}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-slate-100"
                                />
                                <MdSearch className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Category Grid (when no category selected) */}
                    {!selectedCategory && categories.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-700 mb-4">
                                Available Categories ({categories.length})
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto">
                                {categories.map(cat => (
                                    <button
                                        key={cat.name}
                                        onClick={() => setSelectedCategory(cat.name)}
                                        className="text-left p-3 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition group"
                                    >
                                        <p className="font-medium text-sm text-slate-700 group-hover:text-blue-600 truncate">{cat.displayName}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{cat.fileSizeFormatted}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Data Table */}
                    {selectedCategory && (
                        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-700">
                                    {formatColumnName(selectedCategory)}
                                    <span className="text-sm font-normal text-slate-400 ml-2">
                                        {pagination.total?.toLocaleString()} records
                                    </span>
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 tracking-wider">
                                        <tr className="border-b border-slate-100">
                                            {columns.map(col => (
                                                <th key={col} className="px-4 py-3 whitespace-nowrap">{formatColumnName(col)}</th>
                                            ))}
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {dataLoading ? (
                                            <tr>
                                                <td colSpan={columns.length + 1} className="px-6 py-12 text-center">
                                                    <div className="flex justify-center">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : data.length === 0 ? (
                                            <tr>
                                                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-slate-400 bg-slate-50/50">
                                                    <MdFilterList size={40} className="mx-auto mb-2 opacity-50" />
                                                    <p>No data found</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            data.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-blue-50/30 transition duration-150">
                                                    {columns.map(col => (
                                                        <td key={col} className="px-4 py-3 max-w-[200px] truncate text-sm">
                                                            {col.toLowerCase().includes('website') && row[col] ? (
                                                                <a href={row[col]} target="_blank" rel="noopener" className="text-blue-600 hover:underline">Link</a>
                                                            ) : (
                                                                row[col] || '-'
                                                            )}
                                                        </td>
                                                    ))}
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            onClick={() => { setPreviewRow(row); setPreviewOpen(true); }}
                                                            className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition"
                                                            title="View Details"
                                                        >
                                                            <MdVisibility size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                                    <p className="text-xs text-slate-500">
                                        Showing {(page - 1) * limit + 1}-{Math.min(page * limit, pagination.total)} of {pagination.total?.toLocaleString()}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-30 transition"
                                        >
                                            <MdChevronLeft size={20} />
                                        </button>
                                        {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                                            let pageNum;
                                            if (pagination.totalPages <= 5) pageNum = i + 1;
                                            else if (page <= 3) pageNum = i + 1;
                                            else if (page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                                            else pageNum = page - 2 + i;
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setPage(pageNum)}
                                                    className={`w-8 h-8 rounded-md text-sm font-medium transition ${page === pageNum ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                        <button
                                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                            disabled={page === pagination.totalPages}
                                            className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-30 transition"
                                        >
                                            <MdChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Row Detail Modal */}
            {previewOpen && previewRow && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800">{previewRow.name || 'Record Details'}</h2>
                            <button onClick={() => setPreviewOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <MdClose size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-6">
                            <div className="space-y-3">
                                {allColumns.map(col => (
                                    <div key={col} className="flex flex-col sm:flex-row gap-1 sm:gap-4 py-2 border-b border-slate-50">
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide sm:w-40 flex-shrink-0">
                                            {formatColumnName(col)}
                                        </span>
                                        <span className="text-sm text-slate-700 break-all">
                                            {col.toLowerCase().includes('website') && previewRow[col] ? (
                                                <a href={previewRow[col]} target="_blank" rel="noopener" className="text-blue-600 hover:underline">{previewRow[col]}</a>
                                            ) : (
                                                previewRow[col] || '-'
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

function StatsCard({ title, value, icon, color }) {
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

function getFlag(code) {
    const flags = { US: '🇺🇸', UK: '🇬🇧', CA: '🇨🇦', AU: '🇦🇺', IN: '🇮🇳', DE: '🇩🇪', FR: '🇫🇷', JP: '🇯🇵', BR: '🇧🇷', MX: '🇲🇽' };
    return flags[code] || '🌍';
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
}
