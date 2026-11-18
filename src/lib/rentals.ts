export interface RentalProject { id: string; name: string; location: string; notes?: string }
export interface RentalUnit {
  id: string; projectId: string; number: string; tenantName: string; tenantPhone: string;
  monthlyRent: number; dueDay: number; leaseStart: string; leaseEnd: string;
  notes?: string;
}
export interface RentPayment {
  id: string; unitId: string; period: string; amount: number; date: string;
  method: 'transfer' | 'cash' | 'other'; reference: string;
}
export type RentalStatus = 'paid' | 'partial' | 'overdue' | 'upcoming';
export const monthNow = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; };
export const dayNow = () => { const now = new Date(); return `${monthNow()}-${String(now.getDate()).padStart(2, '0')}`; };
export const isValidMonth = (month: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
export const isActiveInMonth = (unit: RentalUnit, month: string) => !!unit.leaseStart && isValidMonth(month) &&
  unit.leaseStart.slice(0, 7) <= month && (!unit.leaseEnd || unit.leaseEnd.slice(0, 7) >= month);
export const paymentTotal = (payments: RentPayment[], unitId: string, month: string) => payments
  .filter(p => p.unitId === unitId && p.period === month).reduce((sum, p) => sum + (Number.isFinite(p.amount) && p.amount > 0 ? p.amount : 0), 0);
export const rentRow = (unit: RentalUnit, payments: RentPayment[], month: string, today = dayNow()) => {
  const expected = isActiveInMonth(unit, month) ? Math.max(0, unit.monthlyRent) : 0;
  const paid = paymentTotal(payments, unit.id, month);
  const remaining = Math.max(0, expected - paid);
  const deadlineDay = Math.min(Math.max(1, Math.round(unit.dueDay || 1)), new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate());
  const deadline = `${month}-${String(deadlineDay).padStart(2, '0')}`;
  const status: RentalStatus = remaining <= 0 ? 'paid' : today > deadline ? 'overdue' : paid > 0 ? 'partial' : 'upcoming';
  return { expected, paid, remaining, deadline, status };
};
/** جميع الأقساط الإيجارية المتأخرة حتى تاريخ اليوم، مع المحافظة على شهر الدفعة المسجل. */
export function overdueRentRows(units: RentalUnit[], payments: RentPayment[], today = dayNow()) {
  const currentMonth = today.slice(0, 7);
  const result: { unit: RentalUnit; period: string; remaining: number; deadline: string }[] = [];
  for (const unit of units) {
    let month = unit.leaseStart?.slice(0, 7);
    if (!month || !isValidMonth(month) || month > currentMonth) continue;
    // مدد عقود الإيجار عادة محدودة؛ حد حماية يمنع تجميد الواجهة عند إدخال تاريخ شاذ.
    for (let months = 0; months < 600 && month <= currentMonth; months++) {
      if (isActiveInMonth(unit, month)) {
        const summary = rentRow(unit, payments, month, today);
        if (summary.status === 'overdue') result.push({ unit, period: month, remaining: summary.remaining, deadline: summary.deadline });
      }
      const [year, m] = month.split('-').map(Number);
      const next = new Date(year, m, 1);
      month = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    }
  }
  return result;
}
