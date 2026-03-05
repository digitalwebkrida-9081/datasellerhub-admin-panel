'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import {
    MdRefresh, MdSearch, MdFilterList, MdStorage, MdPublic, MdCategory,
    MdChevronLeft, MdChevronRight, MdVisibility, MdClose, MdExpandMore,
    MdEmail, MdPhone, MdLanguage, MdEdit, MdCheck, MdArrowBack,
    MdFolder, MdDescription, MdVerified, MdInfoOutline
} from 'react-icons/md';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

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
    const [categorySearch, setCategorySearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
    const limit = 25;
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewRow, setPreviewRow] = useState(null);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);

    // File-level preview
    const [filePreviewOpen, setFilePreviewOpen] = useState(false);
    const [filePreviewData, setFilePreviewData] = useState(null);
    const [filePreviewName, setFilePreviewName] = useState('');
    const [filePreviewLoading, setFilePreviewLoading] = useState(false);
    const [filePreviewMeta, setFilePreviewMeta] = useState(null);

    // Price editing
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({ category: '', price: '', previousPrice: '' });
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [bulkData, setBulkData] = useState({ price: '', previousPrice: '' });

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
            const res = await fetch(`${API_URL}/api/merged/countries`);
            const json = await res.json();
            if (json.success) setCountries(json.data.countries);
        } catch (err) { console.error('Error fetching countries:', err); }
        finally { setLoading(false); }
    };

    // Fetch stats
    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_URL}/api/merged/stats`);
            const json = await res.json();
            if (json.success) setStats(json.data);
        } catch (err) { console.error('Error fetching stats:', err); }
    };

    // Fetch ALL categories (no 20-limit) when country changes
    useEffect(() => {
        if (!selectedCountry) { setCategories([]); setSelectedCategory(''); setData([]); return; }
        setCategoriesLoading(true);
        setSelectedCategory('');
        setData([]);
        setCategorySearch('');
        fetch(`${API_URL}/api/merged/categories?country=${selectedCountry}&limit=9999`)
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
            const res = await fetch(`${API_URL}/api/merged/data?${params}`);
            const json = await res.json();
            if (json.success) {
                setData(json.data.data);
                setPagination(json.data.pagination);
            }
        } catch (err) { console.error('Error fetching data:', err); }
        finally { setDataLoading(false); }
    };

    // File-level preview
    const handleFilePreview = async (categoryName, meta = null) => {
        setFilePreviewName(categoryName);
        setFilePreviewOpen(true);
        setFilePreviewLoading(true);
        setFilePreviewData(null);
        setFilePreviewMeta(meta);
        try {
            const params = new URLSearchParams({ country: selectedCountry, category: categoryName });
            const res = await fetch(`${API_URL}/api/merged/preview?${params}`);
            const json = await res.json();
            if (json.success) setFilePreviewData(json.data);
        } catch (err) {
            console.error('Error fetching preview:', err);
        } finally {
            setFilePreviewLoading(false);
        }
    };

    // Price editing
    const handleEditPrice = (cat) => {
        setEditData({
            category: cat.name,
            price: cat.price ? cat.price.replace('$', '') : '',
            previousPrice: cat.previousPrice ? cat.previousPrice.replace('$', '') : ''
        });
        setEditModalOpen(true);
    };

    const savePrice = async () => {
        try {
            const res = await fetch(`${API_URL}/api/merged/update-price`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    country: selectedCountry,
                    category: editData.category,
                    price: `$${editData.price}`,
                    previousPrice: editData.previousPrice ? `$${editData.previousPrice}` : undefined
                })
            });
            const json = await res.json();
            if (json.success) {
                setEditModalOpen(false);
                // Re-fetch categories to update prices
                fetch(`${API_URL}/api/merged/categories?country=${selectedCountry}&limit=9999`)
                    .then(res => res.json())
                    .then(json => { if (json.success) setCategories(json.data.categories); });
            } else {
                alert('Failed: ' + json.message);
            }
        } catch (err) {
            console.error('Error saving price:', err);
            alert('Error saving price');
        }
    };

    const handleBulkUpdate = () => {
        setBulkData({ price: '', previousPrice: '' });
        setBulkModalOpen(true);
    };

    const saveBulkPrice = async () => {
        if (!confirm(`Update price for ALL categories in ${selectedCountry}? This cannot be undone.`)) return;
        try {
            const res = await fetch(`${API_URL}/api/merged/bulk-update-price`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    country: selectedCountry,
                    price: `$${bulkData.price}`,
                    previousPrice: bulkData.previousPrice ? `$${bulkData.previousPrice}` : undefined
                })
            });
            const json = await res.json();
            if (json.success) {
                alert(json.message);
                setBulkModalOpen(false);
                fetch(`${API_URL}/api/merged/categories?country=${selectedCountry}&limit=9999`)
                    .then(res => res.json())
                    .then(json => { if (json.success) setCategories(json.data.categories); });
            } else {
                alert('Failed: ' + json.message);
            }
        } catch (err) {
            console.error('Error bulk updating:', err);
            alert('Error bulk updating price');
        }
    };

    // Filter categories by search
    const filteredCategories = useMemo(() => {
        if (!categorySearch.trim()) return categories;
        const lower = categorySearch.toLowerCase();
        return categories.filter(cat =>
            cat.displayName.toLowerCase().includes(lower) ||
            cat.name.toLowerCase().includes(lower)
        );
    }, [categories, categorySearch]);

    // Helpers
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
                    <h1 className="text-3xl font-bold text-slate-800">CSV Data Manager</h1>
                    <p className="text-slate-500 mt-1">Browse, manage pricing, preview and verify all CSV datasets</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { fetchCountries(); fetchStats(); }}
                        className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition flex items-center gap-2 font-medium cursor-pointer"
                    >
                        <MdRefresh size={20} />
                        Refresh
                    </button>
                    {selectedCountry && categories.length > 0 && (
                        <button
                            onClick={handleBulkUpdate}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2 font-medium cursor-pointer shadow-sm"
                        >
                            <MdEdit size={20} />
                            Bulk Update Price
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    <StatsCard title="Countries" value={stats.summary.totalCountries} icon={<MdPublic size={22} />} color="blue" />
                    <StatsCard title="Categories" value={stats.summary.totalCategories?.toLocaleString()} icon={<MdCategory size={22} />} color="emerald" />
                    <StatsCard title="Records" value={stats.summary.totalRecords?.toLocaleString()} icon={<MdStorage size={22} />} color="purple" />
                    <StatsCard title="Emails" value={stats.summary.totalEmails?.toLocaleString()} icon={<MdEmail size={22} />} color="teal" />
                    <StatsCard title="Phones" value={stats.summary.totalPhones?.toLocaleString()} icon={<MdPhone size={22} />} color="indigo" />
                    <StatsCard title="Websites" value={stats.summary.totalWebsites?.toLocaleString()} icon={<MdLanguage size={22} />} color="orange" />
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
                            {/* Data Presence Badges */}
                            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                                {country.totalEmails > 0 && <DataBadge icon={<MdEmail size={12} />} label="Emails" value={formatNumber(country.totalEmails)} color="emerald" />}
                                {country.totalPhones > 0 && <DataBadge icon={<MdPhone size={12} />} label="Phones" value={formatNumber(country.totalPhones)} color="purple" />}
                                {country.totalWebsites > 0 && <DataBadge icon={<MdLanguage size={12} />} label="Websites" value={formatNumber(country.totalWebsites)} color="orange" />}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Selected Country View */}
            {selectedCountry && (
                <>
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 mb-6 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm text-sm">
                        <button onClick={() => { setSelectedCountry(''); setSelectedCategory(''); setData([]); }} className="text-slate-400 hover:text-blue-600 transition p-1 rounded hover:bg-slate-100 cursor-pointer">
                            <MdArrowBack size={18} />
                        </button>
                        <button
                            onClick={() => { setSelectedCountry(''); setSelectedCategory(''); setData([]); }}
                            className="text-slate-500 hover:text-blue-600 font-medium transition cursor-pointer"
                        >
                            🌍 All Countries
                        </button>
                        <MdChevronRight className="text-slate-300" size={16} />
                        <span className="text-blue-600 font-medium flex items-center gap-1.5">
                            {getFlag(selectedCountry)} {countries.find(c => c.code === selectedCountry)?.name || selectedCountry}
                        </span>
                        {selectedCategory && (
                            <>
                                <MdChevronRight className="text-slate-300" size={16} />
                                <span className="text-slate-800 font-semibold">{formatColumnName(selectedCategory)}</span>
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
                                {filteredCategories.map(cat => (
                                    <option key={cat.name} value={cat.name}>
                                        {cat.displayName} ({cat.records?.toLocaleString()} records • {cat.fileSizeFormatted})
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-[2.1rem] pointer-events-none text-slate-500">
                                <MdExpandMore size={16} />
                            </div>
                        </div>

                        <div className="relative">
                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Filter Categories</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Type to filter categories..."
                                    value={categorySearch}
                                    onChange={(e) => setCategorySearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                                <MdSearch className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            </div>
                        </div>

                        <div className="relative">
                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Search Records</label>
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

                    {/* ========================================
                        CATEGORIES TABLE (when no category is selected)
                       ======================================== */}
                    {!selectedCategory && (
                        <>
                            {categoriesLoading ? (
                                <div className="bg-white rounded-xl border border-slate-200 p-12 flex justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : filteredCategories.length > 0 ? (
                                <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200">
                                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                                            <MdCategory size={16} />
                                            All Datasets
                                            <span className="text-xs font-normal text-slate-400">
                                                ({filteredCategories.length}{categorySearch ? ` of ${categories.length}` : ''} categories)
                                            </span>
                                        </h2>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <MdDescription size={14} />
                                            CSV Files
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
                                        <table className="w-full text-left text-sm text-slate-600">
                                            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 tracking-wider sticky top-0 z-10">
                                                <tr className="border-b border-slate-100">
                                                    <th className="px-5 py-3">Category</th>
                                                    <th className="px-5 py-3 text-right">Records</th>
                                                    <th className="px-5 py-3 text-center">Data Fields</th>
                                                    <th className="px-5 py-3 text-right">Size</th>
                                                    <th className="px-5 py-3">Price</th>
                                                    <th className="px-5 py-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredCategories.map((cat, idx) => (
                                                    <tr key={idx} className="hover:bg-blue-50/30 transition duration-150 group">
                                                        <td className="px-5 py-3">
                                                            <button
                                                                onClick={() => setSelectedCategory(cat.name)}
                                                                className="text-left cursor-pointer group/name"
                                                            >
                                                                <span className="font-semibold text-slate-800 group-hover/name:text-blue-600 transition block">
                                                                    {cat.displayName}
                                                                </span>
                                                                <span className="text-[11px] text-slate-400 font-mono">{cat.fileName}</span>
                                                            </button>
                                                        </td>
                                                        <td className="px-5 py-3 text-right">
                                                            <span className="font-bold text-slate-700">{cat.records?.toLocaleString()}</span>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                                                {cat.hasEmail && <FieldBadge label="Email" color="emerald" />}
                                                                {cat.hasPhone && <FieldBadge label="Phone" color="purple" />}
                                                                {cat.hasWebsite && <FieldBadge label="Web" color="blue" />}
                                                                {cat.hasLinkedin && <FieldBadge label="LinkedIn" color="sky" />}
                                                                {cat.hasFacebook && <FieldBadge label="FB" color="indigo" />}
                                                                {cat.hasInstagram && <FieldBadge label="IG" color="pink" />}
                                                                {cat.hasTwitter && <FieldBadge label="X" color="slate" />}
                                                                {cat.hasYoutube && <FieldBadge label="YT" color="red" />}
                                                                {cat.hasTiktok && <FieldBadge label="TT" color="fuchsia" />}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3 text-right text-slate-400 text-xs font-mono">{cat.fileSizeFormatted}</td>
                                                        <td className="px-5 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-semibold ${cat.price ? 'text-emerald-600' : 'text-slate-300'}`}>
                                                                    {cat.price || 'Not set'}
                                                                </span>
                                                                <button onClick={() => handleEditPrice(cat)} className="text-slate-400 hover:text-blue-600 transition p-1 rounded hover:bg-slate-100 cursor-pointer">
                                                                    <MdEdit size={14} />
                                                                </button>
                                                            </div>
                                                            {cat.previousPrice && (
                                                                <span className="text-xs text-slate-400 line-through">{cat.previousPrice}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button
                                                                    onClick={() => handleFilePreview(cat.name, cat)}
                                                                    className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm cursor-pointer"
                                                                >
                                                                    Preview
                                                                </button>
                                                                <button
                                                                    onClick={() => setSelectedCategory(cat.name)}
                                                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
                                                                >
                                                                    Open →
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Category count footer */}
                                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
                                        <span>Showing {filteredCategories.length} of {categories.length} categories</span>
                                        <span>Total records: {categories.reduce((sum, c) => sum + (c.records || 0), 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                                    <MdFilterList size={40} className="mx-auto mb-2 opacity-50" />
                                    <p className="font-medium">No categories found{categorySearch ? ` matching "${categorySearch}"` : ''}</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* ========================================
                        DATA TABLE (when category IS selected)
                       ======================================== */}
                    {selectedCategory && (
                        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => { setSelectedCategory(''); setData([]); setSearchTerm(''); }}
                                        className="text-slate-400 hover:text-blue-600 transition p-1 rounded hover:bg-slate-100 cursor-pointer"
                                    >
                                        <MdArrowBack size={18} />
                                    </button>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-700">
                                            {formatColumnName(selectedCategory)}
                                        </h2>
                                        <span className="text-sm text-slate-400">
                                            {pagination.total?.toLocaleString()} records
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        const cat = categories.find(c => c.name === selectedCategory);
                                        handleFilePreview(selectedCategory, cat);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1"
                                >
                                    <MdInfoOutline size={16} />
                                    File Info
                                </button>
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

            {/* ========================================
                ROW DETAIL MODAL
               ======================================== */}
            {previewOpen && previewRow && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800">{previewRow.name || 'Record Details'}</h2>
                            <button onClick={() => setPreviewOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
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

            {/* ========================================
                FILE PREVIEW + VERIFICATION MODAL
               ======================================== */}
            {filePreviewOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">📄 {formatColumnName(filePreviewName)}</h2>
                                <p className="text-xs text-slate-400 mt-0.5">File preview and data verification</p>
                            </div>
                            <button onClick={() => setFilePreviewOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <MdClose size={24} />
                            </button>
                        </div>

                        {/* Verification Badges */}
                        {filePreviewMeta && (
                            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                                <div className="flex flex-wrap gap-3 items-center">
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <MdVerified size={16} className="text-blue-500" />
                                        <span className="font-semibold text-slate-600">{filePreviewMeta.records?.toLocaleString()} records</span>
                                    </div>
                                    <span className="text-slate-300">|</span>
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <MdDescription size={14} className="text-slate-400" />
                                        <span className="text-slate-500">{filePreviewMeta.fileSizeFormatted} • CSV</span>
                                    </div>
                                    <span className="text-slate-300">|</span>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {filePreviewMeta.hasEmail && <VerifyBadge label="Email" ok />}
                                        {!filePreviewMeta.hasEmail && <VerifyBadge label="Email" />}
                                        {filePreviewMeta.hasPhone && <VerifyBadge label="Phone" ok />}
                                        {!filePreviewMeta.hasPhone && <VerifyBadge label="Phone" />}
                                        {filePreviewMeta.hasWebsite && <VerifyBadge label="Website" ok />}
                                        {!filePreviewMeta.hasWebsite && <VerifyBadge label="Website" />}
                                        {filePreviewMeta.hasLinkedin && <VerifyBadge label="LinkedIn" ok />}
                                        {filePreviewMeta.hasFacebook && <VerifyBadge label="Facebook" ok />}
                                        {filePreviewMeta.hasInstagram && <VerifyBadge label="Instagram" ok />}
                                    </div>
                                    {filePreviewMeta.price && (
                                        <>
                                            <span className="text-slate-300">|</span>
                                            <span className="text-xs font-semibold text-emerald-600">Price: {filePreviewMeta.price}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-auto p-4">
                            {filePreviewLoading ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : filePreviewData ? (
                                <>
                                    <p className="text-xs text-slate-400 mb-3">
                                        Showing first {filePreviewData.rows?.length || 0} of {filePreviewData.totalRecords?.toLocaleString()} total records
                                    </p>
                                    <table className="w-full text-left text-xs text-slate-600">
                                        <thead className="bg-slate-50 font-bold text-slate-500 sticky top-0">
                                            <tr className="border-b border-slate-100">
                                                {(filePreviewData.columns || []).slice(0, 8).map(col => (
                                                    <th key={col} className="px-3 py-2 whitespace-nowrap">{formatColumnName(col)}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(filePreviewData.rows || []).map((row, i) => (
                                                <tr key={i} className="hover:bg-slate-50">
                                                    {(filePreviewData.columns || []).slice(0, 8).map(col => (
                                                        <td key={col} className="px-3 py-2 max-w-[200px] truncate">
                                                            {col.toLowerCase().includes('website') && row[col] ? (
                                                                <a href={row[col]} target="_blank" rel="noopener" className="text-blue-600 hover:underline">{row[col]}</a>
                                                            ) : (
                                                                row[col] || '-'
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            ) : (
                                <p className="text-center text-slate-400 py-12">No preview data available</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Price Edit Modals */}
            <PriceModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title={`Edit Price: ${formatColumnName(editData.category)}`}
                data={editData}
                setData={setEditData}
                onSave={savePrice}
            />
            <PriceModal
                isOpen={bulkModalOpen}
                onClose={() => setBulkModalOpen(false)}
                title={`Bulk Update Price — ${selectedCountry}`}
                data={bulkData}
                setData={setBulkData}
                onSave={saveBulkPrice}
            />
        </AdminLayout>
    );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

function StatsCard({ title, value, icon, color }) {
    const bgColors = {
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        purple: 'bg-purple-50 text-purple-600',
        teal: 'bg-teal-50 text-teal-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        orange: 'bg-orange-50 text-orange-600'
    };
    const borderColors = {
        blue: 'border-blue-200',
        emerald: 'border-emerald-200',
        purple: 'border-purple-200',
        teal: 'border-teal-200',
        indigo: 'border-indigo-200',
        orange: 'border-orange-200'
    };
    return (
        <div className={`bg-white p-5 rounded-xl shadow-sm border ${borderColors[color] || 'border-slate-200'} flex items-center gap-3 hover:shadow-md transition-shadow`}>
            <div className={`p-2.5 rounded-lg ${bgColors[color] || 'bg-slate-50 text-slate-600'}`}>
                {icon}
            </div>
            <div>
                <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wide">{title}</p>
                <h3 className="text-xl font-bold text-slate-800">{value || 0}</h3>
            </div>
        </div>
    );
}

function FieldBadge({ label, color }) {
    const colorClasses = {
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        purple: 'bg-purple-50 text-purple-600 border-purple-200',
        blue: 'bg-blue-50 text-blue-600 border-blue-200',
        sky: 'bg-sky-50 text-sky-600 border-sky-200',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
        pink: 'bg-pink-50 text-pink-600 border-pink-200',
        slate: 'bg-slate-100 text-slate-600 border-slate-200',
        red: 'bg-red-50 text-red-600 border-red-200',
        fuchsia: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200'
    };
    return (
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${colorClasses[color] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
            ✓ {label}
        </span>
    );
}

function DataBadge({ icon, label, value, color }) {
    const colorClasses = {
        emerald: 'text-emerald-600 bg-emerald-50',
        purple: 'text-purple-600 bg-purple-50',
        orange: 'text-orange-600 bg-orange-50'
    };
    return (
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${colorClasses[color] || 'text-slate-600 bg-slate-50'}`}>
            {icon} {value} {label}
        </span>
    );
}

function VerifyBadge({ label, ok }) {
    return (
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ok ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200 line-through'}`}>
            {ok ? '✓' : '✗'} {label}
        </span>
    );
}

function PriceModal({ isOpen, onClose, title, data, setData, onSave }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">{title}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
                        <input
                            type="number"
                            value={data.price}
                            onChange={e => setData({ ...data, price: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. 299"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Previous Price ($) <span className="text-slate-400 font-normal">(Optional, for strikethrough)</span>
                        </label>
                        <input
                            type="number"
                            value={data.previousPrice}
                            onChange={e => setData({ ...data, previousPrice: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. 598"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium cursor-pointer">Cancel</button>
                    <button onClick={onSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium cursor-pointer">Save Changes</button>
                </div>
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
