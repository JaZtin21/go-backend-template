import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface InventoryItem {
    id: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    description: string;
}

// 📦 TEST DATA MATCHING YOUR SCREENSHOT Layout
const MOCK_INVENTORY: InventoryItem[] = [
    { id: '1', name: 'dsads', category: '-', price: 1.00, stock: 1, description: '' },
    { id: '2', name: 'dsadsa', category: '-', price: 11.00, stock: 1, description: '' },
    { id: '3', name: 'dsadsa', category: '-', price: 1.00, stock: 1, description: '' },
    { id: '4', name: 'dsadas', category: '-', price: 1.00, stock: 1, description: '' },
    { id: '5', name: 'dsadsa', category: '-', price: 1.00, stock: 1, description: '' },
    { id: '6', name: 'dsadas', category: '-', price: 12.00, stock: 1, description: '' },
    { id: '7', name: '3123', category: '-', price: 123.00, stock: 0, description: '' },
    { id: '8', name: 'dasdas', category: '-', price: 21321.00, stock: 1, description: 'dsa' },
    { id: '9', name: 'dsada', category: '-', price: 13123.00, stock: 2131, description: '' },
    { id: '10', name: 'dsada', category: '-', price: 1.00, stock: 2, description: '' },
    { id: '11', name: 'dsada', category: '-', price: 123.00, stock: 1, description: 'dsadsa' },
    { id: '12', name: 'Extra Item B', category: 'Testing', price: 99.00, stock: 50, description: 'Pagination check' },
];

export const InventoryPage = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Matches your exact layout length
    const { shopId } = useParams<{ shopId: string }>();
    const navigate = useNavigate();

    console.log('Current Shop ID:', shopId); // Debugging: Log the current shop ID

    useLayoutEffect(() => {
        // 💡 Instantly matches the new scroll layout wrapper and resets it to zero on load
        const scrollableContainer = document.querySelector('.overflow-y-auto');
        if (scrollableContainer) {
            scrollableContainer.scrollTop = 0;
        }
    }, []);

    // Pagination calculations
    const totalItems = MOCK_INVENTORY.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = MOCK_INVENTORY.slice(startIndex, startIndex + itemsPerPage);

    // Format currency to Philippine Peso (₱) matching layout design
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(value);
    };

    return (
        <div className="w-full min-h-screen  text-text-main flex flex-col ">
            {/* --- COMMAND IMPLEMENTED: GO BACK STRIP ON TOP OF CHART CONTAINER --- */}
            <div className="flex justify-between items-center px-2 ">
                <button
                    onClick={() => navigate(-1)}
                    className="flex text-text-muted hover:text-text-main transition-colors duration-200 items-center gap-1.5 h-8  rounded-xl text-text-sub text-xs font-bold transition-all duration-200 cursor-pointer active:scale-98 border border-transparent"
                >
                    <ArrowLeft size={16} strokeWidth={2.5} />
                    <span className="">Go Back to My Shops</span>
                </button>
            </div>

            {/* CONTAINER PANEL */}
            <div className="w-full  bg-bg-primary border border-border-main rounded-xl p-6  flex flex-col">

                {/* HEADER SECTION */}
                <div className="flex items-center justify-between pb-6 border-b border-border-sub">
                    <h1 className="text-xl font-bold tracking-tight text-text-main">fujf</h1>
                    <span className="text-xs text-text-muted font-medium bg-bg-secondary px-3 py-1.5 rounded-lg border border-border-sub">
                        {totalItems} total items
                    </span>
                </div>

                {/* SCROLLABLE TABLE FRAMEWORK */}
                <div className="overflow-x-auto w-full mt-4">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="border-b border-border-sub/40 text-text-muted text-xs font-bold uppercase tracking-wider h-12">
                                <th className="pb-3 pl-2">Item Name</th>
                                <th className="pb-3">Category</th>
                                <th className="pb-3">Price</th>
                                <th className="pb-3">Stock</th>
                                <th className="pb-3">Description</th>
                                <th className="pb-3 text-right pr-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-sub/20 text-sm font-medium">
                            {paginatedItems.map((item) => (
                                <tr key={item.id} className="hover:bg-item-hover/30 transition-colors h-14">
                                    <td className="pl-2 font-bold text-text-main truncate max-w-[150px]">{item.name}</td>
                                    <td className="text-text-muted">{item.category}</td>
                                    <td className="text-text-main font-semibold">{formatCurrency(item.price)}</td>
                                    <td>
                                        {/* Dynamic stock badges matching the screenshot */}
                                        <span className={`inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${item.stock <= 1
                                            ? 'bg-brand-red/10 border-brand-red/20 text-brand-red'
                                            : 'bg-brand-green/10 border-brand-green/20 text-brand-green'
                                            }`}>
                                            {item.stock} units
                                        </span>
                                    </td>
                                    <td className="text-text-muted truncate max-w-[180px]">{item.description || '-'}</td>
                                    <td className="text-right pr-4">
                                        <div className="inline-flex gap-2">
                                            <button className="h-7 px-3 text-xs font-bold rounded-md bg-[#2563eb] text-white hover:bg-blue-600 transition-colors cursor-pointer shadow-xs">
                                                Edit
                                            </button>
                                            <button className="h-7 px-3 text-xs font-bold rounded-md bg-brand-red text-white hover:bg-brand-red-hover transition-colors cursor-pointer shadow-xs">
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 🧭 FOOTER PAGINATION BAR */}
                <div className="flex items-center justify-between pt-6 mt-4 border-t border-border-sub/60">
                    <span className="text-xs text-text-muted">
                        Showing <span className="text-text-main font-semibold">{startIndex + 1}</span> to{' '}
                        <span className="text-text-main font-semibold">
                            {Math.min(startIndex + itemsPerPage, totalItems)}
                        </span>{' '}
                        of <span className="text-text-main font-semibold">{totalItems}</span> entries
                    </span>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="h-8 px-3 text-xs font-semibold rounded-lg bg-bg-primary border border-border-main text-text-sub hover:bg-item-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            Previous
                        </button>

                        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`h-8 w-8 text-xs font-bold rounded-lg border transition-all cursor-pointer ${currentPage === page
                                    ? 'bg-brand-gold text-bg-primary border-brand-gold shadow-md'
                                    : 'bg-bg-primary border-border-main text-text-sub hover:bg-item-hover'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="h-8 px-3 text-xs font-semibold rounded-lg bg-bg-primary border border-border-main text-text-sub hover:bg-item-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            Next
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
