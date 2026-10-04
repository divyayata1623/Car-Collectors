import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../api';

export const AdminShippingPage: React.FC = () => {
  const [flatFee, setFlatFee] = useState('0');
  const [freeThreshold, setFreeThreshold] = useState('0');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    adminAPI.getShippingSettings()
      .then(({ data }) => {
        setFlatFee(String(data.flat_fee));
        setFreeThreshold(String(data.free_shipping_threshold));
      })
      .catch(() => setError('Unable to load shipping settings.'));
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setIsSaving(true);
    try {
      await adminAPI.updateShippingSettings({
        flat_fee: Number(flatFee) || 0,
        free_shipping_threshold: Number(freeThreshold) || 0,
      });
      setMessage('Shipping settings saved.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Unable to save shipping settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <p className="text-[#F26A21] text-xs font-bold uppercase tracking-[0.18em] mb-3">Store rules</p>
        <h1 className="text-4xl font-bold text-[#F5F7FA] mb-2 tracking-tight">Shipping</h1>
        <p className="text-[#94A3B8]">Control the delivery fee shown to customers at checkout.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#101827] border border-white/10 rounded-xl p-6 sm:p-8 space-y-6">
        {message && <div className="bg-green-500/10 border border-green-400/30 text-green-300 rounded-lg px-4 py-3 text-sm">{message}</div>}
        {error && <div className="bg-red-500/10 border border-red-400/30 text-red-300 rounded-lg px-4 py-3 text-sm">{error}</div>}

        <div>
          <label className="block text-xs font-semibold text-[#8390A5] uppercase tracking-[0.16em] mb-2">Flat shipping fee</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={flatFee}
            onChange={(event) => setFlatFee(event.target.value)}
            className="w-full bg-[#080D16] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#4F86F7]"
          />
          <p className="text-[#68758A] text-sm mt-2">Applied when the order does not qualify for free shipping.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#8390A5] uppercase tracking-[0.16em] mb-2">Free shipping above</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={freeThreshold}
            onChange={(event) => setFreeThreshold(event.target.value)}
            className="w-full bg-[#080D16] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#4F86F7]"
          />
          <p className="text-[#68758A] text-sm mt-2">Set to 0 to disable the free-shipping threshold.</p>
        </div>

        <button type="submit" disabled={isSaving} className="bg-[#F26A21] hover:bg-[#FF7A31] disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
          {isSaving ? 'Saving...' : 'Save Shipping Rules'}
        </button>
      </form>
    </div>
  );
};
