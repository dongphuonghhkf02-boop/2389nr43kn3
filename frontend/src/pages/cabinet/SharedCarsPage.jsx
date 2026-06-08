/**
 * Shared Cars Page (Customer Cabinet) — DM Auto brand theme.
 * /cabinet/:customerId/shared
 *
 * Полностью русифицирован, использует беж + navy + amber палитру.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ShareNetwork,
  Trash,
  Eye,
  CarSimple,
  Hash,
  Copy,
  CheckCircle,
  ArrowsClockwise,
} from '@phosphor-icons/react';

import { userEngagementApi } from '../../lib/api';
import { getLocale } from '../../i18n';

const fmtPrice = (v, currency) => {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return null;
  const sym = (String(currency || 'EUR').toUpperCase() === 'USD') ? '$' : '€';
  return `${sym}${Math.round(n).toLocaleString('en-US')}`;
};

const fmtDate = (s) => {
  if (!s) return '';
  try {
    return new Date(s).toLocaleDateString(getLocale(), { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return ''; }
};

const channelMeta = {
  facebook: { label: 'Facebook', color: 'bg-[#1877F2]/10 text-[#1877F2] ring-[#1877F2]/30' },
  viber:    { label: 'Viber',    color: 'bg-[#7360F2]/10 text-[#7360F2] ring-[#7360F2]/30' },
  telegram: { label: 'Telegram', color: 'bg-[#2AABEE]/10 text-[#2AABEE] ring-[#2AABEE]/30' },
  copy:     { label: 'Ссылка',   color: 'bg-amber-100 text-amber-800 ring-amber-300' },
};

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-white border border-[#E4E4E7] overflow-hidden">
      <div className="aspect-[16/10] bg-[#F4F4F5]" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-[#F4F4F5] rounded w-3/4" />
        <div className="h-3 bg-[#F4F4F5] rounded w-1/2" />
        <div className="h-3 bg-[#F4F4F5] rounded w-2/3" />
      </div>
    </div>
  );
}

function ShareCard({ item, onRemove, onOpen, onCopy }) {
  const title =
    item.title ||
    [item.year, item.make, item.model, item.trim].filter(Boolean).join(' ') ||
    item.vin;
  const price = fmtPrice(item.price, item.currency);
  const created = fmtDate(item.createdAt);
  const meta = channelMeta[item.channel] || channelMeta.copy;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className="group rounded-2xl bg-white border border-[#E4E4E7] dm-card-hover overflow-hidden"
      data-testid={`share-card-${item.id}`}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] bg-[#F4F4F5] overflow-hidden cursor-pointer" onClick={onOpen}>
        {item.image ? (
          <img
            src={item.image}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#A1A1AA]">
            <CarSimple size={56} weight="duotone" />
          </div>
        )}
        <div className={`absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ring-1 ${meta.color}`}>
          <ShareNetwork size={13} weight="bold" />
          {meta.label}
        </div>
        {price ? (
          <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-md bg-[#FEAE00] text-[#18181B] text-[12px] font-bold shadow">
            {price}
          </div>
        ) : null}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="text-[#18181B] font-semibold leading-tight line-clamp-1 group-hover:text-[#162E51] transition-colors cursor-pointer" onClick={onOpen}>
          {title}
        </h3>
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[#71717A]">
          {item.vin ? (
            <span className="inline-flex items-center gap-1">
              <Hash size={12} className="text-[#FEAE00]" />
              <span className="font-mono">{item.vin}</span>
            </span>
          ) : null}
          {item.lot_number ? <span>ЛОТ {item.lot_number}</span> : null}
        </div>
        {created ? <p className="mt-2 text-[11px] text-[#A1A1AA]">Отправлено: {created}</p> : null}

        {item.shareUrl ? (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-[#E4E4E7] bg-[#FAFAFA] px-2.5 py-1.5">
            <span className="text-[11px] text-[#52525B] font-mono truncate flex-1">{item.shareUrl}</span>
            <button
              type="button"
              onClick={() => onCopy(item.shareUrl)}
              className="text-[#162E51] hover:text-[#FEAE00]"
              title="Скопировать ссылку"
              data-testid={`share-copy-${item.id}`}
            >
              <Copy size={14} />
            </button>
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-1.5 text-sm text-[#162E51] hover:text-[#FEAE00] font-semibold"
            data-testid={`share-view-${item.id}`}
          >
            <Eye size={16} />
            Открыть авто
          </button>
          <button
            type="button"
            onClick={() => onRemove(item)}
            className="inline-flex items-center gap-1.5 text-sm text-[#A1A1AA] hover:text-[#A13A3A] transition-colors"
            data-testid={`share-trash-${item.id}`}
            title="Удалить из списка отправленных"
          >
            <Trash size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function SharedCarsPage() {
  const navigate = useNavigate();
  const { customerId } = useParams();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userEngagementApi.shares.getMine();
      const arr = Array.isArray(data) ? data : [];
      setItems(arr);
    } catch (e) {
      console.error('[shared] fetch failed:', e);
      if (e?.status === 401 || e?.status === 403) {
        toast.error('Войдите в аккаунт, чтобы увидеть рассылку');
        navigate('/cabinet/login');
        return;
      }
      toast.error('Не удалось загрузить рассылку, попробуйте позже');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData, reloadKey]);

  const handleRemove = useCallback(async (item) => {
    try {
      await userEngagementApi.shares.remove(item.id);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      toast.success('Удалено из рассылки');
    } catch (e) {
      console.error('[shared] remove failed:', e);
      toast.error('Не удалось удалить запись');
    }
  }, []);

  const handleOpen = useCallback((item) => {
    if (item?.vin) navigate(`/cars/${encodeURIComponent(item.vin)}`);
  }, [navigate]);

  const handleCopy = useCallback(async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Ссылка скопирована');
    } catch {
      toast.error('Буфер обмена недоступен');
    }
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Brand-themed header card */}
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-white border border-[#E4E4E7] rounded-2xl p-5"
      >
        <span className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#FEAE00] via-[#FFEA43] to-transparent" />
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] font-bold text-[#FEAE00] mb-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FEAE00]" />
              DM Auto • Рассылка
            </div>
            <h1 className="text-[20px] md:text-[24px] font-bold text-[#18181B] flex items-center gap-2">
              <ShareNetwork size={24} weight="duotone" className="text-[#162E51]" />
              Мои отправленные авто
            </h1>
            <p className="mt-1 text-[13px] text-[#71717A]">
              Автомобили, которыми вы делились через Facebook, Viber, Telegram или прямую ссылку.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E4E4E7] bg-white text-[13px] text-[#162E51] hover:bg-[rgba(22,46,81,0.06)] font-semibold"
            data-testid="shared-refresh"
          >
            <ArrowsClockwise size={14} />
            Обновить
          </button>
        </div>
      </motion.header>

      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-[#D8D0C6] bg-white p-10 text-center">
          <span className="absolute left-0 top-6 bottom-6 w-[3px] rounded-r-full bg-gradient-to-b from-[#FEAE00] to-[#FFEA43]" />
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-[rgba(22,46,81,0.08)] ring-1 ring-[rgba(22,46,81,0.16)]">
            <ShareNetwork size={32} weight="duotone" className="text-[#162E51]" />
          </div>
          <h2 className="text-[16px] font-semibold text-[#18181B]">Вы ещё никому не отправляли авто</h2>
          <p className="mt-1 text-[13px] text-[#71717A] max-w-md mx-auto">
            Откройте карточку любого автомобиля и нажмите иконку <strong className="text-[#162E51]">«Поделиться»</strong> — ссылка появится здесь.
          </p>
          <Link
            to="/#deals-budget-filter"
            className="dm-cta-primary mt-5 inline-flex items-center gap-1.5 bg-[#18181B] text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
            data-testid="shared-empty-cta"
          >
            <CheckCircle size={14} weight="bold" />
            Подобрать автомобиль
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {items.map((it) => (
              <ShareCard
                key={it.id}
                item={it}
                onRemove={handleRemove}
                onOpen={() => handleOpen(it)}
                onCopy={handleCopy}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
