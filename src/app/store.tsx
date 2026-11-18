import { createContext, useContext, useMemo, useState, useCallback, useEffect, type ReactNode } from 'react';
import { calcCapacity, calcOffers, pickBestOffer, type Bank, type Client } from '../lib/finance';
import { DEFAULT_AGENCY, DEFAULT_BANKS, DEFAULT_CLIENT, SAMPLE_RECORDS, type ClientRecord } from '../lib/sample';
import type { RentalProject, RentalUnit, RentPayment } from '../lib/rentals';

const KEY = 'masar.personal.v2';
type WorkspaceData = { version: 2; client: Client; banks: Bank[]; records: ClientRecord[];
  agency: typeof DEFAULT_AGENCY; projects: RentalProject[]; units: RentalUnit[]; payments: RentPayment[]; };
const freshData = (): WorkspaceData => ({ version: 2, client: { ...DEFAULT_CLIENT }, banks: DEFAULT_BANKS.map(b => ({ ...b })),
  records: [...SAMPLE_RECORDS], agency: { ...DEFAULT_AGENCY }, projects: [], units: [], payments: [] });
const validBackup = (input: unknown): input is WorkspaceData => {
  if (!input || typeof input !== 'object') return false;
  const a = input as Partial<WorkspaceData>;
  return a.version === 2 && !!a.client && typeof a.client.clientName === 'string' &&
    !!a.agency && typeof a.agency.agencyName === 'string' &&
    Array.isArray(a.banks) && Array.isArray(a.records) && Array.isArray(a.projects) &&
    Array.isArray(a.units) && Array.isArray(a.payments) &&
    a.banks.every(b => b && typeof b.id === 'string' && typeof b.name === 'string') &&
    a.records.every(r => r && typeof r.id === 'string' && typeof r.name === 'string') &&
    a.projects.every(p => p && typeof p.id === 'string' && typeof p.name === 'string') &&
    a.units.every(u => u && typeof u.id === 'string' && typeof u.projectId === 'string') &&
    a.payments.every(p => p && typeof p.id === 'string' && typeof p.unitId === 'string');
};
function initialData(): WorkspaceData {
  try { const raw = window.localStorage.getItem(KEY); if (raw) {
    const candidate: unknown = JSON.parse(raw);
    if (validBackup(candidate)) return candidate;
  } } catch { /* التخزين قد يكون معطلاً */ }
  return freshData();
}
const download = (filename: string, contents: string, type: string) => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(new Blob([contents], { type }));
  link.href = url; link.download = filename; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
export const makeId = () => typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function useWorkspaceState() {
  const [data, setData] = useState<WorkspaceData>(initialData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const { client, banks, records, agency, projects, units, payments } = data;

  useEffect(() => {
    try { window.localStorage.setItem(KEY, JSON.stringify(data)); }
    catch { setToast({ msg: 'تعذّر الحفظ في المتصفح؛ صدّر نسخة احتياطية فوراً', type: 'err' }); }
  }, [data]);
  const capacity = useMemo(() => calcCapacity(client), [client]);
  const offers = useMemo(() => calcOffers(client, banks, capacity), [client, banks, capacity]);
  const best = useMemo(() => pickBestOffer(offers), [offers]);
  const chosen = offers.find(o => o.bank.id === selectedBankId) ?? best;

  const notify = useCallback((msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type }); window.setTimeout(() => setToast(null), 3500);
  }, []);
  const updateClient = <K extends keyof Client>(key: K, value: Client[K]) =>
    setData(d => ({ ...d, client: { ...d.client, [key]: value } }));
  const resetClient = () => { setData(d => ({ ...d, client: { ...DEFAULT_CLIENT } })); setEditingId(null); setSelectedBankId(''); };
  const loadRecord = (r: ClientRecord) => {
    if (!r.clientSnapshot) return false;
    setData(d => ({ ...d, client: { ...DEFAULT_CLIENT, ...r.clientSnapshot } }));
    setEditingId(r.id); setSelectedBankId(r.selectedBankId || ''); return true;
  };
  const saveCurrentClient = () => {
    if (!client.clientName.trim()) { notify('أدخل اسم العميل أولاً', 'err'); return false; }
    if (capacity.totalIncome <= 0) { notify('أدخل دخلاً صالحاً قبل حفظ نتيجة الاستحقاق', 'err'); return false; }
    const now = new Date().toLocaleString('en-GB');
    const offer = chosen;
    const id = editingId ?? makeId();
    setData(d => {
      const old = d.records.find(r => r.id === id);
      const record: ClientRecord = {
        id, name: client.clientName.trim(), phone: client.clientPhone,
        sector: client.sector, income: capacity.totalIncome,
        bestBank: offer?.bank.name ?? 'لا يوجد عرض', bestAmount: offer?.maxLoanAmount ?? 0,
        selectedBankId: offer?.bank.id, stage: old?.stage ?? 'evaluated', updated: now,
        clientSnapshot: { ...client }, notes: old?.notes ?? '', reference: old?.reference ?? '',
        submittedAt: old?.submittedAt ?? '', followUpAt: old?.followUpAt ?? '',
      };
      return { ...d, records: old ? d.records.map(r => r.id === old.id ? record : r) : [record, ...d.records] };
    });
    setEditingId(id);
    notify(editingId ? 'حُدّث ملف العميل' : 'حُفظ ملف العميل مع بيانات الحساب');
    return true;
  };
  const setRecords = (updater: ClientRecord[] | ((current: ClientRecord[]) => ClientRecord[])) =>
    setData(d => ({ ...d, records: typeof updater === 'function' ? updater(d.records) : updater }));
  const setProjects = (updater: RentalProject[] | ((current: RentalProject[]) => RentalProject[])) =>
    setData(d => ({ ...d, projects: typeof updater === 'function' ? updater(d.projects) : updater }));
  const setUnits = (updater: RentalUnit[] | ((current: RentalUnit[]) => RentalUnit[])) =>
    setData(d => ({ ...d, units: typeof updater === 'function' ? updater(d.units) : updater }));
  const setPayments = (updater: RentPayment[] | ((current: RentPayment[]) => RentPayment[])) =>
    setData(d => ({ ...d, payments: typeof updater === 'function' ? updater(d.payments) : updater }));
  const setAgency = (updater: typeof DEFAULT_AGENCY | ((current: typeof DEFAULT_AGENCY) => typeof DEFAULT_AGENCY)) =>
    setData(d => ({ ...d, agency: typeof updater === 'function' ? updater(d.agency) : updater }));
  const updateBank = (id: string, patch: Partial<Bank>) => setData(d => ({ ...d,
    banks: d.banks.map(b => b.id === id ? { ...b, ...patch } : b) }));
  const exportBackup = () => {
    download(`masar-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json;charset=utf-8');
    notify('تم تنزيل النسخة الاحتياطية — احفظها في مكان آمن');
  };
  const importBackup = async (file: File) => {
    try {
      if (file.size > 10_000_000) throw new Error('الملف كبير جداً');
      const parsed: unknown = JSON.parse(await file.text());
      if (!validBackup(parsed)) throw new Error('الملف غير متوافق مع نسخة مسار الحالية');
      setData(parsed); setEditingId(null); setSelectedBankId(''); notify('تمت استعادة النسخة الاحتياطية');
    } catch (e) { notify(e instanceof Error ? e.message : 'تعذرت الاستعادة', 'err'); }
  };
  return { client, banks, records, agency, projects, units, payments,
    capacity, offers, best, chosen, toast, notify, editingId, selectedBankId, setSelectedBankId,
    updateClient, resetClient, loadRecord, saveCurrentClient, setRecords, setProjects, setUnits, setPayments,
    setAgency, updateBank, exportBackup, importBackup };
}
type Ws = ReturnType<typeof useWorkspaceState>;
const Ctx = createContext<Ws | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const value = useWorkspaceState(); return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useWs = () => { const v = useContext(Ctx); if (!v) throw new Error('useWs outside provider'); return v; };
