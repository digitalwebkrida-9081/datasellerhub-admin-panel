'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { MdRefresh, MdChevronRight, MdStorage, MdEmail, MdPhone, MdLanguage, MdEdit, MdVisibility, MdClose, MdFolder, MdArrowBack, MdCategory, MdDownload } from 'react-icons/md';
import * as XLSX from 'xlsx';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function MergedDataPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [browseData, setBrowseData] = useState(null);
    
    // Navigation state
    const [country, setCountry] = useState('');
    const [state, setState] = useState('');
    const [city, setCity] = useState('');
    const [browsePage, setBrowsePage] = useState(1);
    const [browseSearch, setBrowseSearch] = useState('');
    
    // Preview modal
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [previewName, setPreviewName] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewPage, setPreviewPage] = useState(1);
    const [previewSearch, setPreviewSearch] = useState('');
    
    // Price edit modal
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({ category: '', price: '', previousPrice: '' });
    
    // Bulk price modal
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [bulkData, setBulkData] = useState({ price: '', previousPrice: '' });

    useEffect(() => {
        const isAuth = localStorage.getItem('admin_auth');
        const role = localStorage.getItem('user_role');
        if (!isAuth) { router.push('/login'); return; }
        if (role !== 'admin') { router.push('/sales-dashboard'); return; }
        fetchBrowse();
    }, []);

    useEffect(() => {
        fetchBrowse();
    }, [country, state, city]);

    const fetchBrowse = async (page = browsePage, search = browseSearch) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (country) params.append('country', country);
            if (state) params.append('state', state);
            if (city) params.append('city', city);
            params.append('page', page);
            params.append('limit', 50);
            if (search) params.append('search', search);
            
            const res = await fetch(`${API_URL}/api/merged/browse?${params}`);
            const json = await res.json();
            if (json.success) setBrowseData(json.data);
        } catch (err) {
            console.error('Error fetching browse data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBrowsePageChange = (newPage) => {
        setBrowsePage(newPage);
        fetchBrowse(newPage, browseSearch);
    };

    const handleBrowseSearch = (e) => {
        e.preventDefault();
        setBrowsePage(1);
        fetchBrowse(1, browseSearch);
    };

    const handleFolderClick = (folderName) => {
        setBrowsePage(1);
        setBrowseSearch('');
        if (!country) {
            setCountry(folderName);
            setState('');
            setCity('');
        } else if (!state) {
            setState(folderName);
            setCity('');
        } else {
            setCity(folderName);
        }
    };

    const handleBreadcrumbClick = (level) => {
        setBrowsePage(1);
        setBrowseSearch('');
        if (level === 'root') {
            setCountry('');
            setState('');
            setCity('');
        } else if (level === 'country') {
            setState('');
            setCity('');
        } else if (level === 'state') {
            setCity('');
        }
    };

    const handleGoBack = () => {
        setBrowsePage(1);
        setBrowseSearch('');
        if (city) setCity('');
        else if (state) setState('');
        else if (country) setCountry('');
    };

    // Preview mapping to paginated data
    const handlePreview = (categoryName) => {
        setPreviewName(categoryName);
        setPreviewPage(1);
        setPreviewSearch('');
        setPreviewOpen(true);
        fetchPreviewData(categoryName, 1, '');
    };

    const fetchPreviewData = async (catName, page, searchStr) => {
        setPreviewLoading(true);
        try {
            const params = new URLSearchParams({ country, category: catName, page, limit: 100 });
            if (state) params.append('state', state);
            if (city) params.append('city', city);
            if (searchStr) params.append('search', searchStr);
            
            const res = await fetch(`${API_URL}/api/merged/data?${params}`);
            const json = await res.json();
            if (json.success) setPreviewData(json.data);
        } catch (err) {
            console.error('Error fetching preview data:', err);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handlePreviewPageChange = (newPage) => {
        setPreviewPage(newPage);
        fetchPreviewData(previewName, newPage, previewSearch);
    };

    const handlePreviewSearch = (e) => {
        e.preventDefault();
        setPreviewPage(1);
        fetchPreviewData(previewName, 1, previewSearch);
    };

    const handleExport = async () => {
        try {
            setPreviewLoading(true);
            const params = new URLSearchParams({ country, category: previewName, page: 1, limit: 1000000 }); // Large limit to get all data
            if (state) params.append('state', state);
            if (city) params.append('city', city);
            if (previewSearch) params.append('search', previewSearch);
            
            const res = await fetch(`${API_URL}/api/merged/data?${params}`);
            const json = await res.json();
            
            if (json.success && json.data?.data?.length > 0) {
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.json_to_sheet(json.data.data);
                XLSX.utils.book_append_sheet(wb, ws, 'Exported Data');
                XLSX.writeFile(wb, `${previewName}-${country}${state ? `-${state}` : ''}${city ? `-${city}` : ''}.xlsx`);
            } else {
                alert("No data found to export.");
            }
        } catch (error) {
            console.error("Export error:", error);
            alert("Error exporting data.");
        } finally {
            setPreviewLoading(false);
        }
    };

    // Individual price edit
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
                    country,
                    category: editData.category,
                    state: state || undefined,
                    city: city || undefined,
                    price: `$${editData.price}`,
                    previousPrice: editData.previousPrice ? `$${editData.previousPrice}` : undefined
                })
            });
            const json = await res.json();
            if (json.success) {
                setEditModalOpen(false);
                fetchBrowse();
            } else {
                alert('Failed: ' + json.message);
            }
        } catch (err) {
            console.error('Error saving price:', err);
            alert('Error saving price');
        }
    };

    // Bulk price update
    const handleBulkUpdate = () => {
        setBulkData({ price: '', previousPrice: '' });
        setBulkModalOpen(true);
    };

    const saveBulkPrice = async () => {
        const scope = [country, state, city].filter(Boolean).join(' / ');
        if (!confirm(`Update price for ALL categories in ${scope}? This cannot be undone.`)) return;
        
        try {
            const res = await fetch(`${API_URL}/api/merged/bulk-update-price`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    country,
                    state: state || undefined,
                    city: city || undefined,
                    price: `$${bulkData.price}`,
                    previousPrice: bulkData.previousPrice ? `$${bulkData.previousPrice}` : undefined
                })
            });
            const json = await res.json();
            if (json.success) {
                alert(json.message);
                setBulkModalOpen(false);
                fetchBrowse();
            } else {
                alert('Failed: ' + json.message);
            }
        } catch (err) {
            console.error('Error bulk updating:', err);
            alert('Error bulk updating price');
        }
    };

    const formatCategoryName = (name) => name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    if (loading && !browseData) return (
        <AdminLayout>
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        </AdminLayout>
    );

    const { breadcrumb = [], folders = [], categories = [], summary = {}, pagination } = browseData || {};

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Merged Data</h1>
                    <p className="text-slate-500 mt-1">Browse, manage pricing, and preview merged datasets</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchBrowse} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition flex items-center gap-2 font-medium cursor-pointer">
                        <MdRefresh size={20} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    {country && categories.length > 0 && (
                        <button onClick={handleBulkUpdate} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2 font-medium cursor-pointer shadow-sm">
                            <MdEdit size={20} />
                            Bulk Update Price
                        </button>
                    )}
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-6 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm text-sm">
                {(country) && (
                    <button onClick={handleGoBack} className="text-slate-400 hover:text-blue-600 transition p-1 rounded hover:bg-slate-100 cursor-pointer">
                        <MdArrowBack size={18} />
                    </button>
                )}
                <button 
                    onClick={() => handleBreadcrumbClick('root')} 
                    className={`font-medium transition cursor-pointer ${!country ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}
                >
                    🌍 All Countries
                </button>
                {breadcrumb.map((crumb, idx) => (
                    <React.Fragment key={idx}>
                        <MdChevronRight size={16} className="text-slate-300" />
                        <button 
                            onClick={() => handleBreadcrumbClick(crumb.level)}
                            className={`font-medium transition cursor-pointer ${idx === breadcrumb.length - 1 ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}
                        >
                            {crumb.label}
                        </button>
                    </React.Fragment>
                ))}
            </div>

            {/* Stats Cards (when inside a country) */}
            {country && summary.totalRecords > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <MiniStat icon={<MdStorage className="text-blue-600" />} label="Records" value={summary.totalRecords?.toLocaleString()} />
                    <MiniStat icon={<MdEmail className="text-emerald-600" />} label="Emails" value={summary.totalEmails?.toLocaleString()} />
                    <MiniStat icon={<MdPhone className="text-purple-600" />} label="Phones" value={summary.totalPhones?.toLocaleString()} />
                    <MiniStat icon={<MdLanguage className="text-orange-600" />} label="Websites" value={summary.totalWebsites?.toLocaleString()} />
                </div>
            )}

            {/* Folders (Drill-Down) */}
            {folders.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <MdFolder size={16} />
                        {!country ? 'Countries' : !state ? 'States / Regions' : 'Cities'}
                        <span className="text-xs font-normal text-slate-400">({folders.length})</span>
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {folders.map(folder => (
                            <button
                                key={folder.name || folder.code}
                                onClick={() => handleFolderClick(folder.code || folder.name)}
                                className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer text-left group"
                            >
                                <div className="flex items-center gap-2">
                                    <MdFolder size={18} className="text-amber-500 group-hover:text-blue-500 transition" />
                                    <span className="font-medium text-slate-700 group-hover:text-blue-600 transition text-sm truncate">
                                        {folder.displayName || folder.name || getCountryName(folder.code)}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Categories Table (CSV files) */}
            {(categories.length > 0 || browseSearch) && (
                <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200">
                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                            <MdCategory size={16} />
                            Datasets
                            <span className="text-xs font-normal text-slate-400">({pagination?.totalCategories || categories.length} categories)</span>
                        </h2>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <form onSubmit={handleBrowseSearch} className="flex gap-2 w-full sm:w-auto">
                                <input 
                                    type="text" 
                                    placeholder="Search datasets..." 
                                    value={browseSearch}
                                    onChange={(e) => setBrowseSearch(e.target.value)}
                                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                                />
                                <button type="submit" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition cursor-pointer">Search</button>
                                {browseSearch && (
                                    <button type="button" onClick={() => { setBrowseSearch(''); setBrowsePage(1); fetchBrowse(1, ''); }} className="text-slate-500 px-2 cursor-pointer hover:text-slate-800 text-sm">Clear</button>
                                )}
                            </form>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 tracking-wider">
                                <tr className="border-b border-slate-100">
                                    <th className="px-5 py-3">Category</th>
                                    <th className="px-5 py-3 text-right">Records</th>
                                    <th className="px-5 py-3 text-right">Emails</th>
                                    <th className="px-5 py-3 text-right">Phones</th>
                                    <th className="px-5 py-3 text-right">Websites</th>
                                    <th className="px-5 py-3 text-right">Size</th>
                                    <th className="px-5 py-3">Price</th>
                                    <th className="px-5 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {categories.map((cat, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50/30 transition duration-150">
                                        <td className="px-5 py-3">
                                            <span className="font-semibold text-slate-800">{cat.displayName}</span>
                                        </td>
                                        <td className="px-5 py-3 text-right font-medium text-slate-700">{cat.records?.toLocaleString()}</td>
                                        <td className="px-5 py-3 text-right text-emerald-600">{cat.emails?.toLocaleString()}</td>
                                        <td className="px-5 py-3 text-right text-purple-600">{cat.phones?.toLocaleString()}</td>
                                        <td className="px-5 py-3 text-right text-orange-600">{cat.websites?.toLocaleString()}</td>
                                        <td className="px-5 py-3 text-right text-slate-400 text-xs">{cat.fileSize}</td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-semibold ${cat.price ? 'text-emerald-600' : 'text-slate-400'}`}>
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
                                        <td className="px-5 py-3">
                                            <button 
                                                onClick={() => handlePreview(cat.name)}
                                                className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm cursor-pointer"
                                            >
                                                Preview
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {categories.length === 0 && browseSearch && (
                            <div className="p-8 text-center text-slate-400">
                                <p>No datasets found matching "{browseSearch}"</p>
                            </div>
                        )}
                    </div>
                    {pagination && pagination.totalPages > 1 && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <span className="text-sm text-slate-600">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCategories)} of {pagination.totalCategories} categories
                            </span>
                            <div className="flex items-center gap-2">
                                <button 
                                    disabled={!pagination.hasPrevPage}
                                    onClick={() => handleBrowsePageChange(pagination.page - 1)}
                                    className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                    Previous
                                </button>
                                <span className="text-sm font-medium text-slate-600 min-w-[80px] text-center">Page {pagination.page} of {pagination.totalPages}</span>
                                <button 
                                    disabled={!pagination.hasNextPage}
                                    onClick={() => handleBrowsePageChange(pagination.page + 1)}
                                    className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!loading && folders.length === 0 && categories.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                    <MdStorage size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No data found at this location</p>
                    <p className="text-sm mt-1">Try navigating back or selecting a different path</p>
                </div>
            )}

            {/* Preview Modal */}
            {previewOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[85vh] flex flex-col">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800">Data Viewer: {formatCategoryName(previewName)}</h2>
                            <button onClick={() => setPreviewOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <MdClose size={24} />
                            </button>
                        </div>
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center flex-wrap gap-4">
                            <form onSubmit={handlePreviewSearch} className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Search in file..." 
                                    value={previewSearch}
                                    onChange={(e) => setPreviewSearch(e.target.value)}
                                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition cursor-pointer">Search</button>
                                {previewSearch && (
                                    <button type="button" onClick={() => { setPreviewSearch(''); setPreviewPage(1); fetchPreviewData(previewName, 1, ''); }} className="text-slate-500 px-2 cursor-pointer hover:text-slate-800">Clear</button>
                                )}
                            </form>
                            
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={handleExport}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-2 font-medium cursor-pointer shadow-sm"
                                >
                                    <MdDownload size={18} />
                                    Export All
                                </button>
                                
                                {previewData?.pagination && (
                                    <div className="flex items-center gap-4 text-sm text-slate-600">
                                        <span>Total: {previewData.pagination.total.toLocaleString()} records</span>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                disabled={!previewData.pagination.hasPrevPage}
                                                onClick={() => handlePreviewPageChange(previewPage - 1)}
                                                className="px-3 py-1 bg-white border border-slate-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer"
                                            >
                                                Prev
                                            </button>
                                            <span className="font-medium">Page {previewData.pagination.page} of {previewData.pagination.totalPages || 1}</span>
                                            <button 
                                                disabled={!previewData.pagination.hasNextPage}
                                                onClick={() => handlePreviewPageChange(previewPage + 1)}
                                                className="px-3 py-1 bg-white border border-slate-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            {previewLoading ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : previewData?.data?.length > 0 ? (
                                <>
                                    <table className="w-full text-left text-xs text-slate-600">
                                        <thead className="bg-slate-50 font-bold text-slate-500 sticky top-0 shadow-sm">
                                            <tr className="border-b border-slate-200">
                                                {previewData.columns?.map(col => (
                                                    <th key={col} className="px-3 py-2 whitespace-nowrap bg-slate-50">{formatCategoryName(col)}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {previewData.data.map((row, i) => (
                                                <tr key={i} className="hover:bg-slate-50">
                                                    {previewData.columns?.map(col => (
                                                        <td key={col} className="px-3 py-2 max-w-[250px] truncate" title={row[col]}>
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
                                <p className="text-center text-slate-400 py-12">No data available for this query.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Price Modal */}
            <PriceModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title={`Edit Price: ${formatCategoryName(editData.category)}`}
                data={editData}
                setData={setEditData}
                onSave={savePrice}
            />

            {/* Bulk Price Modal */}
            <PriceModal
                isOpen={bulkModalOpen}
                onClose={() => setBulkModalOpen(false)}
                title={`Bulk Update Price — ${[country, state, city].filter(Boolean).join(' / ')}`}
                data={bulkData}
                setData={setBulkData}
                onSave={saveBulkPrice}
            />
        </AdminLayout>
    );
}

// Mini stat card
function MiniStat({ icon, label, value }) {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-50">{icon}</div>
            <div>
                <p className="text-xs text-slate-400 font-medium">{label}</p>
                <p className="text-lg font-bold text-slate-700">{value || 0}</p>
            </div>
        </div>
    );
}

// Price edit modal (shared between individual and bulk)
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

function getCountryName(code) {
    const countries = { US: 'United States', UK: 'United Kingdom', CA: 'Canada', AU: 'Australia', IN: 'India', DE: 'Germany', FR: 'France', JP: 'Japan', BR: 'Brazil', MX: 'Mexico' };
    return countries[code?.toUpperCase()] || code;
}
