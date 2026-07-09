import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RootState } from "../../store/store";
import { useSelector, useDispatch } from 'react-redux';
import { Modal } from "~/components";
import { setAddShopModalOpen } from '../../store/uiSlice';
import { ShopForm } from './components/ShopForm';

// 1. IMPORT APOLLO HOOK AND YOUR QUERY bluePrint

import { useQuery } from '@apollo/client/react';
import { GET_MY_SHOPS_QUERY } from '~/api/graphql/'; // Adjust import path as needed

export const MyShops: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isAddShopModalOpen = useSelector((state: RootState) => state.ui.isAddShopModalOpen);

    // PAGINATION SETUP: 10 items per page limit matrix footprint
    const PAGE_LIMIT = 10;
    const [offset, setOffset] = useState<number>(0);

    // 2. CONNECT HOOK BINDING WITH VARIABLES STRATEGY
    const { loading: isLoading, error, data } = useQuery(GET_MY_SHOPS_QUERY, {
        variables: {
            limit: PAGE_LIMIT,
            offset: offset,
        },
        fetchPolicy: 'cache-and-network', // Ensure ui updates smoothly when returning to dashboard
    });

    // Unpack data streams carefully matching server metadata footprints
    const paginatedPayload = data?.getMyShops;
    const loadedShops = paginatedPayload?.shops || [];
    const totalCount = paginatedPayload?.totalCount || 0;
    const hasNextPage = paginatedPayload?.hasNextPage || false;
    const hasPreviousPage = offset > 0;

    // Control Handlers
    const handleNextPage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasNextPage) setOffset((prev) => prev + PAGE_LIMIT);
    };

    const handlePrevPage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasPreviousPage) setOffset((prev) => Math.max(0, prev - PAGE_LIMIT));
    };

    return (
        <>
            <div className="w-full min-h-screen pb-10">

                {/* 3. ERROR HANDLER BOUNDARY SAFEGUARD SUB-TRACK */}
                {error && (
                    <div className="p-4 mb-4 rounded-xl bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-semibold max-w-6xl mt-4 animate-fade-in">
                        Error fetching commercial storefront layouts: {error.message}. Please reload.
                    </div>
                )}

                {/* 3-COLUMN RESPONSIVE LAYOUT MATRIX GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mt-4">

                    {isLoading ? (
                        /* --- DESIGN A: ANIMATED SKELETON LAYOUT MAPPING (3 Items) --- */
                        Array.from({ length: 3 }).map((_, index) => (
                            <div
                                key={`skeleton-${index}`}
                                className="flex flex-col bg-bg-primary rounded-2xl p-5 shadow-xs transition-shadow hover:shadow-sm animate-pulse"
                            >
                                <div className="w-full aspect-square bg-bg-secondary rounded-xl mb-4" />
                                <div className="flex-1 mb-6 space-y-2">
                                    <div className="h-4 w-1/2 bg-bg-secondary rounded-md" />
                                    <div className="h-3 w-3/4 bg-bg-secondary rounded-md" />
                                </div>
                                <div className="flex items-center justify-end gap-2.5 w-full">
                                    <div className="h-8 w-16 bg-bg-secondary rounded-lg" />
                                    <div className="h-8 w-16 bg-bg-secondary rounded-lg" />
                                </div>
                            </div>
                        ))
                    ) : loadedShops.length === 0 ? (
                        /* --- FALLBACK: EMPTY STATE BOUNDARY DISPLAY CONTAINER --- */
                        <div className="col-span-1 md:col-span-1 flex flex-col items-center justify-center p-12 bg-bg-primary rounded-2xl border border-dashed border-bg-secondary text-center">
                            <p className="text-sm font-bold text-text-main mb-2">No Shops Added Yet</p>
                            <p className="text-xs font-medium text-text-muted mb-4">You have not created any commercial storefront entries yet.</p>
                            <button
                                onClick={() => dispatch(setAddShopModalOpen(true))}
                                className="h-9 px-4 rounded-lg bg-brand-gold text-text-white text-xs font-bold cursor-pointer"
                            >
                                Click to Add Your First Shop
                            </button>
                        </div>
                    ) : (
                        /* --- DESIGN B: DYNAMIC COMPONENT STATISTIC CARD DISPLAY GRID --- */
                        loadedShops.map((shop) => (
                            <div
                                key={shop.id}
                                onClick={() => navigate(`/my-shops/${shop.id}`)}
                                className="flex flex-col bg-bg-primary rounded-2xl p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:bg-bg-primary-hover cursor-pointer"
                            >
                                {/* Square Core Image Asset Representation Box */}
                                <div className="w-full aspect-square bg-bg-secondary rounded-xl mb-4 shrink-0 overflow-hidden relative">
                                    {shop.photo ? (
                                        <img
                                            src={shop.photo}
                                            alt={shop.shopName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-text-muted text-xs font-semibold bg-bg-secondary-hover">No Cover Photo</div>
                                    )}
                                </div>

                                {/* Text Layout Metadata Labels */}
                                <div className="flex-1 mb-6">
                                    <h3 className="text-sm font-bold text-text-main mb-1 truncate">
                                        {shop.shopName}
                                    </h3>
                                    <p className="text-xs font-medium text-text-muted line-clamp-2">
                                        {shop.address}
                                    </p>
                                </div>

                                {/* ACTIONS ACTION BUTTON STRIP FOOTPRINT GROUP */}
                                <div className="flex items-center justify-end gap-2.5 w-full">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // Block card element click routing action bypasses
                                            console.log('Delete target ID:', shop.id);
                                        }}
                                        className="h-8 rounded-lg bg-brand-red hover:bg-brand-red-hover active:scale-98 transition-all px-4 text-xs font-bold text-text-white cursor-pointer border border-transparent"
                                    >
                                        Delete
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            console.log('Manage target ID:', shop.id);
                                        }}
                                        className="h-8 rounded-lg bg-brand-gold hover:bg-brand-gold-hover active:scale-98 transition-all px-4 text-xs font-bold text-text-white cursor-pointer border border-transparent"
                                    >
                                        Manage
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* 4. INTEGRATED FOOTER CONTROL STRIP STRATEGY */}
                {!isLoading && totalCount > PAGE_LIMIT && (
                    <div className="flex items-center justify-between max-w-6xl mt-8 px-2">
                        <span className="text-xs font-semibold text-text-muted">
                            Showing <strong className="text-text-main">{offset + 1}-{Math.min(offset + PAGE_LIMIT, totalCount)}</strong> of <strong className="text-text-main">{totalCount}</strong> blueprints
                        </span>
                        <div className="flex items-center gap-3">
                            <button
                                disabled={!hasPreviousPage}
                                onClick={handlePrevPage}
                                className="h-8 px-3 rounded-lg border border-bg-secondary bg-bg-primary text-xs font-bold text-text-main disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all hover:bg-bg-secondary-hover"
                            >
                                Previous
                            </button>
                            <button
                                disabled={!hasNextPage}
                                onClick={handleNextPage}
                                className="h-8 px-3 rounded-lg border border-bg-secondary bg-bg-primary text-xs font-bold text-text-main disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all hover:bg-bg-secondary-hover"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

            </div>
            <Modal
                isOpen={isAddShopModalOpen}
                onClose={() => dispatch(setAddShopModalOpen(false))}
                title="Create New Shop"
                subtitle="Setup your commercial storefront blueprint"
            >
                <ShopForm />
            </Modal>
        </>
    );
};