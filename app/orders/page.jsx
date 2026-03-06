"use client";
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6969';
            const response = await fetch(`${API_URL}/api/payment/orders`);
            const data = await response.json();
            
            if (data.success) {
                setOrders(data.data);
            } else {
                setError(data.message || 'Failed to fetch orders');
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('An error occurred while fetching orders.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Purchase Orders</h1>
                    <p className="text-slate-500 mt-1">View all completed and failed transactions</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6 border border-red-100">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 tracking-wider">
                            <tr className="border-b border-slate-100">
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Dataset Details</th>
                                <th className="px-6 py-4 whitespace-nowrap">Amount ($)</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 bg-slate-50/50">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <p className="text-sm">Loading orders...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 bg-slate-50/50">
                                        No purchase orders found.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order._id} className="hover:bg-slate-50 transition duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(order.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-medium text-slate-800">
                                            {order.orderId}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800">{order.name || 'N/A'}</div>
                                            <div className="text-xs text-slate-500">{order.email || 'N/A'}</div>
                                            <div className="text-xs text-slate-500">{order.phone || ''}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {order.datasetDetails ? (
                                                <div className="max-w-[200px] truncate" title={`${order.datasetDetails.category || ''} in ${order.datasetDetails.location || ''}`}>
                                                    <span className="font-medium">{order.datasetDetails.category || 'Any Category'}</span>
                                                    <br/>
                                                    <span className="text-xs text-slate-400">
                                                        in {order.datasetDetails.location || 'Any Location'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-700">
                                            ${parseFloat(order.amount || 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                                order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                order.status === 'CREATED' ? 'bg-blue-100 text-blue-700' :
                                                order.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
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
