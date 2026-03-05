'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import {
    MdRefresh, MdSearch, MdFilterList, MdStorage, MdPublic, MdCategory,
    MdChevronLeft, MdChevronRight, MdVisibility, MdClose, MdExpandMore,
    MdEmail, MdPhone, MdLanguage, MdDashboard, MdEdit, MdClear,
    MdTableChart, MdFolder
} from 'react-icons/md';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function AllDataPage() {
    const router = useRouter();

    // --- SHARED STATE ---
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('scraped'); // 'scraped' | 'b2b'

    // --- SCRAPED DATA STATE ---
    const [scrapedStats, setScrapedStats] = useState(null);
    const [countries, setCountries] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [scrapedData, setScrapedData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [scrapedPage, setScrapedPage] = useState(1);
    const [scrapedPagination, setScrapedPagination] = useState({ total: 0, totalPages: 0 });
    const scrapedLimit = 20;
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewRow, setPreviewRow] = useState(null);
    const [categorySearch, setCategorySearch] = useState('');
    const [filePreviewOpen, setFilePreviewOpen] = useState(false);
    const [filePreviewData, setFilePreviewData] = useState(null);
    const [filePreviewName, setFilePreviewName] = useState('');
    const [filePreviewLoading, setFilePreviewLoading] = useState(false);
    const [filePreviewMeta, setFilePreviewMeta] = useState(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({ category: '', price: '', previousPrice: '' });
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [bulkData, setBulkData] = useState({ price: '', previousPrice: '' });

    // --- B2B DATA STATE ---
    const [b2bLeads, setB2bLeads] = useState([]);
    const [b2bLoading, setB2bLoading] = useState(false);
    const [b2bFilters, setB2bFilters] = useState({ country: '', city: '', state: '', category: '' });
    const [b2bPage, setB2bPage] = useState(1);
    const [b2bTotalPages, setB2bTotalPages] = useState(1);
    const [b2bTotalRecords, setB2bTotalRecords] = useState(0);
    const b2bLimit = 15;
    const [b2bStats, setB2bStats] = useState(null);
    const [countryOptions, setCountryOptions] = useState([]);
    const [stateOptions, setStateOptions] = useState([]);
    const [cityOptions, setCityOptions] = useState([]);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [b2bPreviewData, setB2bPreviewData] = useState(null);
    const [b2bPreviewOpen, setB2bPreviewOpen] = useState(false);
    const [b2bPreviewName, setB2bPreviewName] = useState('');

    // Auth check
    useEffect(() => {
        const isAuth = localStorage.getItem('admin_auth');
        const role = localStorage.getItem('user_role');
        if (!isAuth) { router.push('/login'); return; }
        if (role !== 'admin') { router.push('/sales-dashboard'); return; }
        
        // Load both data sources in parallel
        Promise.all([
            fetchCountries(),
            fetchScrapedStats(),
            fetchB2bOptions('country'),
            fetchB2bStats()
        ]).finally(() => setLoading(false));
    }, []);

    // ==========================================
    // SCRAPED DATA METHODS
    // ==========================================
    const fetchCountries = async () => {
        try {
            const res = await fetch(`${API_URL}/api/merged/countries`);
            const json = await res.json();
            if (json.success) setCountries(json.data.countries);
        } catch (err) { console.error('Error fetching countries:', err); }
    };

    const fetchScrapedStats = async () => {
        try {
            const res = await fetch(`${API_URL}/api/merged/stats`);
            const json = await res.json();
            if (json.success) setScrapedStats(json.data);
        } catch (err) { console.error('Error fetching stats:', err); }
    };

    useEffect(() => {
        if (!selectedCountry) { setCategories([]); setSelectedCategory(''); setScrapedData([]); return; }
        setCategoriesLoading(true);
        setSelectedCategory('');
        setScrapedData([]);
        setCategorySearch('');
        fetch(`${API_URL}/api/merged/categories?country=${selectedCountry}&limit=9999`)
            .then(res => res.json())
            .then(json => { if (json.success) setCategories(json.data.categories); })
            .catch(err => console.error('Error:', err))
            .finally(() => setCategoriesLoading(false));
    }, [selectedCountry]);

    const filteredCategories = React.useMemo(() => {
        if (!categorySearch.trim()) return categories;
        const lower = categorySearch.toLowerCase();
        return categories.filter(cat => cat.displayName.toLowerCase().includes(lower) || cat.name.toLowerCase().includes(lower));
    }, [categories, categorySearch]);

    useEffect(() => {
        if (!selectedCountry || !selectedCategory) return;
        const timer = setTimeout(() => fetchScrapedData(), 400);
        return () => clearTimeout(timer);
    }, [selectedCountry, selectedCategory, scrapedPage, searchTerm]);

    useEffect(() => { setScrapedPage(1); }, [selectedCountry, selectedCategory, searchTerm]);

    const fetchScrapedData = async () => {
        setDataLoading(true);
        try {
            const params = new URLSearchParams({
                country: selectedCountry, category: selectedCategory,
                page: scrapedPage.toString(), limit: scrapedLimit.toString(), search: searchTerm
            });
            const res = await fetch(`${API_URL}/api/merged/data?${params}`);
            const json = await res.json();
            if (json.success) {
                setScrapedData(json.data.data);
                setScrapedPagination(json.data.pagination);
            }
        } catch (err) { console.error('Error fetching data:', err); }
        finally { setDataLoading(false); }
    };

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
        } catch (err) { console.error('Error fetching preview:', err); }
        finally { setFilePreviewLoading(false); }
    };

    const handleEditPrice = (cat) => {
        setEditData({ category: cat.name, price: cat.price ? cat.price.replace('$', '') : '', previousPrice: cat.previousPrice ? cat.previousPrice.replace('$', '') : '' });
        setEditModalOpen(true);
    };

    const savePrice = async () => {
        try {
            const res = await fetch(`${API_URL}/api/merged/update-price`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ country: selectedCountry, category: editData.category, price: `$${editData.price}`, previousPrice: editData.previousPrice ? `$${editData.previousPrice}` : undefined })
            });
            const json = await res.json();
            if (json.success) {
                setEditModalOpen(false);
                fetch(`${API_URL}/api/merged/categories?country=${selectedCountry}&limit=9999`)
                    .then(r => r.json()).then(j => { if (j.success) setCategories(j.data.categories); });
            } else alert('Failed: ' + json.message);
        } catch (err) { alert('Error saving price'); }
    };

    const handleBulkUpdate = () => { setBulkData({ price: '', previousPrice: '' }); setBulkModalOpen(true); };

    const saveBulkPrice = async () => {
        if (!confirm(`Update price for ALL categories in ${selectedCountry}?`)) return;
        try {
            const res = await fetch(`${API_URL}/api/merged/bulk-update-price`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ country: selectedCountry, price: `$${bulkData.price}`, previousPrice: bulkData.previousPrice ? `$${bulkData.previousPrice}` : undefined })
            });
            const json = await res.json();
            if (json.success) {
                alert(json.message); setBulkModalOpen(false);
                fetch(`${API_URL}/api/merged/categories?country=${selectedCountry}&limit=9999`)
                    .then(r => r.json()).then(j => { if (j.success) setCategories(j.data.categories); });
            } else alert('Failed: ' + json.message);
        } catch (err) { alert('Error bulk updating price'); }
    };

    // ==========================================
    // B2B DATA METHODS
    // ==========================================
    const fetchB2bLeads = useCallback(async () => {
        setB2bLoading(true);
        try {
            const params = new URLSearchParams();
            if (b2bFilters.country) params.append('country', b2bFilters.country);
            if (b2bFilters.city) params.append('city', b2bFilters.city);
            if (b2bFilters.state) params.append('state', b2bFilters.state);
            if (b2bFilters.category) params.append('category', b2bFilters.category);
            params.append('page', b2bPage);
            params.append('limit', b2bLimit);

            const res = await fetch(`${API_URL}/api/scraper/admin/datasets?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setB2bLeads(data.data);
                if (data.pagination) {
                    setB2bTotalPages(data.pagination.totalPages);
                    setB2bTotalRecords(data.pagination.total);
                }
            }
        } catch (error) {
            console.error("Error fetching B2B data:", error);
        } finally {
            setB2bLoading(false);
        }
    }, [b2bFilters, b2bPage]);

    const fetchB2bOptions = async (scope, parentParams = {}) => {
        try {
            const params = new URLSearchParams({ scope, ...parentParams });
            const res = await fetch(`${API_URL}/api/scraper/admin/filter-options?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                if (scope === 'country') setCountryOptions(data.data);
                return data.data;
            }
            return [];
        } catch (error) {
            console.error(`Error fetching ${scope} options:`, error);
            return [];
        }
    };

    const fetchB2bStats = async () => {
        try {
            const res = await fetch(`${API_URL}/api/scraper/admin/stats`);
            const data = await res.json();
            if (data.success) setB2bStats(data.stats);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    useEffect(() => { setB2bPage(1); }, [b2bFilters]);

    useEffect(() => {
        if (activeTab === 'b2b') {
            const timer = setTimeout(() => fetchB2bLeads(), 300);
            return () => clearTimeout(timer);
        }
    }, [b2bPage, b2bFilters, activeTab]);

    useEffect(() => {
        if (b2bFilters.country) {
            fetchB2bOptions('state', { country: b2bFilters.country }).then(setStateOptions);
            setCityOptions([]);
        } else { setStateOptions([]); setCityOptions([]); }
    }, [b2bFilters.country]);

    useEffect(() => {
        if (b2bFilters.state) {
            fetchB2bOptions('city', { country: b2bFilters.country, state: b2bFilters.state }).then(setCityOptions);
        } else { setCityOptions([]); }
    }, [b2bFilters.state]);

    useEffect(() => {
        if (b2bFilters.country) {
            const params = { country: b2bFilters.country };
            if (b2bFilters.state) params.state = b2bFilters.state;
            if (b2bFilters.city) params.city = b2bFilters.city;
            fetchB2bOptions('category', params).then(setCategoryOptions);
        } else { setCategoryOptions([]); }
    }, [b2bFilters.country, b2bFilters.state, b2bFilters.city]);

    const handleB2bFilterChange = (e) => {
        const { name, value } = e.target;
        let newFilters = { ...b2bFilters, [name]: value };
        if (name === 'country') { newFilters.state = ''; newFilters.city = ''; newFilters.category = ''; }
        else if (name === 'state') { newFilters.city = ''; newFilters.category = ''; }
        else if (name === 'city') { newFilters.category = ''; }
        setB2bFilters(newFilters);
    };

    const clearB2bFilters = () => { setB2bFilters({ country: '', city: '', state: '', category: '' }); };

    const handleB2bPreview = async (pathId, category) => {
        setB2bPreviewName(category);
        setB2bPreviewOpen(true);
        setB2bPreviewData(null);
        try {
            const res = await fetch(`${API_URL}/api/scraper/admin/dataset-preview?pathId=${encodeURIComponent(pathId)}`);
            const data = await res.json();
            if (data.success) setB2bPreviewData(data.data);
        } catch (error) { console.error("Error fetching preview:", error); }
    };

    // ==========================================
    // HELPERS
    // ==========================================
    const columns = scrapedData.length > 0 ? Object.keys(scrapedData[0]).slice(0, 8) : [];
    const allColumns = scrapedData.length > 0 ? Object.keys(scrapedData[0]) : [];
    const formatColumnName = (col) => col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    // Combined stats
    const combinedRecords = (scrapedStats?.summary?.totalRecords || 0) + (b2bStats?.totalRecords || 0);
    const combinedDatasets = (scrapedStats?.summary?.totalCategories || 0) + (b2bStats?.totalDatasets || 0);

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
                    <h1 className="text-3xl font-bold text-slate-800">All Datasets</h1>
                    <p className="text-slate-500 mt-1">Unified view of all scraped and B2B data sources</p>
                </div>
                <button
                    onClick={() => {
                        fetchCountries(); fetchScrapedStats(); fetchB2bStats();
                        if (activeTab === 'b2b') fetchB2bLeads();
                    }}
                    className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition flex items-center gap-2 font-medium cursor-pointer"
                >
                    <MdRefresh size={20} />
                    Refresh All
                </button>
            </div>

            {/* Combined Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-5 rounded-xl shadow-lg">
                    <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider">Total Records</p>
                    <h3 className="text-2xl font-bold mt-1">{combinedRecords.toLocaleString()}</h3>
                    <p className="text-blue-200 text-xs mt-1">Across all sources</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-5 rounded-xl shadow-lg">
                    <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Total Datasets</p>
                    <h3 className="text-2xl font-bold mt-1">{combinedDatasets.toLocaleString()}</h3>
                    <p className="text-emerald-200 text-xs mt-1">CSV + JSON files</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-5 rounded-xl shadow-lg">
                    <p className="text-purple-100 text-xs font-semibold uppercase tracking-wider">Scraped (CSV)</p>
                    <h3 className="text-2xl font-bold mt-1">{(scrapedStats?.summary?.totalRecords || 0).toLocaleString()}</h3>
                    <p className="text-purple-200 text-xs mt-1">{scrapedStats?.summary?.totalCountries || 0} countries</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-700 text-white p-5 rounded-xl shadow-lg">
                    <p className="text-orange-100 text-xs font-semibold uppercase tracking-wider">B2B (JSON)</p>
                    <h3 className="text-2xl font-bold mt-1">{(b2bStats?.totalRecords || 0).toLocaleString()}</h3>
                    <p className="text-orange-200 text-xs mt-1">{b2bStats?.totalDatasets || 0} datasets</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6">
                <button
                    onClick={() => setActiveTab('scraped')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-px cursor-pointer ${
                        activeTab === 'scraped'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <MdTableChart size={18} />
                    Scraped Data (CSV)
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full ml-1">
                        {(scrapedStats?.summary?.totalRecords || 0).toLocaleString()}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('b2b')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-px cursor-pointer ${
                        activeTab === 'b2b'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <MdFolder size={18} />
                    B2B Database (JSON)
                    <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full ml-1">
                        {(b2bStats?.totalRecords || 0).toLocaleString()}
                    </span>
                </button>
            </div>

            {/* ==========================================
                SCRAPED DATA TAB
               ========================================== */}
            {activeTab === 'scraped' && (
                <>
                    {/* Detailed Scraped Stats */}
                    {scrapedStats && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                            <MiniStat title="Countries" value={scrapedStats.summary.totalCountries} icon={<MdPublic size={18} />} />
                            <MiniStat title="Categories" value={scrapedStats.summary.totalCategories?.toLocaleString()} icon={<MdCategory size={18} />} />
                            <MiniStat title="Records" value={scrapedStats.summary.totalRecords?.toLocaleString()} icon={<MdStorage size={18} />} />
                            <MiniStat title="Emails" value={scrapedStats.summary.totalEmails?.toLocaleString()} icon={<MdEmail size={18} />} />
                            <MiniStat title="Phones" value={scrapedStats.summary.totalPhones?.toLocaleString()} icon={<MdPhone size={18} />} />
                            <MiniStat title="Websites" value={scrapedStats.summary.totalWebsites?.toLocaleString()} icon={<MdLanguage size={18} />} />
                        </div>
                    )}

                    {/* Country Cards */}
                    {!selectedCountry && scrapedStats?.countries && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                            {scrapedStats.countries.map(country => (
                                <div
                                    key={country.code}
                                    onClick={() => setSelectedCountry(country.code)}
                                    className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{getFlag(country.code)}</span>
                                            <div>
                                                <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition">{country.name}</h3>
                                                <p className="text-xs text-slate-500">{country.code}</p>
                                            </div>
                                        </div>
                                        <MdChevronRight size={22} className="text-slate-300 group-hover:text-blue-500 transition" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-slate-50 rounded-lg p-2 text-center">
                                            <p className="text-lg font-bold text-slate-800">{country.totalCategories}</p>
                                            <p className="text-[10px] text-slate-500">Categories</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-2 text-center">
                                            <p className="text-lg font-bold text-slate-800">{formatNumber(country.totalRecords)}</p>
                                            <p className="text-[10px] text-slate-500">Records</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-2 text-center">
                                            <p className="text-lg font-bold text-slate-800">{country.totalSize}</p>
                                            <p className="text-[10px] text-slate-500">Size</p>
                                        </div>
                                    </div>
                                    {country.topCategories && country.topCategories.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-slate-100">
                                            <div className="flex flex-wrap gap-1">
                                                {country.topCategories.slice(0, 4).map((cat, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded-md font-medium">{cat.name}</span>
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
                            <div className="flex items-center gap-2 mb-5">
                                <button onClick={() => { setSelectedCountry(''); setSelectedCategory(''); setScrapedData([]); }} className="text-blue-600 hover:text-blue-800 font-medium text-sm transition">
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

                            <div className="flex justify-end mb-4">
                                <button onClick={handleBulkUpdate} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2 font-medium cursor-pointer shadow-sm text-sm">
                                    <MdEdit size={16} /> Bulk Update Price
                                </button>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-5 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                            <option key={cat.name} value={cat.name}>{cat.displayName} ({cat.records?.toLocaleString()} • {cat.fileSizeFormatted})</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-[2.1rem] pointer-events-none text-slate-500"><MdExpandMore size={16} /></div>
                                </div>
                                <div className="relative">
                                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Filter Categories</label>
                                    <div className="relative">
                                        <input type="text" placeholder="Filter categories..." value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                        <MdSearch className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                    </div>
                                </div>
                                <div className="relative">
                                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Search Records</label>
                                    <div className="relative">
                                        <input type="text" placeholder="Search within data..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={!selectedCategory}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-slate-100"
                                        />
                                        <MdSearch className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                    </div>
                                </div>
                            </div>

                            {!selectedCategory && filteredCategories.length > 0 && (
                                <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200 mb-6">
                                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">All Datasets ({filteredCategories.length})</h2>
                                    </div>
                                    <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                                        <table className="w-full text-left text-sm text-slate-600">
                                            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 tracking-wider sticky top-0 z-10">
                                                <tr className="border-b border-slate-100">
                                                    <th className="px-5 py-3">Category</th>
                                                    <th className="px-5 py-3 text-right">Records</th>
                                                    <th className="px-5 py-3 text-right">Size</th>
                                                    <th className="px-5 py-3">Price</th>
                                                    <th className="px-5 py-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredCategories.map((cat, idx) => (
                                                    <tr key={idx} className="hover:bg-blue-50/30 transition group">
                                                        <td className="px-5 py-3">
                                                            <button onClick={() => setSelectedCategory(cat.name)} className="text-left cursor-pointer group/name">
                                                                <span className="font-semibold text-slate-800 group-hover/name:text-blue-600 block">{cat.displayName}</span>
                                                                <span className="text-[11px] text-slate-400 font-mono">{cat.fileName}</span>
                                                            </button>
                                                        </td>
                                                        <td className="px-5 py-3 text-right font-bold text-slate-700">{cat.records?.toLocaleString()}</td>
                                                        <td className="px-5 py-3 text-right text-slate-400 text-xs font-mono">{cat.fileSizeFormatted}</td>
                                                        <td className="px-5 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-semibold ${cat.price ? 'text-emerald-600' : 'text-slate-300'}`}>{cat.price || 'Not set'}</span>
                                                                <button onClick={() => handleEditPrice(cat)} className="text-slate-400 hover:text-blue-600 transition p-1 rounded hover:bg-slate-100 cursor-pointer"><MdEdit size={14} /></button>
                                                            </div>
                                                            {cat.previousPrice && <span className="text-xs text-slate-400 line-through">{cat.previousPrice}</span>}
                                                        </td>
                                                        <td className="px-5 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button onClick={() => handleFilePreview(cat.name, cat)} className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer">Preview</button>
                                                                <button onClick={() => setSelectedCategory(cat.name)} className="text-blue-600 hover:bg-blue-50 px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer">Open</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Data Table */}
                            {selectedCategory && (
                                <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200">
                                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                        <h2 className="text-base font-bold text-slate-700">
                                            {formatColumnName(selectedCategory)}
                                            <span className="text-sm font-normal text-slate-400 ml-2">{scrapedPagination.total?.toLocaleString()} records</span>
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
                                                    <tr><td colSpan={columns.length + 1} className="px-6 py-12 text-center">
                                                        <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                                                    </td></tr>
                                                ) : scrapedData.length === 0 ? (
                                                    <tr><td colSpan={columns.length + 1} className="px-6 py-12 text-center text-slate-400"><MdFilterList size={40} className="mx-auto mb-2 opacity-50" /><p>No data found</p></td></tr>
                                                ) : (
                                                    scrapedData.map((row, idx) => (
                                                        <tr key={idx} className="hover:bg-blue-50/30 transition duration-150">
                                                            {columns.map(col => (
                                                                <td key={col} className="px-4 py-3 max-w-[200px] truncate text-sm">
                                                                    {col.toLowerCase().includes('website') && row[col] ? (
                                                                        <a href={row[col]} target="_blank" rel="noopener" className="text-blue-600 hover:underline">Link</a>
                                                                    ) : (row[col] || '-')}
                                                                </td>
                                                            ))}
                                                            <td className="px-4 py-3 text-right">
                                                                <button onClick={() => { setPreviewRow(row); setPreviewOpen(true); }} className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition" title="View Details">
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
                                    {scrapedPagination.totalPages > 1 && (
                                        <PaginationBar page={scrapedPage} setPage={setScrapedPage} totalPages={scrapedPagination.totalPages} total={scrapedPagination.total} limit={scrapedLimit} />
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* ==========================================
                B2B DATA TAB
               ========================================== */}
            {activeTab === 'b2b' && (
                <>
                    {/* B2B Stats */}
                    {b2bStats && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <MiniStat title="Total Datasets" value={b2bStats.totalDatasets} icon={<MdStorage size={18} />} />
                            <MiniStat title="Total Records" value={b2bStats.totalRecords?.toLocaleString()} icon={<MdFilterList size={18} />} />
                            <MiniStat title="Top Category" value={b2bStats.topCategories?.[0]?.name || "N/A"} icon={<MdDashboard size={18} />} />
                        </div>
                    )}

                    {/* B2B Filters */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <SelectInput label="Country" name="country" value={b2bFilters.country} options={countryOptions} onChange={handleB2bFilterChange} />
                        <SelectInput label="State" name="state" value={b2bFilters.state} options={stateOptions} onChange={handleB2bFilterChange} disabled={!b2bFilters.country} />
                        <SelectInput label="City" name="city" value={b2bFilters.city} options={cityOptions} onChange={handleB2bFilterChange} disabled={!b2bFilters.state} />
                        <SelectInput label="Category" name="category" value={b2bFilters.category} options={categoryOptions} onChange={handleB2bFilterChange} disabled={!b2bFilters.country} />
                    </div>

                    {(b2bFilters.country || b2bFilters.city || b2bFilters.state || b2bFilters.category) && (
                        <div className="mb-4">
                            <button onClick={clearB2bFilters} className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition flex items-center gap-2 font-medium text-sm">
                                <MdClear size={18} /> Clear Filters
                            </button>
                        </div>
                    )}

                    {/* B2B Table */}
                    <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 tracking-wider">
                                    <tr className="border-b border-slate-100">
                                        <th className="px-6 py-4">Dataset (Location / Category)</th>
                                        <th className="px-6 py-4">Total Records</th>
                                        <th className="px-6 py-4">Last Update</th>
                                        <th className="px-6 py-4">Price</th>
                                        <th className="px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {b2bLoading ? (
                                        <tr><td colSpan="5" className="px-6 py-12 text-center">
                                            <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                                        </td></tr>
                                    ) : b2bLeads.length === 0 ? (
                                        <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400 bg-slate-50/50">
                                            <MdFilterList size={40} className="mx-auto mb-2 opacity-50" /><p>No data found matching your filters</p>
                                        </td></tr>
                                    ) : (
                                        b2bLeads.map((lead) => (
                                            <tr key={lead._id} className="hover:bg-blue-50/30 transition duration-150 group">
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-slate-900 block">{lead.category}</span>
                                                    <span className="text-xs text-slate-500">{lead.location}</span>
                                                </td>
                                                <td className="px-6 py-4"><span className="font-medium text-slate-700">{lead.totalRecords} Records</span></td>
                                                <td className="px-6 py-4 text-slate-500 text-xs">{new Date(lead.lastUpdate).toLocaleDateString()}</td>
                                                <td className="px-6 py-4"><span className="font-semibold text-emerald-600">{lead.price}</span></td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleB2bPreview(lead._id, lead.category)}
                                                        className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm"
                                                    >Preview</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* B2B Pagination */}
                    {b2bTotalPages > 1 && (
                        <PaginationBar page={b2bPage} setPage={setB2bPage} totalPages={b2bTotalPages} total={b2bTotalRecords} limit={b2bLimit} />
                    )}
                </>
            )}

            {/* Row Detail Modal (Scraped) */}
            {previewOpen && previewRow && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800">{previewRow.name || 'Record Details'}</h2>
                            <button onClick={() => setPreviewOpen(false)} className="text-slate-400 hover:text-slate-600"><MdClose size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-auto p-6">
                            <div className="space-y-3">
                                {allColumns.map(col => (
                                    <div key={col} className="flex flex-col sm:flex-row gap-1 sm:gap-4 py-2 border-b border-slate-50">
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide sm:w-40 flex-shrink-0">{formatColumnName(col)}</span>
                                        <span className="text-sm text-slate-700 break-all">
                                            {col.toLowerCase().includes('website') && previewRow[col] ? (
                                                <a href={previewRow[col]} target="_blank" rel="noopener" className="text-blue-600 hover:underline">{previewRow[col]}</a>
                                            ) : (previewRow[col] || '-')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* File Preview + Verification Modal */}
            {filePreviewOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <div><h2 className="text-lg font-bold text-slate-800">📄 {formatColumnName(filePreviewName)}</h2></div>
                            <button onClick={() => setFilePreviewOpen(false)} className="text-slate-400 hover:text-slate-600"><MdClose size={24} /></button>
                        </div>
                        {filePreviewMeta && (
                            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs">
                                <span className="font-semibold text-slate-600">{filePreviewMeta.records?.toLocaleString()} records</span>
                                <span className="mx-2 text-slate-300">|</span>
                                <span className="text-slate-500">{filePreviewMeta.fileSizeFormatted} • CSV</span>
                                {filePreviewMeta.price && (<><span className="mx-2 text-slate-300">|</span><span className="font-semibold text-emerald-600">Price: {filePreviewMeta.price}</span></>)}
                            </div>
                        )}
                        <div className="flex-1 overflow-auto p-4">
                            {filePreviewLoading ? (
                                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                            ) : filePreviewData ? (
                                <table className="w-full text-left text-xs text-slate-600">
                                    <thead className="bg-slate-50 font-bold text-slate-500 sticky top-0">
                                        <tr className="border-b border-slate-100">
                                            {(filePreviewData.columns || []).slice(0, 8).map(col => (<th key={col} className="px-3 py-2 whitespace-nowrap">{formatColumnName(col)}</th>))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(filePreviewData.rows || []).map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                {(filePreviewData.columns || []).slice(0, 8).map(col => (
                                                    <td key={col} className="px-3 py-2 max-w-[200px] truncate">{row[col] || '-'}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (<p className="text-center text-slate-400 py-12">No data</p>)}
                        </div>
                    </div>
                </div>
            )}

            {/* Price Edit Modals */}
            <PriceEditModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit Price: ${formatColumnName(editData.category)}`} data={editData} setData={setEditData} onSave={savePrice} />
            <PriceEditModal isOpen={bulkModalOpen} onClose={() => setBulkModalOpen(false)} title={`Bulk Update Price — ${selectedCountry}`} data={bulkData} setData={setBulkData} onSave={saveBulkPrice} />

            {/* B2B Preview Modal */}
            {b2bPreviewOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800">Preview: {b2bPreviewName}</h2>
                            <button onClick={() => setB2bPreviewOpen(false)} className="text-slate-400 hover:text-slate-600"><MdClose size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-auto p-6">
                            {!b2bPreviewData ? (
                                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                            ) : (
                                <table className="w-full text-left text-xs text-slate-600">
                                    <thead className="bg-slate-50 font-bold text-slate-500 sticky top-0">
                                        <tr className="border-b border-slate-100">
                                            <th className="px-4 py-3">Name</th>
                                            <th className="px-4 py-3">Phone</th>
                                            <th className="px-4 py-3">Website</th>
                                            <th className="px-4 py-3">Address</th>
                                            <th className="px-4 py-3">Rating</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {b2bPreviewData.map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-4 py-2 font-medium text-slate-800">{row.name}</td>
                                                <td className="px-4 py-2">{row.phone_number || '-'}</td>
                                                <td className="px-4 py-2 truncate max-w-[200px]">
                                                    {row.website ? <a href={row.website} target="_blank" className="text-blue-600 hover:underline">Link</a> : '-'}
                                                </td>
                                                <td className="px-4 py-2 truncate max-w-[300px]">{row.full_address}</td>
                                                <td className="px-4 py-2">{row.rating || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
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

function MiniStat({ title, value, icon }) {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">{icon}</div>
            <div>
                <p className="text-slate-400 text-[10px] font-semibold uppercase">{title}</p>
                <h3 className="text-lg font-bold text-slate-800">{value || 0}</h3>
            </div>
        </div>
    );
}

function SelectInput({ label, name, value, options, onChange, disabled }) {
    return (
        <div className="relative">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">{label}</label>
            <select
                name={name} value={value} onChange={onChange} disabled={disabled}
                className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white appearance-none disabled:bg-slate-100 disabled:text-slate-400"
            >
                <option value="">{`Select ${label}...`}</option>
                {options.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
            <div className="absolute right-3 top-[2.1rem] pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
        </div>
    );
}

function PaginationBar({ page, setPage, totalPages, total, limit }) {
    return (
        <div className="mt-4 flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500">
                Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total?.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-30 transition">
                    <MdChevronLeft size={20} />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;
                    return (
                        <button key={pageNum} onClick={() => setPage(pageNum)}
                            className={`w-8 h-8 rounded-md text-sm font-medium transition ${page === pageNum ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                        >{pageNum}</button>
                    );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-30 transition">
                    <MdChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}

function PriceEditModal({ isOpen, onClose, title, data, setData, onSave }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">{title}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
                        <input type="number" value={data.price} onChange={e => setData({ ...data, price: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="299" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Previous Price ($) <span className="text-slate-400 font-normal">(Optional)</span></label>
                        <input type="number" value={data.previousPrice} onChange={e => setData({ ...data, previousPrice: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="598" />
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
