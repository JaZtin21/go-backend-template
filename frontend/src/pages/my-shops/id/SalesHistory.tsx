import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, ReceiptText } from 'lucide-react';
import { useCheckoutHistory, useItemActionHistory } from '~/api/queries';


const PAGE_LIMIT = 10;

export const SalesHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { shopId } = useParams<{ shopId: string }>();
  const [activeTab, setActiveTab] = useState<'checkout' | 'actions'>('checkout');
  const [checkoutOffset, setCheckoutOffset] = useState(0);
  const [actionsOffset, setActionsOffset] = useState(0);
  const isSubscribed = true;

  const checkoutQuery = useCheckoutHistory({
    shopId: shopId || '',
    offset: checkoutOffset,
    pageLimit: PAGE_LIMIT,     // 👈 Flattened and renamed from limit
    activeTab: activeTab,      // 👈 Required property passed directly
    isSubscribed: isSubscribed,
  })

  const itemActionsQuery = useItemActionHistory({
    shopId: shopId || '',
    offset: actionsOffset,
    pageLimit: PAGE_LIMIT,     // 👈 Flattened and renamed from limit
    activeTab: activeTab,      // 👈 Required property passed directly
    isSubscribed: isSubscribed,
  })


  const checkoutData = checkoutQuery.data?.getCheckoutHistory;
  const actionData = itemActionsQuery.data?.getItemActionHistory;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(value);

  const formatDate = (value: string) =>
    new Date(value).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  const currentError = activeTab === 'checkout' ? checkoutQuery.error : itemActionsQuery.error;
  const isLoading = activeTab === 'checkout' ? checkoutQuery.loading : itemActionsQuery.loading;


  return (
    <div className="w-full min-h-screen text-text-main flex flex-col gap-2">
      <div className="flex justify-between items-center px-2">
        <button
          onClick={() => navigate(-1)}
          className="flex text-text-muted hover:text-text-main transition-colors duration-200 items-center gap-1.5 h-8 rounded-xl text-xs font-bold cursor-pointer active:scale-98"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          <span>Go Back to My Shop</span>
        </button>
      </div>

      <div className="w-full bg-bg-primary border border-border-main rounded-xl md:p-6 p-4 flex flex-col gap-6">


        <div className="flex bg-bg-secondary rounded-full w-full max-w-lg border border-border-main">
          <button
            type="button"
            onClick={() => setActiveTab('checkout')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold transition-all duration-200 rounded-full cursor-pointer ${activeTab === 'checkout' ? 'bg-brand-gold text-text-white shadow-sm' : 'text-text-sub hover:text-text-main'}`}
          >
            <ReceiptText size={16} />
            Checkout History
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('actions')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold transition-all duration-200 rounded-full cursor-pointer ${activeTab === 'actions' ? 'bg-brand-gold text-text-white shadow-sm' : 'text-text-sub hover:text-text-main'}`}
          >
            <ClipboardList size={16} />
            Item Actions History
          </button>
        </div>

        {currentError && (
          <div className="p-4 rounded-xl bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-semibold">
            Failed to load history: {currentError.message}
          </div>
        )}

        {activeTab === 'checkout' && (
          <div className="flex flex-col gap-4">
            {isLoading ? (
              <div className="text-sm text-text-muted py-8 text-center">Loading checkout history...</div>
            ) : (checkoutData?.batches?.length || 0) === 0 ? (
              <div className="text-sm text-text-muted py-8 text-center">No checkout batches recorded yet.</div>
            ) : (
              <div className="flex flex-col gap-4">
                {checkoutData?.batches.map((batch) => (
                  <div key={batch.id} className="rounded-2xl border border-border-main ">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 pb-4 p-4 ">
                      <div>
                        <h3 className="text-sm font-bold text-text-main">Batch #{batch.id.slice(0, 8)}</h3>
                        <p className="text-xs text-text-muted mt-1">Sold at {formatDate(batch.soldAt)}</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div><span className="text-text-muted block">Items</span><span className="font-bold text-text-main">{batch.totalItems}</span></div>
                        <div><span className="text-text-muted block">Total Cost</span><span className="font-bold text-text-main">{formatCurrency(batch.totalCost)}</span></div>
                        <div><span className="text-text-muted block">Gross Sale</span><span className="font-bold text-text-main">{formatCurrency(batch.grossSale)}</span></div>
                        <div><span className="text-text-muted block">Gross Profit</span><span className="font-bold text-brand-green">{formatCurrency(batch.grossProfit)}</span></div>
                      </div>
                    </div>
                    <div className="overflow-x-auto  max-h-[200px] bg-brand-gold/10  rounded-2xl">
                      <table className="w-full min-w-[700px] text-left border-collapse">
                        <thead className='sticky top-0 bg-brand-gold '>
                          <tr className="border-b border-border-sub/40 text-text-white text-xs font-bold uppercase tracking-wider h-10">
                            <th className="pl-4 ">Item Name</th>
                            <th>Qty</th>
                            <th>Cost Price</th>
                            <th>Selling Price</th>
                            <th>Line Cost</th>
                            <th>Line Sale</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-sub/20 text-sm font-medium">
                          {batch.items.map((item: any) => (
                            <tr key={item.id} className="h-11">
                              <td className="font-semibold text-text-main pl-4">{item.itemName}</td>
                              <td>{item.quantity}</td>
                              <td>{formatCurrency(item.costPrice)}</td>
                              <td>{formatCurrency(item.sellingPrice)}</td>
                              <td>{formatCurrency(item.lineCostTotal)}</td>
                              <td>{formatCurrency(item.lineSaleTotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                disabled={checkoutOffset === 0}
                onClick={() => setCheckoutOffset((prev) => Math.max(0, prev - PAGE_LIMIT))}
                className="px-3 py-1.5 text-xs font-semibold rounded-md border border-border-main hover:bg-bg-secondary text-text-sub cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Previous
              </button>
              <button
                disabled={!checkoutData?.hasNextPage}
                onClick={() => setCheckoutOffset((prev) => prev + PAGE_LIMIT)}
                className="px-3 py-1.5 text-xs font-semibold rounded-md border border-border-main hover:bg-bg-secondary text-text-sub cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="flex flex-col gap-4">
            {isLoading ? (
              <div className="text-sm text-text-muted py-8 text-center">Loading item action history...</div>
            ) : (actionData?.records?.length || 0) === 0 ? (
              <div className="text-sm text-text-muted py-8 text-center">No item action history recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-sub/40 text-text-muted text-xs font-bold uppercase tracking-wider h-12">
                      <th>Action</th>
                      <th>Item Name</th>
                      <th>Quantity</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-sub/20 text-sm font-medium">
                    {actionData?.records.map((record) => (
                      <tr key={record.id} className="hover:bg-item-hover/20 transition-colors h-12">
                        <td className="font-bold text-text-main capitalize">{record.action}</td>
                        <td>{record.itemName}</td>
                        <td>{record.quantity ?? '--'}</td>
                        <td>{formatDate(record.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                disabled={actionsOffset === 0}
                onClick={() => setActionsOffset((prev) => Math.max(0, prev - PAGE_LIMIT))}
                className="px-3 py-1.5 text-xs font-semibold rounded-md border border-border-main hover:bg-bg-secondary text-text-sub cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Previous
              </button>
              <button
                disabled={!actionData?.hasNextPage}
                onClick={() => setActionsOffset((prev) => prev + PAGE_LIMIT)}
                className="px-3 py-1.5 text-xs font-semibold rounded-md border border-border-main hover:bg-bg-secondary text-text-sub cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
