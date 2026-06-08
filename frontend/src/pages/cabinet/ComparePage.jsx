/**
 * Compare Page (Customer Cabinet) — DM Auto brand theme.
 * /cabinet/:customerId/compare
 *
 * Полностью русифицирован, использует беж + navy + amber палитру.
 */
import React, { useMemo, useState } from 'react';
import {
  Scales,
  Trash,
  Plus,
  Heart,
  Gauge,
  MapPin,
  Calendar,
  Car as CarIcon,
  GasPump,
  Wrench,
  Hammer,
  ShieldCheck,
  TrendUp,
  CurrencyDollar,
  Warning,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCompare } from '../../hooks/useCompare';

/* ─────────────────────────── Helpers ─────────────────────────── */

const isEmptyVal = (v) =>
  v == null
  || v === ''
  || (Array.isArray(v) && v.length === 0)
  || (typeof v === 'number' && Number.isNaN(v));

const fmtMoney = (v, currency = 'USD') => {
  if (isEmptyVal(v) || Number.isNaN(Number(v))) return null;
  try {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(Number(v));
  } catch {
    return `$${Number(v).toLocaleString('ru-RU')}`;
  }
};

const fmtMileage = (v, unit) => {
  if (isEmptyVal(v) || Number.isNaN(Number(v))) return null;
  const unitLabel = (unit && String(unit).toLowerCase() === 'km') ? 'км' : 'миль';
  return `${Number(v).toLocaleString('ru-RU')} ${unitLabel}`;
};

const fmtDate = (v) => {
  if (!v) return null;
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return String(v);
  }
};

const FALLBACK_IMG =
  'data:image/svg+xml;utf8,'
  + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 320">'
      + '<rect width="100%" height="100%" fill="#F3EEE7"/>'
      + '<path d="M120 200 L200 130 L260 175 L320 145 L380 200 Z" fill="#D8D0C6"/>'
      + '<circle cx="240" cy="120" r="22" fill="#D8D0C6"/>'
      + '<text x="50%" y="86%" font-family="system-ui" font-size="20" fill="#6E7C88" text-anchor="middle">Нет фото</text>'
      + '</svg>',
  );

const dealStatusStyles = {
  good_deal: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Выгодно' },
  fair_deal: { bg: 'bg-amber-100',   text: 'text-amber-800',   dot: 'bg-amber-500',   label: 'Справедливо' },
  bad_deal:  { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500',     label: 'Невыгодно' },
};

const ROW_DEFS = [
  { key: 'year', label: 'Год', icon: Calendar,
    render: (v) => (v ? <span className="font-semibold">{v}</span> : null) },
  { key: 'bodyType', label: 'Кузов', icon: CarIcon,
    render: (v) => (v ? <span className="capitalize">{String(v).toLowerCase()}</span> : null) },
  { key: 'mileage', label: 'Пробег', icon: Gauge, compare: 'lowerBetter',
    render: (v, item) => { const m = fmtMileage(v, item.mileageUnit); return m ? <span className="font-semibold">{m}</span> : null; } },
  { key: 'price', label: 'Цена', icon: CurrencyDollar, compare: 'lowerBetter',
    render: (v, item) => { const m = fmtMoney(v, item.currency); return m ? <span className="font-semibold text-[#162E51]">{m}</span> : null; } },
  { key: 'finalAllInPrice', label: 'Итоговая цена', icon: CurrencyDollar, compare: 'lowerBetter',
    render: (v, item) => fmtMoney(v, item.currency) },
  { key: 'damage', label: 'Повреждения', icon: Warning,
    render: (v) => v ? <span className="capitalize text-[#A13A3A]">{String(v).toLowerCase()}</span> : null },
  { key: 'saleDate', label: 'Дата выставления', icon: Hammer,
    render: (v) => { const d = fmtDate(v); return d ? <span>{d}</span> : null; } },
  { key: 'location', label: 'Локация', icon: MapPin,
    render: (v) => (v ? <span className="text-[#17202A]">{v}</span> : null) },
  { key: 'lotNumber', label: 'Лот №', icon: Hammer,
    render: (v) => (v ? <span className="font-mono text-xs">{v}</span> : null) },
  { key: 'drive', label: 'Привод', icon: CarIcon,
    render: (v) => (v ? <span className="uppercase">{String(v)}</span> : null) },
  { key: 'fuel', label: 'Топливо', icon: GasPump,
    render: (v) => (v ? <span className="capitalize">{String(v).toLowerCase()}</span> : null) },
  { key: 'transmission', label: 'Коробка', icon: Wrench,
    render: (v) => (v ? <span className="capitalize">{String(v).toLowerCase()}</span> : null) },
  { key: 'confidence', label: 'Точность данных', icon: ShieldCheck,
    render: (v) => (v != null ? <span className="font-semibold">{Math.round(Number(v) * 100)}%</span> : null) },
  { key: 'dealStatus', label: 'Оценка сделки', icon: TrendUp,
    render: (v) => {
      if (!v) return null;
      const s = dealStatusStyles[v] || dealStatusStyles.fair_deal;
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      );
    } },
];

/* ─────────────────────────── Page ─────────────────────────── */

export default function ComparePage() {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const { resolved, items, loading, remove, clear, count } = useCompare();
  const [mobileIdx, setMobileIdx] = useState(0);

  const data = useMemo(
    () => (resolved.length
      ? resolved
      : items.map((it) => ({
        vehicleId: it.vehicleId || it.vin,
        vin: it.vin,
        ...(it.snapshot || {}),
      }))),
    [resolved, items],
  );

  const visibleRows = useMemo(() => {
    if (data.length === 0) return [];
    return ROW_DEFS.filter((row) => data.some((item) => !isEmptyVal(item[row.key])));
  }, [data]);

  const leaderByKey = useMemo(() => {
    const map = {};
    if (data.length < 2) return map;
    visibleRows.forEach((row) => {
      if (row.compare !== 'lowerBetter') return;
      const vals = data
        .map((it) => ({ id: it.vin || it.vehicleId, n: Number(it[row.key]) }))
        .filter((x) => !Number.isNaN(x.n) && x.n > 0);
      if (vals.length < 2) return;
      vals.sort((a, b) => a.n - b.n);
      map[row.key] = vals[0].id;
    });
    return map;
  }, [data, visibleRows]);

  const safeMobileIdx = Math.min(mobileIdx, Math.max(0, data.length - 1));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="compare-loading">
        <div className="w-8 h-8 border-2 border-[#162E51] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!count) {
    return (
      <div className="space-y-4" data-testid="compare-page">
        <CompareHeader count={0} onClear={null} onAddCar={null} />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-dashed border-[#D8D0C6] bg-white p-10 md:p-14 text-center"
        >
          <span className="absolute left-0 top-8 bottom-8 w-[3px] rounded-r-full bg-gradient-to-b from-[#FEAE00] to-[#FFEA43]" />
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-5 bg-[rgba(22,46,81,0.08)] ring-1 ring-[rgba(22,46,81,0.16)]">
            <Scales size={32} weight="duotone" className="text-[#162E51]" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-[#18181B] mb-2">
            Пока нечего сравнивать
          </h3>
          <p className="text-[#71717A] mb-6 max-w-md mx-auto">
            Добавьте минимум два автомобиля из нашего каталога — здесь они покажутся бок-о-бок.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/#deals-budget-filter')}
              className="dm-cta-primary inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#18181B] text-white font-semibold"
              data-testid="compare-empty-open-catalog"
            >
              <CarIcon size={18} weight="fill" /> Подобрать автомобиль
            </button>
            <button
              onClick={() => navigate(customerId ? `/cabinet/${customerId}/favorites` : '/cabinet/favorites')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-[#D8D0C6] text-[#162E51] hover:bg-[rgba(22,46,81,0.06)] font-semibold transition-colors"
            >
              <Heart size={18} weight="fill" /> Открыть избранное
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const canAddMore = data.length < 3;
  const need2 = count === 1;

  return (
    <div className="space-y-4" data-testid="compare-page">
      <CompareHeader count={count} onClear={clear} onAddCar={canAddMore ? () => navigate('/#deals-budget-filter') : null} />

      {need2 && (
        <div className="rounded-2xl bg-[rgba(254,174,0,0.10)] border border-[rgba(254,174,0,0.32)] p-4 md:p-5 flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-[rgba(254,174,0,0.20)] flex items-center justify-center">
            <Warning size={18} weight="fill" className="text-[#B46A20]" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#17202A]">Добавьте ещё один автомобиль для сравнения</p>
            <p className="text-sm text-[#51606D] mt-0.5">
              Сравнение работает от 2 до 3 машин. Выберите ещё один авто из каталога.
            </p>
          </div>
          <button
            onClick={() => navigate('/#deals-budget-filter')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FEAE00] text-[#18181B] font-semibold text-sm hover:bg-[#FFBF2D] transition-colors"
            data-testid="compare-banner-browse"
          >
            <Plus size={16} /> Подобрать авто
          </button>
        </div>
      )}

      {/* DESKTOP / TABLET */}
      <div className={`hidden md:grid gap-4 ${data.length === 1 ? 'grid-cols-1 max-w-md' : 'grid-cols-2'} ${data.length === 3 ? '!grid-cols-3' : ''}`}>
        {data.map((item) => (
          <CarCompareCard
            key={item.vehicleId || item.vin}
            item={item}
            rows={visibleRows}
            leaderByKey={leaderByKey}
            onRemove={remove}
          />
        ))}
      </div>

      {/* MOBILE pager */}
      <div className="md:hidden space-y-4">
        {data.length > 1 && (
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setMobileIdx((i) => Math.max(0, i - 1))}
              disabled={safeMobileIdx === 0}
              className="w-10 h-10 rounded-full bg-white border border-[#D8D0C6] text-[#162E51] disabled:opacity-30 flex items-center justify-center"
              aria-label="Предыдущий авто"
            >
              <CaretLeft size={18} weight="bold" />
            </button>
            <div className="flex gap-1.5">
              {data.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setMobileIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === safeMobileIdx ? 'bg-[#FEAE00] w-8' : 'bg-[#D8D0C6] w-3'}`}
                  aria-label={`Перейти к авто ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => setMobileIdx((i) => Math.min(data.length - 1, i + 1))}
              disabled={safeMobileIdx >= data.length - 1}
              className="w-10 h-10 rounded-full bg-white border border-[#D8D0C6] text-[#162E51] disabled:opacity-30 flex items-center justify-center"
              aria-label="Следующий авто"
            >
              <CaretRight size={18} weight="bold" />
            </button>
          </div>
        )}

        {data[safeMobileIdx] && (
          <CarCompareCard
            item={data[safeMobileIdx]}
            rows={visibleRows}
            leaderByKey={leaderByKey}
            onRemove={remove}
            peers={data.filter((_, i) => i !== safeMobileIdx)}
            onPeerClick={(idx) => {
              const peerVehicleId = data.filter((_, i) => i !== safeMobileIdx)[idx]?.vehicleId
                || data.filter((_, i) => i !== safeMobileIdx)[idx]?.vin;
              const realIdx = data.findIndex((d) => (d.vehicleId || d.vin) === peerVehicleId);
              if (realIdx >= 0) setMobileIdx(realIdx);
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Header ─────────────────────────── */

function CompareHeader({ count, onClear, onAddCar }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-white border border-[#E4E4E7] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <span className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#FEAE00] via-[#FFEA43] to-transparent" />
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-[rgba(22,46,81,0.10)] ring-1 ring-[rgba(22,46,81,0.20)]">
          <Scales size={24} weight="fill" className="text-[#162E51]" />
        </div>
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] font-bold text-[#FEAE00] mb-0.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FEAE00]" />
            DM Auto • Сравнение
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#18181B] leading-tight">Сравнение авто</h1>
          <p className="text-[#71717A] text-sm mt-0.5">{count} / 3 авто</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {onAddCar && (
          <button
            onClick={onAddCar}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-[#162E51] hover:bg-[#FEAE00] hover:text-[#18181B] border border-[#D8D0C6] hover:border-[#FEAE00] transition-colors text-sm font-semibold"
            data-testid="compare-add-car-btn"
            title="Добавить ещё один автомобиль"
          >
            <Plus size={14} weight="bold" /> Добавить авто
          </button>
        )}
        {onClear && count > 0 && (
          <button
            onClick={onClear}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-[#D8D0C6] text-[#A13A3A] hover:bg-[rgba(161,58,58,0.08)] transition-colors text-sm font-semibold"
            data-testid="clear-compare-btn"
          >
            <Trash size={14} />
            Очистить
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────── Single Car Card ─────────────────── */

function CarCompareCard({ item, rows, leaderByKey, onRemove, peers, onPeerClick }) {
  const navigate = useNavigate();
  const title = item.title || [item.year, item.make, item.model].filter(Boolean).join(' ');
  const price = fmtMoney(item.price, item.currency);
  const mileage = fmtMileage(item.mileage, item.mileageUnit);

  const openDetail = () => {
    if (item.vin) navigate(`/vin/${encodeURIComponent(item.vin)}`);
  };

  const carKey = String(item.vin || item.vehicleId || '').toUpperCase();

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white shadow-sm hover:border-[rgba(22,46,81,0.30)] hover:shadow-[0_18px_36px_-16px_rgba(22,46,81,0.22)] transition-all"
      data-testid={`compare-card-${item.vin}`}
    >
      <button
        type="button"
        onClick={openDetail}
        className="block w-full aspect-[16/10] overflow-hidden bg-[#F3EEE7] relative"
        aria-label={title}
      >
        <img
          src={item.image || FALLBACK_IMG}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-transparent pointer-events-none" />
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove?.(item.vehicleId || item.vin); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onRemove?.(item.vehicleId || item.vin); } }}
          className="absolute top-3 right-3 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm text-[#162E51] hover:bg-[#A13A3A] hover:text-white transition-colors cursor-pointer shadow"
          aria-label="Удалить из сравнения"
          data-testid={`remove-compare-${item.vin}`}
        >
          <Trash size={16} />
        </span>
        {price && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FEAE00] text-[#18181B] font-bold text-sm shadow-lg">
            {price}
          </div>
        )}
        {mileage && (
          <div className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/85 backdrop-blur-sm text-[#162E51] text-xs font-semibold">
            <Gauge size={14} />
            {mileage}
          </div>
        )}
      </button>

      <div className="px-4 pt-4 pb-3 space-y-1.5 border-b border-[#E6DED4]">
        <button type="button" onClick={openDetail} className="text-left w-full">
          <h3 className="text-base font-bold text-[#18181B] leading-tight line-clamp-2 group-hover:text-[#162E51] transition-colors">
            {title || 'Неизвестный автомобиль'}
          </h3>
        </button>
        {item.vin && (
          <p className="text-[11px] font-mono text-[#A1A1AA] tracking-wide truncate" title={item.vin}>
            VIN: {item.vin}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {item.bodyType && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F3EEE7] text-[#51606D] text-[11px] capitalize">
              <CarIcon size={12} />
              {String(item.bodyType).toLowerCase()}
            </span>
          )}
          {item.fuel && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F3EEE7] text-[#51606D] text-[11px] capitalize">
              <GasPump size={12} />
              {String(item.fuel).toLowerCase()}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        {rows.map((row, ri) => {
          const val = item[row.key];
          const rendered = !isEmptyVal(val) ? row.render(val, item) : null;
          const isLeader = leaderByKey[row.key] === carKey;
          return (
            <div
              key={row.key}
              className={`px-4 py-3 flex items-center justify-between gap-3 border-b border-[#F3EEE7] last:border-b-0 ${ri % 2 ? 'bg-[#FBF7F0]' : ''} ${isLeader ? 'bg-emerald-50' : ''}`}
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-[#71717A] min-w-0">
                <row.icon size={13} weight="duotone" className="shrink-0 text-[#162E51]" />
                <span className="truncate">{row.label}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-[#17202A] text-right min-w-0">
                {isLeader && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold shrink-0" title="Лучшее значение">
                    ★
                  </span>
                )}
                <div className="truncate">
                  {rendered || <span className="text-[#A1A1AA]">—</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {peers && peers.length > 0 && (
        <div className="px-4 py-3 border-t border-[#E6DED4] bg-[#F3EEE7]">
          <p className="text-[10px] uppercase tracking-wider text-[#71717A] mb-2">
            Сравнить с
          </p>
          <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
            {peers.map((p, idx) => (
              <button
                key={p.vehicleId || p.vin}
                onClick={() => onPeerClick?.(idx)}
                className="shrink-0 flex items-center gap-2 px-2 py-1.5 rounded-xl bg-white hover:bg-[rgba(22,46,81,0.06)] border border-[#D8D0C6] hover:border-[#162E51] transition-colors min-w-[180px]"
              >
                <img
                  src={p.image || FALLBACK_IMG}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover bg-[#F3EEE7]"
                  onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                />
                <div className="text-left flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#17202A] truncate">
                    {p.title || [p.year, p.make, p.model].filter(Boolean).join(' ')}
                  </div>
                  <div className="text-[10px] text-[#71717A]">
                    {p.year || '—'} · {fmtMileage(p.mileage, p.mileageUnit) || '—'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
