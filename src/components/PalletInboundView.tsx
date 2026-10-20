/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowDownLeft,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Hash,
  Boxes,
  FileText,
  Plus,
  Minus,
} from 'lucide-react';
import { api } from '../api';
import { Company, Facility, PalletType, DocRefType, PalletTransaction, UserAccount } from '../types';
import { BulkUploadModal } from './BulkUploadModal';

interface PalletInboundViewProps {
  user: UserAccount;
  companies: Company[];
  facilities: Facility[];
  palletTypes: PalletType[];
  docRefTypes: DocRefType[];
  activeCompanyId: string;
  activeFacilityId: string;
  recentTransactions: PalletTransaction[];
  onTransactionCreated: () => void;
}

export function PalletInboundView({
  user,
  companies,
  facilities,
  palletTypes,
  docRefTypes,
  activeCompanyId,
  activeFacilityId,
  recentTransactions,
  onTransactionCreated,
}: PalletInboundViewProps) {
  // Inbound sources with clean domain labels & codes
  const inboundSources = [
    { code: 'MKT_PURCHASE', label: 'Market Purchase', description: 'Empty Pallet Market Purchase' },
    { code: 'RCV_SHIPMENT', label: 'Shipment Receipt', description: 'Pallet Received in Inbound Shipment' },
    { code: 'VND_RETURN', label: 'Vendor Return', description: 'Vendor Return Pallet Consignment' },
    { code: 'IOT_IN', label: 'IOT Inbound', description: 'Inter-Organization / Facility Transfer In' },
  ];

  // Common quick-pick quantities for the type-able combo
  const quickQuantities = [1, 5, 10, 20, 25, 50, 100, 200, 500];

  // Form states
  const [source, setSource] = useState('MKT_PURCHASE');
  const [docRefTypeId, setDocRefTypeId] = useState(docRefTypes[0]?.id || '');
  const [docRefNumber, setDocRefNumber] = useState('');
  const [palletTypeId, setPalletTypeId] = useState(palletTypes[0]?.id || '');
  const [qtyInput, setQtyInput] = useState('50');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const selectedPallet = palletTypes.find((p) => p.id === palletTypeId) || palletTypes[0];

  // Check if operations or edit allowed
  const canEdit =
    user.role === 'Admin' ||
    user.role === 'Operations' ||
    user.screenPermissions?.pallet_inbound === 'edit' ||
    user.screenPermissions?.pallet_inbound === 'all';

  // Validation
  const parsedQty = parseInt(qtyInput, 10);
  const isFormValid =
    Boolean(source) &&
    Boolean(docRefTypeId) &&
    Boolean(docRefNumber.trim()) &&
    Boolean(palletTypeId) &&
    !isNaN(parsedQty) &&
    parsedQty > 0 &&
    Boolean(activeCompanyId) &&
    Boolean(activeFacilityId);

  // Submit Receive Handler
  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !canEdit) return;

    setIsSubmitting(true);
    setSuccessAlert(null);
    setErrorAlert(null);

    const sourceObj = inboundSources.find((s) => s.code === source);

    try {
      const res = await api.createTransaction({
        type: 'INBOUND',
        source,
        sourceLabel: sourceObj?.label || source,
        companyId: activeCompanyId,
        facilityId: activeFacilityId,
        docRefTypeId,
        docRefNumber: docRefNumber.trim(),
        palletTypeId,
        qty: parsedQty,
        notes: notes.trim(),
        user,
      });

      setSuccessAlert(
        `Successfully received ${parsedQty} ${selectedPallet?.code || 'pallets'} under Doc Ref #${docRefNumber.trim()}`
      );
      // Reset doc ref and notes
      setDocRefNumber('');
      setNotes('');
      onTransactionCreated();
    } catch (err: any) {
      setErrorAlert(err.message || 'Failed to register inbound pallets');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Counter increment/decrement handlers
  const handleDecrement = () => {
    const current = parseInt(qtyInput, 10);
    const nextVal = isNaN(current) ? 1 : Math.max(1, current - 1);
    setQtyInput(String(nextVal));
  };

  const handleIncrement = () => {
    const current = parseInt(qtyInput, 10);
    const nextVal = isNaN(current) ? 1 : current + 1;
    setQtyInput(String(nextVal));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 uppercase">
            <ArrowDownLeft className="w-5 h-5 text-emerald-800 shrink-0" />
            <span>INBOUND PALLET RECEPTION</span>
          </h1>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/70 rounded-lg shadow-xs transition-colors"
          >
            <Upload className="w-4 h-4 text-emerald-800" />
            <span>Bulk Upload CSV</span>
          </button>
        </div>
      </div>

      {/* Main Focused Inbound Form */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Pallet Inbound Entry</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              All fields are mandatory. Transaction records timestamp and user audit.
            </p>
          </div>
          {!canEdit && (
            <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
              Inquiry View Only
            </span>
          )}
        </div>

        {/* Feedback Alerts */}
        {successAlert && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{successAlert}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessAlert(null)}
              className="text-emerald-700 font-bold ml-2"
            >
              ×
            </button>
          </div>
        )}

        {errorAlert && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-xs text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorAlert}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorAlert(null)}
              className="text-red-700 font-bold ml-2"
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleReceive} className="space-y-5">
          {/* Field 1: Source (LOV) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Inbound Source (Type) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {inboundSources.map((s) => {
                const isSelected = source === s.code;
                return (
                  <button
                    type="button"
                    key={s.code}
                    onClick={() => setSource(s.code)}
                    className={`py-2.5 px-3 rounded-lg border text-center transition-all ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-50/80 ring-1 ring-emerald-700 text-emerald-950 font-bold shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold'
                    }`}
                  >
                    <div className="text-xs truncate">{s.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Field 2: Doc Ref Type LOV & Doc Ref Input */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Doc Ref Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <select
                  value={docRefTypeId}
                  onChange={(e) => setDocRefTypeId(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white text-slate-900"
                >
                  {docRefTypes.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-7">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Doc Ref # (Shipment / Order / PO#) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={docRefNumber}
                  onChange={(e) => setDocRefNumber(e.target.value)}
                  placeholder="e.g. SHP-2026-8801 or PO-99214"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white text-slate-900 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Field 3: Pallet Type (Drop Down) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Pallet Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Boxes className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <select
                value={palletTypeId}
                onChange={(e) => setPalletTypeId(e.target.value)}
                required
                className="w-full pl-9 pr-8 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white text-slate-900 cursor-pointer"
              >
                {palletTypes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Field 4: Quantity (Writeable numeric with Up/Down Counter) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Quantity <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={parsedQty <= 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  title="Decrease quantity by 1"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="relative flex-1">
                  <Boxes className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={qtyInput}
                    onChange={(e) => setQtyInput(e.target.value)}
                    placeholder="Enter or write quantity..."
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                  title="Increase quantity by 1"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Select LOV Pill Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Quick Select:</span>
                {quickQuantities.map((q) => (
                  <button
                    type="button"
                    key={q}
                    onClick={() => setQtyInput(String(q))}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                      qtyInput === String(q)
                        ? 'bg-emerald-800 text-white font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Receipt Notes / Remarks (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Unloaded at Dock 4, driver signed POD"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white text-slate-900"
            />
          </div>

          {/* Receive Button (Enabled when valid) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting || !canEdit}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              {isSubmitting ? (
                <>Recording Pallet Inbound...</>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Receive Pallets ({parsedQty || 0} Units)
                </>
              )}
            </button>
            {!canEdit && (
              <p className="text-[11px] text-amber-700 text-center mt-1.5">
                Your current role ({user.role}) has Inquiry View Only rights on this screen.
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        type="INBOUND"
        companies={companies}
        facilities={facilities}
        palletTypes={palletTypes}
        docRefTypes={docRefTypes}
        activeCompanyId={activeCompanyId}
        activeFacilityId={activeFacilityId}
        user={user}
        onUploadSuccess={(count) => {
          setSuccessAlert(`Bulk upload processed: Successfully received ${count} pallet records.`);
          onTransactionCreated();
        }}
      />
    </div>
  );
}
