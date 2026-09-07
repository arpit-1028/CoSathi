import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  ReceiptText,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Search,
  Filter,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  X,
  Scale,
} from 'lucide-react';

export const RateCardManager = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [version, setVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Add Item Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemData, setNewItemData] = useState({
    category: '',
    serviceCode: '',
    titleEn: '',
    titleHi: '',
    billingType: 'fixed',
    standardRate: '',
    cooperativeMinRate: '',
    cooperativeMaxRate: '',
  });

  // Edit Item Modal
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({
    titleEn: '',
    titleHi: '',
    standardRate: '',
    cooperativeMinRate: '',
    cooperativeMaxRate: '',
    isActive: true,
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchRateCard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cooperative/rate-card');
      if (res.data.success) {
        setItems(res.data.items || []);
        setCategories(res.data.categories || []);
        setVersion(res.data.version || { versionNumber: 'v2026.1', effectiveFrom: new Date() });
        if (res.data.categories?.length > 0 && !newItemData.category) {
          setNewItemData((prev) => ({ ...prev, category: res.data.categories[0]._id }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch rate card', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRateCard();
  }, []);

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditFormData({
      titleEn: item.title?.en || '',
      titleHi: item.title?.hi || '',
      standardRate: item.standardRate || 0,
      cooperativeMinRate: item.cooperativeMinRate || 0,
      cooperativeMaxRate: item.cooperativeMaxRate || 0,
      isActive: item.isActive,
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      setSaving(true);
      const res = await api.put(`/cooperative/rate-card/${editingItem._id}`, {
        title: { en: editFormData.titleEn, hi: editFormData.titleHi },
        standardRate: Number(editFormData.standardRate),
        cooperativeMinRate: Number(editFormData.cooperativeMinRate),
        cooperativeMaxRate: Number(editFormData.cooperativeMaxRate),
        isActive: editFormData.isActive,
      });
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Rate card item updated successfully!' });
        setEditingItem(null);
        fetchRateCard();
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to update rate card item' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddItemSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.post('/cooperative/rate-card', {
        category: newItemData.category,
        serviceCode: newItemData.serviceCode,
        title: { en: newItemData.titleEn, hi: newItemData.titleHi },
        billingType: newItemData.billingType,
        standardRate: Number(newItemData.standardRate),
        cooperativeMinRate: Number(newItemData.cooperativeMinRate),
        cooperativeMaxRate: Number(newItemData.cooperativeMaxRate),
      });

      if (res.data.success) {
        setMessage({ type: 'success', text: 'New service added to Cooperative Rate Card!' });
        setShowAddModal(false);
        setNewItemData({
          category: categories[0]?._id || '',
          serviceCode: '',
          titleEn: '',
          titleHi: '',
          billingType: 'fixed',
          standardRate: '',
          cooperativeMinRate: '',
          cooperativeMaxRate: '',
        });
        fetchRateCard();
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to add service item' });
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCat =
      selectedCategory === 'all' ||
      item.category?._id === selectedCategory ||
      item.category === selectedCategory ||
      item.category?.slug === selectedCategory;

    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      item.serviceCode?.toLowerCase().includes(q) ||
      item.title?.en?.toLowerCase().includes(q) ||
      item.title?.hi?.toLowerCase().includes(q);

    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#FFFFFF] rounded-xl p-6 border border-[#D9D5CC] shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="w-5 h-5 rounded-full bg-[#3C5A48] text-[#F7F4EE] font-serif text-[10px] font-bold flex items-center justify-center">
              दर
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#3C5A48]">
              Cooperative Governance • सहकारी मूल्य सूची
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#20242A]">
            Standard Rate Card & Price Bounds
          </h2>
          <p className="text-xs text-[#636D79] mt-0.5">
            Democratic, transparent price floors and ceilings. Zero surge pricing algorithms.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchRateCard}
            className="p-2.5 rounded-lg border border-[#D9D5CC] hover:bg-[#F7F4EE] text-[#20242A] transition-colors text-xs font-semibold flex items-center space-x-1.5"
            title="Refresh Rate Card"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#3C5A48]' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#3C5A48] hover:bg-[#2A4032] text-white px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors shadow-xs flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Rate Item</span>
          </button>
        </div>
      </div>

      {/* MANDATORY PHASE 10 UI BANNER */}
      <div className="p-4 rounded-xl bg-[#24324A] text-white shadow-card flex items-center space-x-3.5 border border-[#162031]">
        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-[#DF9F35]">
          <Scale className="w-5 h-5 text-[#DF9F35]" />
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase tracking-wider text-[#DF9F35] font-bold block">
            सहकारी मूल्य निर्धारण निर्देश • Cooperative Fair Pricing Directive
          </span>
          <p className="text-sm font-serif italic text-white/95 leading-snug">
            "AI identifies the work. The cooperative rate card determines the price."
          </p>
        </div>
      </div>

      {/* Version & Policy Banner */}
      <div className="bg-[#F7F4EE] border border-[#D9D5CC] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#20242A]">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#EAE5DA] rounded-lg text-[#3C5A48]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold flex items-center space-x-2">
              <span className="font-serif">Current Active Schedule: {version?.versionNumber || 'v2026.1'}</span>
              <span className="bg-[#DDE5E0] text-[#3C5A48] text-[10px] px-2 py-0.5 rounded-full font-bold">
                Cooperative Board Ratified
              </span>
            </div>
            <p className="text-[#636D79] text-[11px] mt-0.5">
              Rate floors ensure minimum fair wages for workers. Rate ceilings protect customers from gouging. 10% cooperative fund contribution supports member healthcare and welfare.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-semibold text-[#636D79] whitespace-nowrap">
          Effective: {new Date(version?.effectiveFrom || Date.now()).toLocaleDateString('en-IN')}
        </span>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-[#FFFFFF] rounded-xl p-4 border border-[#D9D5CC] shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#636D79] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or title..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#D9D5CC] focus:outline-hidden focus:border-[#24324A] bg-[#F7F4EE] text-[#20242A]"
          />
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full pb-1 md:pb-0 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-[#24324A] text-white'
                : 'bg-[#F2EFEB] text-[#20242A] hover:bg-[#EAE5DA]'
            }`}
          >
            All Categories ({items.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat._id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat._id
                  ? 'bg-[#24324A] text-white'
                  : 'bg-[#F2EFEB] text-[#20242A] hover:bg-[#EAE5DA]'
              }`}
            >
              {cat.name?.en || cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Rate Items Table */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#D9D5CC] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#20242A]">
            <thead className="bg-[#F7F4EE] border-b border-[#D9D5CC] text-[#636D79] uppercase font-serif font-bold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Service Code</th>
                <th className="py-3 px-4">Service Name (EN / HI)</th>
                <th className="py-3 px-4">Billing Model</th>
                <th className="py-3 px-4 text-right">Floor (Min)</th>
                <th className="py-3 px-4 text-right">Standard Rate</th>
                <th className="py-3 px-4 text-right">Ceiling (Max)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DDD3]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#636D79]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#3C5A48] mb-2" />
                    Loading rate card items...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#636D79]">
                    No rate card items found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-[#F7F4EE]/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#3C5A48]">
                      {item.serviceCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#20242A]">{item.title?.en}</div>
                      <div className="text-[11px] text-[#636D79]">{item.title?.hi}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize px-2 py-0.5 rounded-md bg-[#F2EFEB] border border-[#D9D5CC] text-[10px] font-semibold text-[#20242A]">
                        {item.billingType?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-[#636D79]">
                      ₹{item.cooperativeMinRate}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#20242A] text-sm">
                      ₹{item.standardRate}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-[#636D79]">
                      ₹{item.cooperativeMaxRate}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.isActive
                            ? 'bg-[#DDE5E0] text-[#3C5A48]'
                            : 'bg-[#F9E2DF] text-[#A65343]'
                        }`}
                      >
                        {item.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg border border-[#D9D5CC] hover:bg-[#F2EFEB] text-[#20242A] hover:text-[#3C5A48] transition-colors"
                        title="Edit Rate & Limits"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-xl max-w-md w-full p-6 shadow-xl border border-[#D9D5CC] space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#3C5A48] uppercase tracking-wider">
                  Update Rate Schedule • दर अनुसूची संशोधन
                </span>
                <h3 className="font-serif font-bold text-base text-[#20242A]">
                  {editingItem.serviceCode} - {editingItem.title?.en}
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-md hover:bg-[#F7F4EE] text-[#636D79]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#20242A] mb-1">Title (English)</label>
                <input
                  type="text"
                  required
                  value={editFormData.titleEn}
                  onChange={(e) => setEditFormData({ ...editFormData, titleEn: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D9D5CC] focus:border-[#24324A] bg-[#F7F4EE] text-xs text-[#20242A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#20242A] mb-1">Title (Hindi)</label>
                <input
                  type="text"
                  required
                  value={editFormData.titleHi}
                  onChange={(e) => setEditFormData({ ...editFormData, titleHi: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D9D5CC] focus:border-[#24324A] bg-[#F7F4EE] text-xs text-[#20242A]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-[#20242A] mb-1">Floor (Min ₹)</label>
                  <input
                    type="number"
                    required
                    value={editFormData.cooperativeMinRate}
                    onChange={(e) => setEditFormData({ ...editFormData, cooperativeMinRate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D9D5CC] focus:border-[#24324A] bg-[#F7F4EE] text-xs font-mono text-[#20242A]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#20242A] mb-1">Standard (₹)</label>
                  <input
                    type="number"
                    required
                    value={editFormData.standardRate}
                    onChange={(e) => setEditFormData({ ...editFormData, standardRate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#3C5A48] font-bold text-[#3C5A48] bg-[#DDE5E0]/40 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#20242A] mb-1">Ceiling (Max ₹)</label>
                  <input
                    type="number"
                    required
                    value={editFormData.cooperativeMaxRate}
                    onChange={(e) => setEditFormData({ ...editFormData, cooperativeMaxRate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D9D5CC] focus:border-[#24324A] bg-[#F7F4EE] text-xs font-mono text-[#20242A]"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={editFormData.isActive}
                  onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  className="rounded-sm border-[#D9D5CC] text-[#3C5A48] focus:ring-[#3C5A48]"
                />
                <label htmlFor="isActiveToggle" className="font-semibold text-[#20242A]">
                  Active in customer service booking catalog
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-[#E2DDD3]">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-lg border border-[#D9D5CC] font-semibold text-[#20242A] hover:bg-[#F7F4EE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-[#3C5A48] hover:bg-[#2A4032] text-white font-semibold transition-colors shadow-xs"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-xl max-w-lg w-full p-6 shadow-xl border border-[#D9D5CC] space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#3C5A48] uppercase tracking-wider">
                  New Cooperative Rate Card Item
                </span>
                <h3 className="font-serif font-bold text-base text-[#20242A]">Add Approved Service Item</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-md hover:bg-[#F7F4EE] text-[#636D79]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddItemSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#20242A] mb-1">Category</label>
                  <select
                    value={newItemData.category}
                    onChange={(e) => setNewItemData({ ...newItemData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D9D5CC] focus:border-[#24324A] bg-[#F7F4EE] text-xs text-[#20242A]"
                  >
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name?.en || cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#20242A] mb-1">Service Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ELEC-005"
                    value={newItemData.serviceCode}
                    onChange={(e) => setNewItemData({ ...newItemData, serviceCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D9D5CC] focus:border-[#24324A] bg-[#F7F4EE] text-xs uppercase font-mono text-[#20242A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#20242A] mb-1">Title (English)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Switchboard Replacement & Wiring Check"
                  value={newItemData.titleEn}
                  onChange={(e) => setNewItemData({ ...newItemData, titleEn: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D9D5CC] focus:border-[#24324A] bg-[#F7F4EE] text-xs text-[#20242A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#20242A] mb-1">Title (Hindi)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. स्विचबोर्ड बदलना और वायरिंग जांच"
                  value={newItemData.titleHi}
                  onChange={(e) => setNewItemData({ ...newItemData, titleHi: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D9D5CC] focus:border-[#24324A] bg-[#F7F4EE] text-xs text-[#20242A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#20242A] mb-1">Billing Type</label>
                  <select
                    value={newItemData.billingType}
                    onChange={(e) => setNewItemData({ ...newItemData, billingType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D9D5CC] focus:border-[#24324A] bg-[#F7F4EE] text-xs text-[#20242A]"
                  >
                    <option value="fixed">Fixed Rate</option>
                    <option value="hourly">Hourly Billing</option>
                    <option value="per_unit">Per Unit</option>
                    <option value="inspection_only">Inspection Only</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#20242A] mb-1">Standard Rate (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 249"
                    value={newItemData.standardRate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewItemData({
                        ...newItemData,
                        standardRate: val,
                        cooperativeMinRate: Math.round(val * 0.9) || '',
                        cooperativeMaxRate: Math.round(val * 1.25) || '',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[#3C5A48] font-bold bg-[#DDE5E0]/40 text-[#3C5A48] text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#20242A] mb-1">Minimum Price Floor (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="Floor"
                    value={newItemData.cooperativeMinRate}
                    onChange={(e) => setNewItemData({ ...newItemData, cooperativeMinRate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D9D5CC] bg-[#F7F4EE] text-xs font-mono text-[#20242A]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#20242A] mb-1">Maximum Price Ceiling (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="Ceiling"
                    value={newItemData.cooperativeMaxRate}
                    onChange={(e) => setNewItemData({ ...newItemData, cooperativeMaxRate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D9D5CC] bg-[#F7F4EE] text-xs font-mono text-[#20242A]"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-[#E2DDD3]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#D9D5CC] font-semibold text-[#20242A] hover:bg-[#F7F4EE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-[#3C5A48] hover:bg-[#2A4032] text-white font-semibold transition-colors shadow-xs"
                >
                  {saving ? 'Adding...' : 'Add to Rate Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
