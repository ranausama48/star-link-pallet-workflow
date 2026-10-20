/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Upload, AlertCircle, CheckCircle2, X, FileText, ArrowRight } from 'lucide-react';
import { Company, Facility, PalletType, DocRefType } from '../types';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'INBOUND' | 'OUTBOUND';
  companies: Company[];
  facilities: Facility[];
  palletTypes: PalletType[];
  docRefTypes: DocRefType[];
  activeCompanyId: string;
  activeFacilityId: string;
  onUploadSuccess: (count: number) => void;
  user: any;
}

export function BulkUploadModal({
  isOpen,
  onClose,
  type,
  companies,
  facilities,
  palletTypes,
  docRefTypes,
  activeCompanyId,
  activeFacilityId,
  onUploadSuccess,
  user,
}: BulkUploadModalProps) {
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');

  if (!isOpen) return null;

  const defaultComp = companies.find((c) => c.id === activeCompanyId) || companies[0];
  const defaultFac = facilities.find((f) => f.id === activeFacilityId) || facilities[0];

  // Template download handler
  const handleDownloadTemplate = () => {
    const sampleSources =
      type === 'INBOUND'
        ? ['MKT_PURCHASE', 'RCV_SHIPMENT', 'VND_RETURN', 'IOT_IN']
        : ['OUT_ORDER', 'IOT_XFER', 'DMG_SIGNOFF', 'DMG_SOLD'];

    const header = 'Company,Facility,Source,DocRefType,DocRef,PalletType,Qty,Notes\n';
    const sampleRow1 = `${defaultComp?.code || 'STL_GLOBAL'},${defaultFac?.code || 'RUH-FC01'},${sampleSources[0]},SHIPMENT_NO,SHP-SAMPLE-01,WOODEN,50,Regular batch arrival\n`;
    const sampleRow2 = `${defaultComp?.code || 'STL_GLOBAL'},${defaultFac?.code || 'RUH-FC01'},${sampleSources[1]},ORDER_NO,ORD-SAMPLE-02,EURO,30,Standard logistics lot\n`;

    const blob = new Blob([header + sampleRow1 + sampleRow2], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Starlinks_Bulk_${type}_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // CSV Parser
  const parseCsv = (text: string) => {
    const lines = text.trim().split(/\r\n|\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setErrorMsg('CSV must contain a header row and at least one data row.');
      setParsedRows([]);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const rows: any[] = [];
    const errs: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Basic CSV split considering quotes
      const values = line.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
      if (values.length < 4) {
        errs.push(`Line ${i + 1}: Insufficient columns`);
        continue;
      }

      const rowObj: any = {};
      headers.forEach((h, colIdx) => {
        rowObj[h] = values[colIdx] || '';
      });

      // Quick normalization
      rowObj.Qty = parseInt(rowObj.Qty || rowObj.qty || '0', 10);
      if (isNaN(rowObj.Qty) || rowObj.Qty <= 0) {
        errs.push(`Line ${i + 1}: Invalid Quantity (${values[headers.indexOf('Qty')]})`);
      }

      rows.push(rowObj);
    }

    setValidationErrors(errs);
    setParsedRows(rows);
    if (rows.length > 0) setErrorMsg('');
  };

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      parseCsv(content);
    };
    reader.readAsText(file);
  };

  // Handle upload submit
  const handleSubmit = async () => {
    if (parsedRows.length === 0) {
      setErrorMsg('Please upload or enter at least one valid row');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/transactions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          rows: parsedRows,
          user,
          defaultCompanyId: activeCompanyId,
          defaultFacilityId: activeFacilityId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit bulk transactions');
      }

      onUploadSuccess(data.count || parsedRows.length);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred during bulk upload');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-800" />
              Bulk {type === 'INBOUND' ? 'Inbound' : 'Outbound'} Pallet Upload
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload formatted CSV or paste records for active facility:{' '}
              <span className="font-semibold text-slate-700">{defaultFac?.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Action strip with Download Template */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
            <div>
              <div className="text-xs font-semibold text-emerald-950">Need the official Starlinks template?</div>
              <div className="text-[11px] text-emerald-800">
                Download the pre-filled template with valid Company, Facility, Pallet & Source codes.
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 shadow-xs transition-colors shrink-0"
            >
              <Download className="w-4 h-4" />
              Download CSV Template
            </button>
          </div>

          {/* File Picker or Paste */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700">
              Select CSV File from your computer
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-slate-300 hover:border-emerald-700 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition-all text-xs text-slate-600">
                <FileText className="w-4 h-4 text-emerald-800" />
                <span className="font-medium text-emerald-900">
                  {fileName ? fileName : 'Choose CSV file or drag & drop here'}
                </span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Paste Raw CSV Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">
                Or paste CSV text directly:
              </label>
              {csvText && (
                <button
                  type="button"
                  onClick={() => parseCsv(csvText)}
                  className="text-xs text-emerald-800 font-semibold hover:underline"
                >
                  Re-parse Text
                </button>
              )}
            </div>
            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                if (e.target.value.includes('\n')) {
                  parseCsv(e.target.value);
                }
              }}
              placeholder="Company,Facility,Source,DocRefType,DocRef,PalletType,Qty,Notes&#10;STL_GLOBAL,RUH-FC01,MKT_PURCHASE,SHIPMENT_NO,SHP-001,WOODEN,20,Pallet lot"
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Validation Errors Notice */}
          {validationErrors.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Line validation issues ({validationErrors.length}):
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-700 max-h-24 overflow-y-auto">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  Ready to import {parsedRows.length} {parsedRows.length === 1 ? 'row' : 'rows'}:
                </span>
                <span className="text-slate-400 font-mono text-[11px]">Previewing first 5 rows</span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-48">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold text-[11px] border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Company</th>
                      <th className="py-2 px-3">Facility</th>
                      <th className="py-2 px-3">Source</th>
                      <th className="py-2 px-3">Doc Ref</th>
                      <th className="py-2 px-3">Pallet</th>
                      <th className="py-2 px-3 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {parsedRows.slice(0, 5).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 text-slate-400">{i + 1}</td>
                        <td className="py-1.5 px-3 text-slate-800">{r.Company || defaultComp?.code}</td>
                        <td className="py-1.5 px-3 text-slate-800">{r.Facility || defaultFac?.code}</td>
                        <td className="py-1.5 px-3 text-emerald-800 font-semibold">{r.Source}</td>
                        <td className="py-1.5 px-3 text-slate-700">{r.DocRef}</td>
                        <td className="py-1.5 px-3 text-slate-700">{r.PalletType}</td>
                        <td className="py-1.5 px-3 text-right font-bold text-slate-900">{r.Qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={parsedRows.length === 0 || isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-sm transition-all"
          >
            {isSubmitting ? (
              <>Processing...</>
            ) : (
              <>
                Process Bulk {type === 'INBOUND' ? 'Inbound' : 'Outbound'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
