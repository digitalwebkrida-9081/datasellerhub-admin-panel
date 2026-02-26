'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { MdRefresh, MdChevronRight, MdStorage, MdEmail, MdPhone, MdLanguage, MdEdit, MdVisibility, MdClose, MdFolder, MdArrowBack, MdCategory } from 'react-icons/md';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function MergedDataPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [browseData, setBrowseData] = useState(null);
    
    // Navigation state
    const [country, setCountry] = useState('');
    const [state, setState] = useState('');
    const [city, setCity] = useState('');
    
    // Preview modal
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [previewName, setPreviewName] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);
    
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

    const fetchBrowse = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (country) params.append('country', country);
            if (state) params.append('state', state);
            if (city) params.append('city', city);
            
            const res = await fetch(`${API_URL}/api/merged/browse?${params}`);
            const json = await res.json();
            if (json.success) setBrowseData(json.data);
        } catch (err) {
            console.error('Error fetching browse data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFolderClick = (folderName) => {
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
        if (city) setCity('');
        else if (state) setState('');
        else if (country) setCountry('');
    };

    // Preview
    const handlePreview = async (categoryName) => {
        setPreviewName(categoryName);
        setPreviewOpen(true);
        setPreviewLoading(true);
        setPreviewData(null);
        try {
            const params = new URLSearchParams({ country, category: categoryName });
            if (state) params.append('state', state);
            if (city) params.append('city', city);
            
            const res = await fetch(`${API_URL}/api/merged/preview?${params}`);
            const json = await res.json();
            if (json.success) setPreviewData(json.data);
        } catch (err) {
            console.error('Error fetching preview:', err);
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

    const { breadcrumb = [], folders = [], categories = [], summary = {} } = browseData || {};

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
            {categories.length > 0 && (
                <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                            <MdCategory size={16} />
                            Datasets
                            <span className="text-xs font-normal text-slate-400">({categories.length} categories)</span>
                        </h2>
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
                    </div>
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
                            <h2 className="text-lg font-bold text-slate-800">Preview: {formatCategoryName(previewName)}</h2>
                            <button onClick={() => setPreviewOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <MdClose size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            {previewLoading ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : previewData ? (
                                <>
                                    <p className="text-xs text-slate-400 mb-3">Showing first {previewData.rows.length} of {previewData.totalRecords.toLocaleString()} total records</p>
                                    <table className="w-full text-left text-xs text-slate-600">
                                        <thead className="bg-slate-50 font-bold text-slate-500 sticky top-0">
                                            <tr className="border-b border-slate-100">
                                                {previewData.columns.slice(0, 8).map(col => (
                                                    <th key={col} className="px-3 py-2 whitespace-nowrap">{formatCategoryName(col)}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {previewData.rows.map((row, i) => (
                                                <tr key={i} className="hover:bg-slate-50">
                                                    {previewData.columns.slice(0, 8).map(col => (
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
