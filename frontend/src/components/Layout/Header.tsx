import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Sun, Moon, Plus, Menu, X as Cross } from 'lucide-react'; // 1. ADDED: Menu icon
import { useTheme } from '../ThemeProvider';
import { useDispatch } from 'react-redux';
import { setAddShopModalOpen } from '../../store/uiSlice';

interface HeaderProps {
    isAuthenticated: boolean;
    userInfo: { firstName: string; lastName: string; avatarUrl?: string } | null;
    logoutAndClear: () => void;
    isSidebarOpen: boolean;       // 2. ADDED: state parameter mapping
    setIsSidebarOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
    isAuthenticated,
    userInfo,
    logoutAndClear,
    isSidebarOpen,
    setIsSidebarOpen
}) => {
    const navigate = useNavigate();
    const routerLocation = useLocation();
    const { theme, toggleTheme } = useTheme();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const dispatch = useDispatch();

    const onAddShopClick = () => {
        // Dispatch the action to open the Add Shop modal
        dispatch(setAddShopModalOpen(true));
    }

    const isMainMapPage = routerLocation.pathname === '/';
    const isMyShopsPage = routerLocation.pathname === '/my-shops' || routerLocation.pathname.startsWith('/my-shops/');
    const isSubShopPage = routerLocation.pathname.startsWith('/my-shops/');

    const [activeTab, setActiveTab] = useState<'about' | 'reviews'>('about'); // State to manage active tab in the second sidebar

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header
            className={`absolute top-0 right-0 left-0 z-30 flex h-14 items-center justify-between pr-4 pl-2 md:pl-16 transition-all duration-200 ${isMainMapPage
                ? 'bg-transparent pointer-events-none'
                : 'bg-bg-primary  shadow-xs pointer-events-auto'
                }`}
        >

            {/* LEFT SIDE ACCUMULATOR PANEL */}
            <div className={`flex items-center md:pl-4 gap-2 ${isMainMapPage ? 'pointer-events-auto' : ''}`}>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="flex md:hidden h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-text-sub hover:text-text-main  hover:bg-item-hover transition-colors outline-hidden shrink-0 mr-1"
                >
                    <Menu size={16} strokeWidth={2.5} />
                </button>
                {isMyShopsPage ? (
                    /* --- BLUEPRINT DESIGN B: MY SHOPS CONTENT MODE HOOK --- */
                    <div className="flex items-center gap-4 md:pl-4 animate-in fade-in duration-200">
                        <h1 className="text-lg font-bold text-text-main whitespace-nowrap">
                            My shops
                        </h1>
                        {
                            !isSubShopPage &&
                            <button
                                onClick={onAddShopClick}
                                className="flex h-7 items-center text-text-white gap-1 rounded-full bg-brand-gold hover:bg-brand-gold-hover px-3 transition-color duration-200 text-[11px] font-semibold text-text-sub  cursor-pointer"
                            >
                                <Plus size={12} strokeWidth={4} />
                                Add Shop
                            </button>
                        }

                    </div>
                ) : (
                    /* --- BLUEPRINT DESIGN A: CORE MAP SEARCH ENVIRONMENT --- */
                    <>
                        <div className={`flex h-9 w-64 items-center z-10 gap-2.5 bg-bg-secondary rounded-full  px-4 transition-colors shadow-xs
                            }`}>
                            <Search size={15} className="text-text-sub shrink-0" strokeWidth={2.5} />
                            <input
                                type="text"
                                placeholder="Search for stores..."
                                className="w-full bg-bg-secondary text-xs z-10 font-normal text-text-sub outline-hidden placeholder:text-text-muted"
                            />
                            <Cross size={15} className="text-text-sub shrink-0 cursor-pointer" strokeWidth={2.5} />

                        </div>
                        <div className="fixed second-sidebar top-0 left-16 bottom-0 z-9 flex flex-col bg-bg-primary transition-all duration-200 ease-in-out border-none w-72 -translate-x-full md:translate-x-0 overflow-y-auto select-none">


                            {/* Banner / Store Image */}
                            <div className="w-full h-44 bg-brand-green overflow-hidden shrink-0">
                                <img
                                    src="your-anime-image-url-here"
                                    alt=""
                                    className="w-full h-full object-cover object-top"
                                />
                            </div>

                            {/* Profile Header & Tab Toggles */}
                            <div className="p-4 flex flex-col gap-4 pb-2">
                                <h1 className="text-2xl font-black text-text-main tracking-tight">fujf</h1>

                                {/* Tab Navigation Pill Wrapper */}
                                <div className="flex bg-bg-secondary p-1 rounded-lg border border-border-sub">
                                    <button
                                        onClick={() => setActiveTab('about')}
                                        className={`flex-1 text-center py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-0 border-none  transition-all cursor-pointer ${activeTab === 'about'
                                            ? 'bg-bg-primary text-text-main shadow-xs border border-border-main'
                                            : 'text-text-muted hover:text-text-main'
                                            }`}
                                    >
                                        About
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('reviews')}
                                        className={`flex-1 text-center py-2 text-sm focus:outline-none focus:ring-0 border-none  font-medium rounded-md transition-all cursor-pointer ${activeTab === 'reviews'
                                            ? 'bg-bg-primary text-text-main shadow-xs border border-border-main'
                                            : 'text-text-muted hover:text-text-main'
                                            }`}
                                    >
                                        Reviews
                                    </button>
                                </div>
                            </div>

                            {/* TAB CONTENT HOUSING */}
                            <div className="px-4 pb-6 flex-1 flex flex-col gap-4">

                                {/* ================= ABOUT TAB CONTENT ================= */}
                                {activeTab === 'about' && (
                                    <div className="space-y-4 pt-2 animate-fadeIn ">
                                        {/* Metadata Fields Section */}
                                        <div className="space-y-4 pt-2">
                                            {/* Description Field */}
                                            <div>
                                                <h3 className="text-sm font-bold text-text-main mb-1">Description</h3>
                                                <p className="text-sm text-text-sub font-medium">fujfu</p>
                                            </div>

                                            {/* Address Field */}
                                            <div>
                                                <h3 className="text-sm font-bold text-text-main mb-1">Address</h3>
                                                <p className="text-sm text-text-sub leading-snug font-medium">
                                                    Victory Lacson Underpass, 1001 Manila, Philippines
                                                </p>
                                                <button className="text-xs text-brand-gold hover:text-brand-gold-hover transition-colors font-medium mt-1 inline-block cursor-pointer">
                                                    Click to get directions on Google Maps
                                                </button>
                                            </div>
                                        </div>

                                        {/* Structural Divider */}
                                        <hr className="border-t border-border-sub my-1" />

                                        {/* Search Products Button */}
                                        <button className="w-full bg-brand-green hover:bg-brand-green-hover text-text-white py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            Search Products
                                        </button>

                                        {/* Structural Divider */}
                                        <hr className="border-t border-border-sub my-1" />

                                        {/* Inquiry Section Header */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">💬</span>
                                            <h3 className="text-sm font-bold text-text-main">Send Inquiry</h3>
                                        </div>

                                        {/* Contact Form Elements */}
                                        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                                            {/* Product Input Field */}
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold text-text-muted">Item/Product</label>
                                                <input
                                                    type="text"
                                                    placeholder="What item are you asking about?"
                                                    className="w-full p-3 text-sm bg-bg-primary border border-border-main rounded-xl focus:outline-none focus:border-brand-gold placeholder:text-text-muted transition-colors font-medium"
                                                />
                                            </div>

                                            {/* Message Textarea Field */}
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold text-text-muted">Message</label>
                                                <textarea
                                                    rows={3}
                                                    placeholder="Your inquiry message..."
                                                    className="w-full p-3 text-sm bg-bg-primary border border-border-main rounded-xl focus:outline-none focus:border-brand-gold placeholder:text-text-muted transition-colors font-medium resize-none"
                                                ></textarea>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* ================= REVIEWS TAB CONTENT ================= */}
                                {activeTab === 'reviews' && (
                                    <div className="space-y-4 pt-2 flex flex-col">

                                        {/* 1. Rating Summary Breakdown Dashboard */}
                                        <div className="flex items-center justify-between p-4 bg-linear-to-b from-white to-[#f4faff] border border-blue-50 rounded-2xl shadow-xs">
                                            {/* Left Total Score Aggregation */}
                                            <div className="text-center flex flex-col items-center justify-center pl-2">
                                                <span className="text-3xl font-black text-text-main leading-none">4.0</span>
                                                {/* 5-Star Row Representation */}
                                                <div className="flex gap-0.5 text-brand-gold my-1.5 text-sm">
                                                    <span>★</span><span>★</span><span>★</span><span>★</span><span className="text-gray-200">★</span>
                                                </div>
                                                <span className="text-xs text-text-muted font-medium">1 reviews</span>
                                            </div>

                                            {/* Right Progressive Graph Bars */}
                                            <div className="flex-1 max-w-[130px] space-y-1 text-[11px] font-bold text-text-muted">
                                                {[
                                                    { star: 5, pct: 'w-0', count: 0 },
                                                    { star: 4, pct: 'w-full bg-brand-gold', count: 1 }, // Active item matching screenshot
                                                    { star: 3, pct: 'w-0', count: 0 },
                                                    { star: 2, pct: 'w-0', count: 0 },
                                                    { star: 1, pct: 'w-0', count: 0 }
                                                ].map((row) => (
                                                    <div key={row.star} className="flex items-center gap-2">
                                                        <span className="w-3 text-right">{row.star}★</span>
                                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${row.pct}`}></div>
                                                        </div>
                                                        <span className="w-2 text-right text-gray-400 font-normal">{row.count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 2. Edit Review Action Trigger Button */}
                                        <button className="w-full bg-brand-green hover:bg-brand-green-hover text-text-white py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer text-sm">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Edit Your Review
                                        </button>

                                        {/* 3. User Review Card Component Feed */}
                                        <div className="border border-brand-green/40 p-3 rounded-2xl flex flex-col gap-2.5 bg-bg-primary relative">
                                            {/* Card Meta Top Line Header */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src="your-avatar-url"
                                                        alt="Jas M"
                                                        className="w-8 h-8 rounded-full object-cover border border-border-main"
                                                    />
                                                    <span className="font-bold text-sm text-text-main">Jas M</span>
                                                    <span className="text-[10px] bg-brand-green/15 text-brand-green-hover font-bold px-2 py-0.5 rounded-full">You</span>
                                                </div>

                                                {/* Actions Subgroup (Edit / Delete) */}
                                                <div className="flex items-center gap-2 text-text-muted">
                                                    <button className="hover:text-text-main transition-colors cursor-pointer p-0.5">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button className="hover:text-brand-red transition-colors cursor-pointer p-0.5">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Star Rating Score Display */}
                                            <div className="flex gap-0.5 text-brand-gold text-xs -mt-1">
                                                <span>★</span><span>★</span><span>★</span><span>★</span><span className="text-gray-200">★</span>
                                            </div>

                                            {/* Text Review Core Content */}
                                            <p className="text-xs text-text-sub font-medium leading-relaxed break-words">
                                                dsadasdsa
                                            </p>

                                            {/* Embedded User Review Image Attachment */}
                                            <div className="w-full rounded-xl overflow-hidden bg-bg-secondary border border-border-sub">
                                                <img
                                                    src="your-potato-chips-url"
                                                    alt="Review Attachment"
                                                    className="w-full object-cover max-h-48"
                                                />
                                            </div>

                                            {/* Bottom Card Timeline Footer */}
                                            <span className="text-[10px] text-text-muted font-medium mt-0.5">
                                                Jul 7, 2026
                                            </span>
                                        </div>

                                    </div>
                                )}

                            </div>
                        </div>
                        <button
                            onClick={() => console.log('Filtering...')}
                            className="flex h-9 items-center gap-1.5 rounded-full bg-brand-gold hover:bg-brand-gold-hover ml-5 px-4 shadow-xs transition-all duration-200 active:scale-98 cursor-pointer text-text-dark font-semibold"
                        >
                            <span className="h-2.5 w-2.5 rounded-xs bg-white/40 shrink-0" />
                            <span className="text-[11px] text-bg-primary  whitespace-nowrap">
                                Shop near me
                            </span>
                        </button>
                    </>
                )}
            </div>

            {/* RIGHT SIDE: PROFILE SECTION */}
            <div className={`flex items-center gap-3 ${isMainMapPage ? 'pointer-events-auto' : ''}`} ref={dropdownRef}>
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="h-9 w-9 rounded-full bg-bg-secondary shadow-xs cursor-pointer flex items-center justify-center font-bold text-white text-xs overflow-hidden border border-white/20 transition-transform active:scale-95"
                    >
                        {userInfo?.avatarUrl ? (
                            <img src={userInfo.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                            userInfo?.firstName?.charAt(0).toUpperCase() || '👤'
                        )}
                    </button>

                    {/* DROP DOWN MENU */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-bg-primary dark:bg-bg-secondary p-1 shadow-lg z-50 transition-colors">

                            {/* ACCOUNT IDENTIFIER BANNER */}
                            <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-800 mb-1">
                                {/* FIXED: Section title uses the gray muted design category token token */}
                                <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Account</p>
                                {/* FIXED: Core profile identification name uses the crisp bold main token text style */}
                                <p className="text-xs font-bold text-text-main truncate">
                                    {isAuthenticated && userInfo ? `${userInfo.firstName} ${userInfo.lastName}` : 'Public Guest'}
                                </p>
                            </div>

                            {/* NAVIGATION CONTROLS */}
                            <button
                                onClick={() => { navigate('/profile'); setIsDropdownOpen(false); }}
                                /* FIXED: View Profile text uses text-text-sub for a modern soft charcoal color look */
                                className="w-full text-left rounded-md px-3 py-1.5 text-xs font-medium text-text-sub hover:bg-item-hover transition-colors cursor-pointer"
                            >
                                👤 View Profile
                            </button>

                            {/* THEME TOGGLE ROW */}
                            <button
                                onClick={toggleTheme}
                                /* FIXED: Toggle mode row link uses soft grey text-text-sub layout profiles */
                                className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs font-medium text-text-sub hover:bg-item-hover transition-colors cursor-pointer"
                            >
                                <span className="flex items-center gap-2">
                                    {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                                </span>
                                <div className="text-text-muted">
                                    {theme === 'light' ? (
                                        <Moon size={13} strokeWidth={2.5} />
                                    ) : (
                                        <Sun size={13} strokeWidth={2.5} className="text-yellow-500" />
                                    )}
                                </div>
                            </button>

                            {/* LOGOUT SYSTEM ACTION */}
                            <button
                                onClick={() => { logoutAndClear(); setIsDropdownOpen(false); }}
                                className="w-full text-left rounded-md px-3 py-1.5 text-xs font-bold text-brand-red hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors cursor-pointer border-t border-gray-100 dark:border-gray-800 mt-1 pt-1.5"
                            >
                                👋 Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
