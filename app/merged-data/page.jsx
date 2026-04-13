'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { 
    MdRefresh, MdChevronRight, MdStorage, MdEmail, MdPhone, 
    MdLanguage, MdEdit, MdVisibility, MdClose, MdFolder, 
    MdArrowBack, MdCategory, MdDownload, MdHistory, MdCheck, MdPublic 
} from 'react-icons/md';
import { FiGlobe, FiDatabase, FiServer, FiChevronDown } from "react-icons/fi";
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
    const [activeDomain, setActiveDomain] = useState('');
    
    // Preview modal
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [previewName, setPreviewName] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewPage, setPreviewPage] = useState(1);
    const [previewSearch, setPreviewSearch] = useState('');
    
    // Price edit modal
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({ category: '', price: '', previousPrice: '', domain: '' });
    
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [bulkData, setBulkData] = useState({ price: '', previousPrice: '' });

    // Record digits editing
    const [recordModalOpen, setRecordModalOpen] = useState(false);
    const [recordData, setRecordData] = useState({
        category: '',
        total: '',
        emails: '',
        phones: '',
        websites: '',
        linkedin: '',
        facebook: '',
        instagram: '',
        twitter: '',
        tiktok: '',
        youtube: ''
    });

    useEffect(() => {
        const isAuth = localStorage.getItem('admin_auth');
        const role = localStorage.getItem('user_role');
        if (!isAuth) { router.push('/login'); return; }
        if (role !== 'admin') { router.push('/sales-dashboard'); return; }
        fetchBrowse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchBrowse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [country, state, city, activeDomain]);

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
            if (activeDomain) params.append('domain', activeDomain);
            
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
            const params = new URLSearchParams({ country, category: previewName, page: 1, limit: 1000000 });
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

    const handleEditPrice = (cat) => {
        setEditData({
            category: cat.name,
            price: cat.price ? cat.price.replace('$', '') : '',
            previousPrice: cat.previousPrice ? cat.previousPrice.replace('$', '') : '',
            domain: '' 
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
                    previousPrice: editData.previousPrice ? `$${editData.previousPrice}` : undefined,
                    domain: editData.domain || undefined
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

    const handleEditRecords = (cat) => {
        setRecordData({
            category: cat.name,
            total: cat.records || '',
            emails: cat.emails || '',
            phones: cat.phones || '',
            websites: cat.websites || '',
            linkedin: cat.linkedin || '',
            facebook: cat.facebook || '',
            instagram: cat.instagram || '',
            twitter: cat.twitter || '',
            tiktok: cat.tiktok || '',
            youtube: cat.youtube || ''
        });
        setRecordModalOpen(true);
    };

    const saveRecords = async () => {
        try {
            const res = await fetch(`${API_URL}/api/merged/update-records`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    country,
                    state,
                    city,
                    category: recordData.category,
                    records: {
                        total: recordData.total,
                        emails: recordData.emails,
                        phones: recordData.phones,
                        websites: recordData.websites,
                        linkedin: recordData.linkedin,
                        facebook: recordData.facebook,
                        instagram: recordData.instagram,
                        twitter: recordData.twitter,
                        tiktok: recordData.tiktok,
                        youtube: recordData.youtube
                    }
                })
            });
            const json = await res.json();
            if (json.success) {
                setRecordModalOpen(false);
                fetchBrowse();
            } else {
                alert('Failed: ' + json.message);
            }
        } catch (err) {
            console.error('Error saving records:', err);
            alert('Error saving records');
        }
    };

    const deleteRecords = async () => {
        if (!confirm('Remove manual override and restore real record counts?')) return;
        try {
            const res = await fetch(`${API_URL}/api/merged/delete-records`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    country,
                    state,
                    city,
                    category: recordData.category
                })
            });
            const json = await res.json();
            if (json.success) {
                setRecordModalOpen(false);
                fetchBrowse();
            } else {
                alert('Failed: ' + json.message);
            }
        } catch (err) {
            console.error('Error deleting records:', err);
            alert('Error deleting manual records');
        }
    };

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
                    previousPrice: bulkData.previousPrice ? `$${bulkData.previousPrice}` : undefined,
                    domain: activeDomain || undefined
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
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        </AdminLayout>
    );

    const { breadcrumb = [], folders = [], categories = [], summary = {}, pagination } = browseData || {};

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Merged Data Explorer</h1>
                    <p className="text-slate-500 text-sm mt-1">Navigate and manage regional datasets with manual overrides.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => fetchBrowse()} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50 transition flex items-center gap-2 text-sm font-semibold shadow-sm active:scale-95 cursor-pointer">
                        <MdRefresh size={18} className={loading ? 'animate-spin text-blue-600' : ''} />
                        Refresh
                    </button>
                    {country && (
                        <button onClick={handleBulkUpdate} className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition flex items-center gap-2 text-sm font-semibold shadow-sm active:scale-95 cursor-pointer">
                            <MdEdit size={18} />
                            Bulk Price
                        </button>
                    )}
                </div>
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 mb-6 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-xs overflow-x-auto no-scrollbar">
                <button onClick={() => handleGoBack()} className="text-slate-400 hover:text-blue-600 transition p-1 rounded-md hover:bg-white border border-transparent hover:border-slate-200 cursor-pointer disabled:opacity-30" disabled={!country}>
                    <MdArrowBack size={16} />
                </button>
                <button 
                    onClick={() => handleBreadcrumbClick('root')} 
                    className={`font-bold transition cursor-pointer px-2 py-1 rounded-md ${!country ? 'text-blue-600 bg-white shadow-sm border border-slate-200' : 'text-slate-500 hover:text-blue-600'}`}
                >
                    ROOT
                </button>
                {breadcrumb.map((crumb, idx) => (
                    <React.Fragment key={idx}>
                        <MdChevronRight size={14} className="text-slate-300" />
                        <button 
                            onClick={() => handleBreadcrumbClick(crumb.level)}
                            className={`font-bold transition cursor-pointer px-2 py-1 rounded-md ${idx === breadcrumb.length - 1 ? 'text-blue-600 bg-white shadow-sm border border-slate-200' : 'text-slate-500 hover:text-blue-600'}`}
                        >
                            {crumb.label.toUpperCase()}
                        </button>
                    </React.Fragment>
                ))}
            </div>

            {/* Stats Overview */}
            {country && summary.totalRecords > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <MiniStat icon={<MdStorage />} label="Total Records" value={summary.totalRecords?.toLocaleString()} color="text-blue-600" bgColor="bg-blue-50" />
                    <MiniStat icon={<MdEmail />} label="Emails" value={summary.totalEmails?.toLocaleString()} color="text-emerald-600" bgColor="bg-emerald-50" />
                    <MiniStat icon={<MdPhone />} label="Phones" value={summary.totalPhones?.toLocaleString()} color="text-purple-600" bgColor="bg-purple-50" />
                    <MiniStat icon={<MdLanguage />} label="Websites" value={summary.totalWebsites?.toLocaleString()} color="text-orange-600" bgColor="bg-orange-50" />
                </div>
            )}

            {/* Folder Drill-Down */}
            {folders.length > 0 && (
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <MdFolder className="text-amber-500" />
                            Sub-Directories
                        </h2>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">{folders.length} items</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                        {folders.map(folder => (
                            <button
                                key={folder.name || folder.code}
                                onClick={() => handleFolderClick(folder.code || folder.name)}
                                className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer text-left group"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-700 group-hover:text-blue-600 truncate mr-2">
                                        {folder.name || getCountryName(folder.code)}
                                    </span>
                                    <MdChevronRight className="text-slate-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Categories Table */}
            {(categories.length > 0 || browseSearch) && (
                <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-slate-200">
                    <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                <MdCategory size={20} />
                            </div>
                            <h2 className="font-bold text-slate-800 uppercase tracking-tight text-sm">Datasets in this level</h2>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                            <DomainDropdown 
                                activeDomain={activeDomain} 
                                setActiveDomain={setActiveDomain} 
                                setBrowsePage={setBrowsePage} 
                            />

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-64">
                                    <input 
                                        type="text" 
                                        placeholder="Filter by name..." 
                                        value={browseSearch}
                                        onChange={(e) => setBrowseSearch(e.target.value)}
                                        className="w-full pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                                    />
                                </div>
                                <button onClick={handleBrowseSearch} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition cursor-pointer shadow-sm active:scale-95 whitespace-nowrap">Filter</button>
                                {browseSearch && (
                                    <button onClick={() => { setBrowseSearch(''); setBrowsePage(1); fetchBrowse(1, ''); }} className="text-slate-400 hover:text-red-500 transition text-[10px] font-bold px-1 cursor-pointer uppercase">Clear</button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600 border-separate border-spacing-0">
                            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 border-b border-slate-100">Category</th>
                                    <th className="px-6 py-4 border-b border-slate-100 text-right">Digits</th>
                                    <th className="px-6 py-4 border-b border-slate-100 text-right">Emails</th>
                                    <th className="px-6 py-4 border-b border-slate-100 text-right">Phones</th>
                                    <th className="px-6 py-4 border-b border-slate-100 text-right">Websites</th>
                                    <th className="px-6 py-4 border-b border-slate-100 text-right">Size</th>
                                    <th className="px-6 py-4 border-b border-slate-100">Price</th>
                                    <th className="px-6 py-4 border-b border-slate-100 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {categories.map((cat, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-800 truncate max-w-[200px]">{cat.displayName || cat.name}</span>
                                                <span className="text-[10px] text-slate-400 uppercase truncate max-w-[150px]">{cat.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5 group">
                                                <span className={`font-mono font-bold ${cat.hasManualRecords ? 'text-blue-600' : 'text-slate-700'}`}>
                                                    {cat.records?.toLocaleString() || '0'}
                                                </span>
                                                <button
                                                    onClick={() => handleEditRecords(cat)}
                                                    className={`p-1 rounded-md transition ${cat.hasManualRecords ? 'text-blue-600 bg-blue-50' : 'text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100'}`}
                                                    title="Manual Override"
                                                >
                                                    <MdHistory size={14} />
                                                </button>
                                            </div>
                                            {cat.hasManualRecords && (
                                                <span className="text-[8px] text-blue-500 font-bold uppercase block mt-0.5 tracking-tighter">Manual</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right text-emerald-600 font-medium">{cat.emails?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-purple-600 font-medium">{cat.phones?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-orange-600 font-medium">{cat.websites?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-[10px] text-slate-400 font-medium tracking-tight uppercase">{cat.fileSize}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col">
                                                    <span className={`font-bold ${cat.price ? 'text-slate-800' : 'text-slate-300 italic'}`}>
                                                        {cat.price || 'Not Set'}
                                                    </span>
                                                    {cat.previousPrice && (
                                                        <span className="text-[10px] text-slate-400 line-through Decoration-slate-300 font-medium">{cat.previousPrice}</span>
                                                    )}
                                                </div>
                                                <button onClick={() => handleEditPrice(cat)} className="text-slate-300 hover:text-blue-500 transition cursor-pointer">
                                                    <MdEdit size={14} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => handlePreview(cat.name)}
                                                className="text-white bg-slate-800 hover:bg-black px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95"
                                            >
                                                Preview
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {pagination && pagination.totalPages > 1 && (
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">
                                Entries {((pagination.page - 1) * pagination.limit) + 1} TO {Math.min(pagination.page * pagination.limit, pagination.totalCategories)} / TOTAL {pagination.totalCategories}
                            </span>
                            <div className="flex items-center gap-2">
                                <button 
                                    disabled={!pagination.hasPrevPage}
                                    onClick={() => handleBrowsePageChange(pagination.page - 1)}
                                    className="p-1 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                    PREV
                                </button>
                                <div className="px-4 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-blue-600">
                                    PAGE {pagination.page} / {pagination.totalPages}
                                </div>
                                <button 
                                    disabled={!pagination.hasNextPage}
                                    onClick={() => handleBrowsePageChange(pagination.page + 1)}
                                    className="p-1 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                    NEXT
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!loading && folders.length === 0 && categories.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400 max-w-lg mx-auto mt-10">
                    <MdStorage size={32} className="mx-auto mb-4 opacity-20" />
                    <h3 className="text-slate-800 font-bold mb-2">No Content Available</h3>
                    <p className="text-sm font-medium mb-6">There is no merged data or folders at this selection level.</p>
                    <button onClick={() => handleBreadcrumbClick('root')} className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold text-sm cursor-pointer shadow-sm">
                        Back to Root
                    </button>
                </div>
            )}

            {/* Preview Modal */}
            {previewOpen && (
                <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-4 duration-200">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                    <MdVisibility size={20} />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-800 leading-tight">{formatCategoryName(previewName)}</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{country} / {state || 'All States'} / {city || 'All Cities'}</p>
                                </div>
                            </div>
                            <button onClick={() => setPreviewOpen(false)} className="bg-slate-50 text-slate-400 hover:text-slate-600 p-2 rounded-xl transition cursor-pointer">
                                <MdClose size={24} />
                            </button>
                        </div>
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <form onSubmit={handlePreviewSearch} className="flex gap-2 w-full sm:w-auto">
                                <input 
                                    type="text" 
                                    placeholder="Search in records..." 
                                    value={previewSearch}
                                    onChange={(e) => setPreviewSearch(e.target.value)}
                                    className="w-full sm:w-64 pl-4 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-medium transition"
                                />
                                <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm cursor-pointer">Search</button>
                            </form>
                            
                            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar">
                                <button 
                                    onClick={handleExport}
                                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm cursor-pointer hover:bg-emerald-700 transition"
                                >
                                    <MdDownload size={18} />
                                    Export XLSX
                                </button>
                                
                                {previewData?.pagination && (
                                    <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-xl whitespace-nowrap">
                                        <button 
                                            disabled={!previewData.pagination.hasPrevPage}
                                            onClick={() => handlePreviewPageChange(previewPage - 1)}
                                            className="p-1 px-2 text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                                        >
                                            <MdChevronRight size={20} className="rotate-180" />
                                        </button>
                                        <span className="text-[10px] font-bold text-slate-400 w-24 text-center">PAGE {previewData.pagination.page} / {previewData.pagination.totalPages || 1}</span>
                                        <button 
                                            disabled={!previewData.pagination.hasNextPage}
                                            onClick={() => handlePreviewPageChange(previewPage + 1)}
                                            className="p-1 px-2 text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                                        >
                                            <MdChevronRight size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-6 bg-slate-50/20">
                            {previewLoading ? (
                                <div className="flex flex-col items-center justify-center py-32 gap-3">
                                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-100 border-b-blue-600"></div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading...</span>
                                </div>
                            ) : previewData?.data?.length > 0 ? (
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-[11px] text-slate-600 border-separate border-spacing-0">
                                        <thead className="bg-slate-50 font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                            <tr>
                                                {previewData.columns?.map(col => (
                                                    <th key={col} className="px-4 py-3 border-b border-slate-100 whitespace-nowrap">{formatCategoryName(col)}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {previewData.data.map((row, i) => (
                                                <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                                                    {previewData.columns?.map(col => (
                                                        <td key={col} className="px-4 py-2.5 max-w-[250px] truncate" title={row[col]}>
                                                            {col.toLowerCase().includes('website') && row[col] ? (
                                                                <a href={row[col].startsWith('http') ? row[col] : `https://${row[col]}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">{row[col]}</a>
                                                            ) : (
                                                                row[col] || '-'
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-32 text-slate-400 font-medium">No results matched your search criteria.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Pricing Modal */}
            <PriceModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title={editData.category}
                data={editData}
                setData={setEditData}
                onSave={savePrice}
                country={country}
                state={state}
                city={city}
            />

            {/* Bulk Pricing Modal */}
            <PriceModal
                isOpen={bulkModalOpen}
                onClose={() => setBulkModalOpen(false)}
                title={`Bulk Pricing: ${country}`}
                data={bulkData}
                setData={setBulkData}
                onSave={saveBulkPrice}
            />

            {/* Edit Digits Modal */}
            <RecordModal
                isOpen={recordModalOpen}
                onClose={() => setRecordModalOpen(false)}
                title={recordData.category}
                data={recordData}
                setData={setRecordData}
                onSave={saveRecords}
                onDelete={deleteRecords}
            />
        </AdminLayout>
    );
}

const domains = [
    { label: "Global (Default)", value: "", icon: FiGlobe },
    { label: "businessdatalabs.com", value: "businessdatalabs.com", icon: FiDatabase },
    { label: "businessdataguru.com", value: "businessdataguru.com", icon: FiServer },
    { label: "datasellerhub.com", value: "datasellerhub.com", icon: FiDatabase },
];

function DomainDropdown({ activeDomain, setActiveDomain, setBrowsePage }) {
    const [open, setOpen] = useState(false);

    const selected = domains.find(d => d.value === activeDomain);

    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto relative mb-2 sm:mb-0">

            {/* Label */}
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap px-1">
                View Domain
            </span>

            {/* Trigger */}
            <button
                onClick={() => setOpen(!open)}
                className="w-full sm:w-56 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[12px] font-bold text-left text-slate-700 
                hover:border-blue-300 hover:bg-white transition-all flex justify-between items-center cursor-pointer"
            >
                <div className="flex items-center gap-2">
                    {selected?.icon && <selected.icon className="text-blue-500 text-sm" />}
                    {selected?.label}
                </div>
                <FiChevronDown className={`text-slate-400 text-sm transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-64 bg-white border border-slate-100 rounded-xl shadow-xl p-2 z-[110] animate-in fade-in zoom-in duration-200">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1 mb-1 border-b border-slate-50">Select Pricing Context</div>
                    {domains.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={item.value}
                                onClick={() => {
                                    setActiveDomain(item.value);
                                    setBrowsePage(1);
                                    setOpen(false);
                                }}
                                className={`flex items-center gap-3 px-3 py-2.5 text-[12px] font-bold rounded-lg cursor-pointer transition-all mb-1 last:mb-0
                                
                                ${activeDomain === item.value
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                    : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"}
                                `}
                            >
                                <Icon className={`text-sm ${activeDomain === item.value ? "text-white" : "text-blue-500"}`} />
                                {item.label}
                                {activeDomain === item.value && <MdCheck className="ml-auto text-white" size={14} />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function MiniStat({ icon, label, value, color, bgColor }) {
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${bgColor} ${color} text-xl`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-lg font-bold text-slate-800 tabular-nums">{value || '0'}</p>
            </div>
        </div>
    );
}

function PriceModal({ isOpen, onClose, title, data, setData, onSave, country, state, city }) {
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        if (!isOpen || !data.category) return;
        
        const fetchDomainPrice = async () => {
            setFetching(true);
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stagservice.datasellerhub.com";
                const url = `${API_URL}/api/merged/price-details?country=${country}&category=${data.category}&domain=${data.domain}${state ? `&state=${state}` : ''}${city ? `&city=${city}` : ''}`;
                
                const res = await fetch(url);
                const result = await res.json();
                
                if (result.success && result.data) {
                    setData(prev => ({
                        ...prev,
                        price: result.data.price ? result.data.price.replace('$', '') : '',
                        previousPrice: result.data.previousPrice ? result.data.previousPrice.replace('$', '') : ''
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch domain price:", err);
            } finally {
                setFetching(false);
            }
        };

        fetchDomainPrice();
    }, [data.domain, isOpen, data.category, country, state, city]);

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/30 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-150">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-lg font-bold text-slate-800 leading-tight tracking-tight uppercase">Update Pricing</h2>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[200px]">{title}</span>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition"><MdClose size={20} /></button>
                </div>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Domain Scope</label>
                        <select
                            value={data.domain}
                            onChange={e => setData({ ...data, domain: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition font-bold text-sm"
                        >
                            <option value="">Global (All Domains)</option>
                            <option value="businessdatalabs.com">businessdatalabs.com</option>
                            <option value="businessdataguru.com">businessdataguru.com</option>
                            <option value="datasellerhub.com">datasellerhub.com</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Current Price ($)</label>
                        <input
                            type="number"
                            value={data.price}
                            onChange={e => setData({ ...data, price: e.target.value })}
                            className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition font-bold ${fetching ? 'opacity-50' : ''}`}
                            placeholder="0.00"
                            disabled={fetching}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Previous Price ($)</label>
                        <input
                            type="number"
                            value={data.previousPrice}
                            onChange={e => setData({ ...data, previousPrice: e.target.value })}
                            className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-100 font-bold text-slate-400 ${fetching ? 'opacity-50' : ''}`}
                            placeholder="Optional"
                            disabled={fetching}
                        />
                    </div>
                </div>
                <button onClick={onSave} className="w-full py-3 bg-slate-800 text-white rounded-xl hover:bg-black font-bold uppercase tracking-widest text-xs transition active:scale-95 cursor-pointer shadow-sm mt-2">
                    Confirm Updates
                </button>
            </div>
        </div>
    );
}

function RecordModal({ isOpen, onClose, title, data, setData, onSave, onDelete }) {
    if (!isOpen) return null;
    const fields = [
        { id: 'total', label: 'Total Records', icon: <MdStorage /> },
        { id: 'emails', label: 'Emails Found', icon: <MdEmail /> },
        { id: 'phones', label: 'Phones Found', icon: <MdPhone /> },
        { id: 'websites', label: 'Websites Joined', icon: <MdLanguage /> },
        { id: 'linkedin', label: 'LinkedIn', icon: <MdPublic /> },
        { id: 'facebook', label: 'Facebook', icon: <MdPublic /> },
        { id: 'instagram', label: 'Instagram', icon: <MdPublic /> },
        { id: 'twitter', label: 'X / Twitter', icon: <MdPublic /> },
        { id: 'tiktok', label: 'TikTok', icon: <MdPublic /> },
        { id: 'youtube', label: 'YouTube', icon: <MdPublic /> },
    ];

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-[120] flex items-center justify-center p-4 lg:p-8 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div className="flex flex-col gap-0.5">
                        <h2 className="font-bold text-slate-800 tracking-tight uppercase">Custom Digit Overrides</h2>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[300px]">{title}</span>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"><MdClose size={20} /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/10 custom-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {fields.map(field => (
                            <div key={field.id} className="space-y-1.5">
                                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                    <span className="text-slate-300">{field.icon}</span>
                                    {field.label}
                                </label>
                                <input
                                    type="number"
                                    value={data[field.id] || ''}
                                    onChange={e => setData({ ...data, [field.id]: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition text-slate-800 font-bold font-mono text-sm shadow-sm"
                                    placeholder="0"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <button onClick={onDelete} className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition flex items-center gap-2 cursor-pointer">
                        <MdClose />
                        Purge Manual Data
                    </button>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={onClose} className="flex-1 sm:flex-none px-5 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl font-bold text-[10px] uppercase tracking-widest cursor-pointer transition">Cancel</button>
                        <button onClick={onSave} className="flex-[2] sm:flex-none px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition active:scale-95">
                            <MdCheck size={16} />
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function getCountryName(code) {
    const countries = { US: 'United States', UK: 'United Kingdom', CA: 'Canada', AU: 'Australia', IN: 'India', DE: 'Germany', FR: 'France', JP: 'Japan', BR: 'Brazil', MX: 'Mexico' };
    return countries[code?.toUpperCase()] || code;
}
