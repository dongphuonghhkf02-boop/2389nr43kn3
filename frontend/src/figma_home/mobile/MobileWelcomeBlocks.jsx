/**
 * MobileWelcomeBlocks — additional mobile sections for the Welcome page.
 *
 * These mirror the desktop Welcome blocks (BrandLogos1, VehicleDeals1,
 * FrameComponent22..28) in simplified mobile-friendly form. Each section
 * keeps the same cream/navy/amber palette and Mazzard typography as the
 * existing mobile blocks (MobileWeHavePerfectService, MobileWhyPayLess).
 *
 *   Cream:  #F5F0E8
 *   Navy:   #162E51
 *   Amber:  #FEAE00
 *   Ink:    #17202A
 *
 * Per user direction: every block from the desktop welcome MUST appear
 * on the mobile welcome — simplification is allowed when a block is too
 * complex for a 360px viewport (e.g. "Quick calculator" loses its photo,
 * carousels collapse to ≤ 3 visible items + swipe).
 */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLang } from '../../i18n';
import { useGetInTouch } from '../../components/public/GetInTouchModal';

const API = process.env.REACT_APP_BACKEND_URL || '';
const FONT = "'Mazzard', 'Mazzard H', system-ui, -apple-system, sans-serif";

const NAVY = '#162E51';
const CREAM = '#F5F0E8';
const AMBER = '#FEAE00';
const INK = '#17202A';
const TEXT_MUTED = '#51606D';

/* ─────────────────────────────────────────────────────────────────────── */
/*  Shared section header (kicker + title + subline) — matches desktop     */
/* ─────────────────────────────────────────────────────────────────────── */
function SectionHead({ kicker, title, subline, centered = true }) {
  return (
    <div style={{ textAlign: centered ? 'center' : 'left', marginBottom: 24 }}>
      {kicker ? (
        <div
          style={{
            fontFamily: FONT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: AMBER,
            marginBottom: 10,
          }}
        >
          {kicker}
        </div>
      ) : null}
      {title ? (
        <h2
          style={{
            margin: 0,
            fontFamily: FONT,
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
            color: NAVY,
            overflowWrap: 'anywhere',
            wordBreak: 'normal',
          }}
        >
          {title}
        </h2>
      ) : null}
      {subline ? (
        <p
          style={{
            margin: '10px 0 0',
            fontFamily: FONT,
            fontSize: 14,
            lineHeight: 1.55,
            color: TEXT_MUTED,
            overflowWrap: 'anywhere',
          }}
        >
          {subline}
        </p>
      ) : null}
    </div>
  );
}

/* ═════════════════════ 1. Popular Brands ═══════════════════════════════
   Mirrors BrandLogos1. 6 tile grid, grayscale logos, amber accent.
   Tap any logo → smooth-scroll to the curated "Top deals" anchor below.
   ═════════════════════════════════════════════════════════════════════ */
const POPULAR_BRANDS = [
  { slug: 'mercedes',   name: 'Mercedes-Benz' },
  { slug: 'jeep',       name: 'Jeep' },
  { slug: 'toyota',     name: 'Toyota' },
  { slug: 'bmw',        name: 'BMW' },
  { slug: 'hyundai',    name: 'Hyundai' },
  { slug: 'volkswagen', name: 'Volkswagen' },
];

export function MobilePopularBrands() {
  const { lang } = useLang();
  const isRu = (lang || 'en').toLowerCase().startsWith('ru');
  const title = isRu ? 'Популярные бренды' : 'Popular brands';
  const kicker = isRu ? '// БРЕНДЫ' : '// BRANDS';

  const onTap = () => {
    const target = document.getElementById('mobile-top-deals');
    if (target) {
      const top = target.getBoundingClientRect().top + window.pageYOffset - 72;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <section
      data-testid="mobile-popular-brands"
      style={{
        background: CREAM,
        padding: '48px 16px 32px',
        fontFamily: FONT,
      }}
    >
      <SectionHead kicker={kicker} title={title} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          maxWidth: 360,
          margin: '0 auto',
        }}
      >
        {POPULAR_BRANDS.map((b) => (
          <button
            key={b.slug}
            type="button"
            onClick={onTap}
            data-testid={`mobile-popular-brand-${b.slug}`}
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #E6DED4',
              borderRadius: 12,
              height: 84,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 10,
              cursor: 'pointer',
              transition: 'border-color 180ms ease, transform 180ms ease',
            }}
            aria-label={b.name}
          >
            <img
              src={`/figma/brands/${b.slug}.webp`}
              alt={b.name}
              style={{
                maxHeight: 44,
                maxWidth: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
              }}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement.innerHTML +=
                  `<span style="font-family:${FONT};font-size:11px;font-weight:700;color:${INK};text-transform:uppercase;letter-spacing:.05em">${b.name}</span>`;
              }}
            />
          </button>
        ))}
      </div>
    </section>
  );
}

/* ═════════════════════ 2. Top Vehicle Deals ═══════════════════════════
   Mirrors VehicleDeals1 + FrameComponent21. Loads up to 6 cars from
   /api/public/vehicles. Horizontal scroll-snap carousel — 1 card per
   screen with a small "next card" peek. Falls back gracefully when no
   data is available.
   ════════════════════════════════════════════════════════════════════ */

function dealsCardImage(v) {
  const arr = Array.isArray(v.images) ? v.images.filter(Boolean) : [];
  return arr[0] || '/mobile/image-15@2x.png';
}

function dealsCardPrice(v) {
  const cur = (v.current_bid_currency || 'EUR').toUpperCase();
  const sym = cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '';
  if (Number.isFinite(Number(v.current_bid))) {
    return `${sym}${Number(v.current_bid).toLocaleString('en-US')}`;
  }
  if (v.price) return String(v.price);
  return '—';
}

export function MobileTopDeals() {
  const { lang } = useLang();
  const isRu = (lang || 'en').toLowerCase().startsWith('ru');
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await axios.get(`${API}/api/public/vehicles`, {
          params: { limit: 6, skip: 0 },
          timeout: 18000,
        });
        if (cancelled) return;
        const arr = Array.isArray(r.data?.data) ? r.data.data : [];
        setCars(arr);
      } catch {
        if (!cancelled) setCars([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const title = isRu ? 'Лучшие предложения\nнедели' : 'Top vehicle deals\nof the week';
  const kicker = isRu ? '// ПОДБОРКА НЕДЕЛИ' : '// WEEKLY PICK';
  const subline = isRu
    ? 'Тысячи объявлений. Только лучшие проходят отбор.'
    : 'Thousands of listings. Only the best make the cut.';

  return (
    <section
      id="mobile-top-deals"
      data-testid="mobile-top-deals"
      style={{ background: CREAM, padding: '40px 0 28px', fontFamily: FONT }}
    >
      <div style={{ padding: '0 16px' }}>
        <SectionHead kicker={kicker} title={title} subline={subline} />
      </div>

      {loading ? (
        <div
          style={{
            margin: '8px 16px 0',
            background: '#FFFFFF',
            border: '1.5px solid #E6DED4',
            borderRadius: 14,
            height: 260,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: TEXT_MUTED,
            fontFamily: FONT,
            fontSize: 13,
          }}
        >
          {isRu ? 'Загружаем подборку…' : 'Loading curated picks…'}
        </div>
      ) : cars.length === 0 ? (
        <div
          style={{
            margin: '8px 16px 0',
            background: '#FFFFFF',
            border: '1.5px solid #E6DED4',
            borderRadius: 14,
            padding: '24px 18px',
            textAlign: 'center',
            color: TEXT_MUTED,
            fontFamily: FONT,
            fontSize: 13,
          }}
        >
          {isRu
            ? 'Свежая подборка готовится. Загляните чуть позже.'
            : 'A fresh curation is being prepared. Check back soon.'}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            padding: '0 16px 16px',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {cars.map((v, i) => {
            const slug = v.slug || v.vin || v.lot_number;
            const name = v.title || `${v.year || ''} ${v.make || ''} ${v.model || ''}`.trim();
            const km = Number.isFinite(v.odometer)
              ? `${Number(v.odometer).toLocaleString()} ${(v.odometer_unit || 'km').toUpperCase()}`
              : null;
            return (
              <a
                key={slug || i}
                href={slug ? `/cars/${slug}` : '#'}
                data-testid={`mobile-top-deal-${i}`}
                style={{
                  flex: '0 0 86%',
                  maxWidth: '86%',
                  scrollSnapAlign: 'center',
                  display: 'block',
                  background: '#FFFFFF',
                  border: '1.5px solid #E6DED4',
                  borderRadius: 16,
                  overflow: 'hidden',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'border-color 200ms ease, transform 200ms ease',
                }}
              >
                <div style={{ width: '100%', aspectRatio: '4 / 3', overflow: 'hidden', background: '#EEE5DA' }}>
                  <img
                    src={dealsCardImage(v)}
                    alt={name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={(e) => { e.currentTarget.src = '/mobile/image-15@2x.png'; }}
                  />
                </div>
                <div style={{ padding: '14px 16px 16px' }}>
                  <div
                    style={{
                      fontFamily: FONT,
                      fontWeight: 700,
                      fontSize: 15,
                      color: NAVY,
                      lineHeight: 1.25,
                      letterSpacing: '-0.005em',
                      overflowWrap: 'anywhere',
                      minHeight: 38,
                    }}
                  >
                    {name}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 18, color: AMBER }}>
                      {dealsCardPrice(v)}
                    </span>
                    {km ? (
                      <span style={{ fontFamily: FONT, fontSize: 12, color: TEXT_MUTED }}>{km}</span>
                    ) : null}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ═════════════════════ 3. Quick Calculator card ═══════════════════════
   Mirrors FrameComponent22 ("ИТОГ В ЕВРО / All-in EUR"). Mobile version:
   eyebrow + headline + 2-3 inputs + a CTA that opens the GetInTouch
   modal pre-filled with what the user typed. No photo (per user — "за
   минуту можно без фотографии, упростить").
   ════════════════════════════════════════════════════════════════════ */

export function MobileQuickCalc() {
  const { lang } = useLang();
  const isRu = (lang || 'en').toLowerCase().startsWith('ru');
  const { open: openGetInTouch } = useGetInTouch();
  const [model, setModel] = useState('');
  const [budget, setBudget] = useState('');

  const t = isRu
    ? {
        eyebrow: '// ИТОГ В ЕВРО',
        title: 'Точная цена\nза минуту.',
        subline:
          'Расскажите модель — менеджер подберёт варианты и посчитает доставку, таможню и регистрацию под ключ.',
        modelLabel: 'Модель или ссылка',
        modelPh: 'BMW X5 / ссылка на лот…',
        budgetLabel: 'Бюджет (EUR)',
        budgetPh: '25 000',
        cta: 'Рассчитать под ключ',
      }
    : {
        eyebrow: '// ALL-IN EUR',
        title: 'Exact price\nin one minute.',
        subline:
          'Tell us the model — our manager will pick options and quote turnkey transport, customs and registration.',
        modelLabel: 'Model or listing link',
        modelPh: 'BMW X5 / paste a lot URL…',
        budgetLabel: 'Budget (EUR)',
        budgetPh: '25,000',
        cta: 'Get a turnkey quote',
      };

  const onSubmit = (e) => {
    e?.preventDefault?.();
    const carPref = [model, budget ? `≈ €${budget}` : ''].filter(Boolean).join(' · ');
    openGetInTouch?.({
      source: 'mobile_welcome_quick_calc',
      car_preference: carPref,
      title: isRu ? 'Расчёт под ключ' : 'Turnkey quote',
      subtitle: t.subline,
    });
  };

  return (
    <section
      data-testid="mobile-quick-calc"
      style={{ background: CREAM, padding: '40px 16px 32px', fontFamily: FONT }}
    >
      <SectionHead kicker={t.eyebrow} title={t.title} subline={t.subline} />
      <form
        onSubmit={onSubmit}
        style={{
          marginTop: 18,
          background: '#FFFFFF',
          border: '1.5px solid #E6DED4',
          borderRadius: 16,
          padding: 18,
          boxShadow: '0 14px 32px rgba(22, 46, 81, 0.06)',
        }}
      >
        <label style={{ display: 'block', marginBottom: 14 }}>
          <span
            style={{
              display: 'block',
              fontFamily: FONT,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: NAVY,
              marginBottom: 6,
            }}
          >
            {t.modelLabel}
          </span>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={t.modelPh}
            data-testid="mobile-quick-calc-model"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1.5px solid #E6DED4',
              background: '#FAF6EE',
              fontFamily: FONT,
              fontSize: 14,
              color: INK,
              outline: 'none',
            }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: 16 }}>
          <span
            style={{
              display: 'block',
              fontFamily: FONT,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: NAVY,
              marginBottom: 6,
            }}
          >
            {t.budgetLabel}
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={budget}
            onChange={(e) => setBudget(e.target.value.replace(/[^0-9 ]/g, ''))}
            placeholder={t.budgetPh}
            data-testid="mobile-quick-calc-budget"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1.5px solid #E6DED4',
              background: '#FAF6EE',
              fontFamily: FONT,
              fontSize: 14,
              color: INK,
              outline: 'none',
            }}
          />
        </label>
        <button
          type="submit"
          data-testid="mobile-quick-calc-cta"
          style={{
            display: 'inline-flex',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            background: AMBER,
            color: NAVY,
            border: 'none',
            borderRadius: 999,
            padding: '14px 16px',
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: '0 12px 26px rgba(254, 174, 0, 0.32)',
            overflowWrap: 'anywhere',
            whiteSpace: 'normal',
            lineHeight: 1.25,
          }}
        >
          {t.cta}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </section>
  );
}

/* ═════════════════════ 4. Three Ways to Work ══════════════════════════
   Mirrors FrameComponent23. 3 service-tier cards stacked vertically with
   amber numerals. Card 2 is highlighted as "most chosen".
   ════════════════════════════════════════════════════════════════════ */

export function MobileThreeWays() {
  const { lang } = useLang();
  const isRu = (lang || 'en').toLowerCase().startsWith('ru');
  const { open: openGetInTouch } = useGetInTouch();

  const t = isRu
    ? {
        kicker: '// ФОРМАТЫ',
        title: 'Три формата сотрудничества',
        subline: 'От простой доставки до полного «под ключ» — выберите глубину сервиса под ваш ритм.',
        cards: [
          {
            n: '01',
            tag: 'Партнёр',
            title: 'Вы выбрали — мы привезли.',
            desc: 'Машину вы уже нашли — мы берём на себя транспорт, таможню, оформление и доставку.',
            features: ['Транспорт по ЕС', 'Таможенное оформление', 'Доставка к двери'],
            cta: 'Просто пришлите ссылку',
          },
          {
            n: '02',
            tag: 'Эксперт',
            popular: 'выбирают чаще',
            title: 'Назовите бюджет — получите машину.',
            desc: 'Подбираем по Европе: аукционы и проверенные дилеры. Pre-purchase осмотр каждого кандидата.',
            features: ['Подбор по бюджету', 'Осмотр на месте', 'Договоры + доставка'],
            cta: 'Подобрать варианты',
          },
          {
            n: '03',
            tag: 'Под ключ',
            title: 'Ключи в руки. Номера на месте.',
            desc: 'Всё из «Эксперт» плюс таможня, регистрация, техосмотр и 30-дневная поддержка после получения.',
            features: ['Всё из «Эксперт»', 'Регистрация + номера', 'Поддержка 30 дней'],
            cta: 'Под ключ',
          },
        ],
      }
    : {
        kicker: '// FORMATS',
        title: 'Three ways we work',
        subline: 'From pure logistics to full turnkey — pick the level of service that fits.',
        cards: [
          {
            n: '01',
            tag: 'Partner',
            title: 'You pick. We bring.',
            desc: "You already found the car — we take it from there: transport, customs, paperwork, doorstep delivery.",
            features: ['EU road transport', 'Customs & VAT paperwork', 'Door-to-door drop-off'],
            cta: 'Send us the link',
          },
          {
            n: '02',
            tag: 'Expert match',
            popular: 'most chosen',
            title: 'Tell budget. Get the car.',
            desc: 'We hunt across European auctions and trusted dealers — pre-purchase inspection on every short-list.',
            features: ['Budget-based hand-pick', 'Pre-purchase inspection', 'Negotiation + delivery'],
            cta: 'Find me a car',
          },
          {
            n: '03',
            tag: 'Turnkey',
            title: 'Keys in hand. Plate on.',
            desc: 'Hands-off, end-to-end. Everything in Expert plus customs, registration and 30-day post-delivery support.',
            features: ['Everything in Expert', 'Registration + plates', '30-day after-care'],
            cta: 'Turnkey',
          },
        ],
      };

  const openLead = (tag) => () => openGetInTouch?.({
    source: `mobile_welcome_three_ways_${tag.toLowerCase()}`,
    car_preference: tag,
    title: isRu ? `Формат: ${tag}` : `Format: ${tag}`,
    subtitle: t.subline,
  });

  return (
    <section
      data-testid="mobile-three-ways"
      style={{ background: CREAM, padding: '40px 16px 32px', fontFamily: FONT }}
    >
      <SectionHead kicker={t.kicker} title={t.title} subline={t.subline} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
        {t.cards.map((c, i) => {
          const isPopular = !!c.popular;
          return (
            <article
              key={c.n}
              data-testid={`mobile-three-ways-card-${i}`}
              style={{
                position: 'relative',
                background: isPopular ? NAVY : '#FFFFFF',
                color: isPopular ? CREAM : INK,
                borderRadius: 18,
                border: isPopular ? `2px solid ${AMBER}` : '1.5px solid #E6DED4',
                padding: '22px 20px 22px',
                boxShadow: isPopular
                  ? '0 18px 36px rgba(22, 46, 81, 0.20)'
                  : '0 10px 24px rgba(22, 46, 81, 0.06)',
              }}
            >
              {isPopular ? (
                <span
                  style={{
                    position: 'absolute',
                    top: -10,
                    right: 18,
                    background: AMBER,
                    color: NAVY,
                    fontFamily: FONT,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    padding: '4px 10px',
                    borderRadius: 999,
                  }}
                >
                  {c.popular}
                </span>
              ) : null}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: FONT,
                    fontSize: 28,
                    fontWeight: 800,
                    color: AMBER,
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {c.n}
                </span>
                <span
                  style={{
                    fontFamily: FONT,
                    fontSize: 11,
                    fontWeight: 700,
                    color: isPopular ? AMBER : NAVY,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                  }}
                >
                  {c.tag}
                </span>
              </div>
              <h3
                style={{
                  margin: 0,
                  fontFamily: FONT,
                  fontSize: 18,
                  fontWeight: 700,
                  lineHeight: 1.25,
                  color: isPopular ? CREAM : NAVY,
                  letterSpacing: '-0.005em',
                  overflowWrap: 'anywhere',
                }}
              >
                {c.title}
              </h3>
              <p
                style={{
                  margin: '8px 0 14px',
                  fontFamily: FONT,
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  color: isPopular ? 'rgba(245, 240, 232, 0.78)' : TEXT_MUTED,
                }}
              >
                {c.desc}
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, marginBottom: 16 }}>
                {c.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      fontFamily: FONT,
                      fontSize: 13,
                      lineHeight: 1.45,
                      color: isPopular ? CREAM : INK,
                      marginBottom: 6,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flex: '0 0 14px', marginTop: 3 }} aria-hidden="true">
                      <path d="M3 8.5l3.2 3.2L13 4.5" stroke={AMBER} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={openLead(c.tag)}
                data-testid={`mobile-three-ways-cta-${i}`}
                style={{
                  display: 'inline-flex',
                  width: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                  background: isPopular ? AMBER : 'transparent',
                  color: isPopular ? NAVY : NAVY,
                  border: isPopular ? 'none' : `1.5px solid ${NAVY}`,
                  borderRadius: 999,
                  padding: '12px 14px',
                  fontFamily: FONT,
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  overflowWrap: 'anywhere',
                  whiteSpace: 'normal',
                  lineHeight: 1.2,
                }}
              >
                {c.cta} →
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ═════════════════════ 5. Turnkey Delivery (How we deliver) ═══════════
   Mirrors TurnkeyBanner1 — "ДОСТАВКА ПОД КЛЮЧ / Как мы доставляем
   автомобиль под ключ". Five supply-pipeline steps (request → assess
   → inspect → buy → deliver). Different from FrameComponent24 (which
   is the customer-flow MobileWeHavePerfectService — choose / deposit /
   support / settle).
   ════════════════════════════════════════════════════════════════════ */

export function MobileTurnkeyProcess() {
  const { lang } = useLang();
  const isRu = (lang || 'en').toLowerCase().startsWith('ru');

  const t = isRu
    ? {
        kicker: '// ДОСТАВКА ПОД КЛЮЧ',
        title: 'Как мы доставляем\nавтомобиль под ключ',
        subline:
          'Пять понятных шагов и один договор — от подбора в Европе до передачи ключей у вашей двери.',
        routeLabel: 'Маршрут',
        routeFrom: 'Европа',
        routeTo: 'Россия и Беларусь',
        routeSub: 'Прямая доставка к двери',
        steps: [
          { title: 'Заявка и бриф', desc: 'Вы оставляете запрос: бюджет, модель, ключевые пожелания. Мы согласуем задачу и предлагаем шорт-лист.' },
          { title: 'Оценка качества', desc: 'Проверяем пробег, историю ДТП, владельцев и состояние авто. Никаких покупок вслепую.' },
          { title: 'Осмотр на месте', desc: 'Наш специалист едет к авто: подробные фото и видео-обход. Сделка дальше — только если машина того стоит.' },
          { title: 'Покупка и выкуп', desc: 'Закрываем сделку, оплачиваем, оформляем документы и забираем авто со стоянки.' },
          { title: 'Доставка до двери', desc: 'Автовоз по Европе, полное таможенное оформление и доставка прямо к двери в любой крупный город РФ/РБ.' },
        ],
      }
    : {
        kicker: '// TURNKEY DELIVERY',
        title: 'How we deliver\nyour car turnkey',
        subline:
          'Five clear steps, one contract — from sourcing in Europe to handing you the keys at your door.',
        routeLabel: 'Route',
        routeFrom: 'Europe',
        routeTo: 'Russia & Belarus',
        routeSub: 'Direct delivery to your door',
        steps: [
          { title: 'Request & brief', desc: 'You drop a request — budget, model, key wishes. We agree the task and offer a short-list.' },
          { title: 'Quality assessment', desc: 'We verify mileage, accident history, owners and condition. No blind purchases — facts only.' },
          { title: 'Inspection on site', desc: 'Our agent drives to the car: detailed photos, walk-around video. We move on only if it is worth your money.' },
          { title: 'Purchase & pickup', desc: 'We close the deal with the seller, pay, collect the documents and pick the car up from the yard.' },
          { title: 'Door-to-door delivery', desc: 'Road transport across Europe, full customs and delivery to any major city in Russia or Belarus.' },
        ],
      };

  return (
    <section
      data-testid="mobile-turnkey-process"
      style={{
        background: NAVY,
        color: CREAM,
        padding: '48px 16px 40px',
        fontFamily: FONT,
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: AMBER,
            marginBottom: 10,
          }}
        >
          {t.kicker}
        </div>
        <h2
          style={{
            margin: 0,
            fontFamily: FONT,
            fontSize: 26,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
            color: CREAM,
            whiteSpace: 'pre-line',
          }}
        >
          {t.title}
        </h2>
        <p
          style={{
            margin: '10px 0 0',
            fontFamily: FONT,
            fontSize: 13.5,
            lineHeight: 1.55,
            color: 'rgba(245, 240, 232, 0.74)',
          }}
        >
          {t.subline}
        </p>
      </div>

      {/* Route ribbon */}
      <div
        style={{
          margin: '18px 0 22px',
          padding: '14px 16px',
          background: 'rgba(245, 240, 232, 0.05)',
          border: '1px solid rgba(254, 174, 0, 0.30)',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: AMBER,
              marginBottom: 4,
            }}
          >
            {t.routeLabel}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: CREAM, lineHeight: 1.2 }}>
            {t.routeFrom} → {t.routeTo}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 11, color: 'rgba(245, 240, 232, 0.68)', marginTop: 2 }}>
            {t.routeSub}
          </div>
        </div>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 13l1.5-4a3 3 0 0 1 2.8-2h5.4A3 3 0 0 1 17.5 9L19 13M3 13h18v5a1 1 0 0 1-1 1h-1.5a1.5 1.5 0 0 1-1.5-1.5V17h-8v.5A1.5 1.5 0 0 1 7.5 19H6a1 1 0 0 1-1-1z" stroke={AMBER} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {t.steps.map((s, i) => (
          <li
            key={i}
            data-testid={`mobile-turnkey-step-${i}`}
            style={{
              background: 'rgba(245, 240, 232, 0.05)',
              border: '1px solid rgba(245, 240, 232, 0.10)',
              borderRadius: 14,
              padding: '16px 16px 16px 60px',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 14,
                top: 14,
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: AMBER,
                color: NAVY,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 15,
                fontWeight: 700,
                color: CREAM,
                lineHeight: 1.3,
                marginBottom: 4,
              }}
            >
              {s.title}
            </div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 13,
                lineHeight: 1.5,
                color: 'rgba(245, 240, 232, 0.72)',
              }}
            >
              {s.desc}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ═════════════════════ 5b. Our Services (Full-cycle) ══════════════════
   Mirrors FrameComponent25 — "ПОЛНЫЙ ЦИКЛ / Наши услуги". 1 featured
   service + 6 supporting tiles (door-to-door delivery, customs &
   standards, min deposit, optimal route, parts sourcing, 24/7 reply).
   ════════════════════════════════════════════════════════════════════ */

export function MobileOurServices() {
  const { lang } = useLang();
  const isRu = (lang || 'en').toLowerCase().startsWith('ru');

  const t = isRu
    ? {
        kicker: '// ПОЛНЫЙ ЦИКЛ',
        title: 'Наши услуги',
        intro: 'От аукциона до ключей в ваших руках — всё закрывает одна команда.',
        signatureBadge: 'Ключевой сервис',
        featured: {
          tag: '/ 01',
          title: 'Реальный осмотр и ручной подбор',
          desc: 'Каждое авто проходит живой осмотр до отправки: ЛКП, геометрия кузова, скрытая коррозия, электроника, сверка VIN.',
          points: [
            'Очный осмотр + диагностический скан',
            'Поиск скрытых дефектов и перекрасов',
            'Полная история и сверка VIN',
            'Подбор под бюджет и ваш запрос',
          ],
        },
        cards: [
          { tag: '/ 02', title: 'Доставка к дому', desc: 'Привозим автомобиль в любой город РФ/РБ. Ключи — у вашей двери.' },
          { tag: '/ 03', title: 'Таможня и стандарты', desc: 'Полное таможенное оформление под стандарты ЕС и ввоз в РФ/РБ.' },
          { tag: '/ 04', title: 'Минимальный задаток', desc: 'Старт по небольшому брони-платежу. Остаток — при получении.' },
          { tag: '/ 05', title: 'Оптимальный маршрут', desc: 'Строим самый выгодный маршрут — баланс цены, сроков и таможни.' },
          { tag: '/ 06', title: 'Подбор запчастей', desc: 'Привозим оригинал или качественный аналог напрямую от EU-поставщиков.' },
          { tag: '/ 07', title: 'Быстрый отклик 24/7', desc: 'Авто-расчёт за минуты, менеджер на связи в течение часа.' },
        ],
      }
    : {
        kicker: '// FULL-CYCLE SERVICE',
        title: 'Our services',
        intro: 'Everything between the auction lot and the keys in your hand — covered by one team.',
        signatureBadge: 'Signature service',
        featured: {
          tag: '/ 01',
          title: 'Real inspection & hand-picked selection',
          desc: 'Every car gets a hands-on inspection before shipping — paint, frame geometry, hidden corrosion, electronics, VIN match.',
          points: [
            'On-site walk-around + diagnostic scan',
            'Hidden-defect & repaint detection',
            'Full history & VIN cross-check',
            'Match against your budget & spec',
          ],
        },
        cards: [
          { tag: '/ 02', title: 'Door-to-door delivery', desc: 'We deliver the car to any city in Russia or Belarus.' },
          { tag: '/ 03', title: 'Customs & standards', desc: 'Full customs clearance to EU export and RU/BY import standards.' },
          { tag: '/ 04', title: 'Minimum deposit', desc: 'Start with a small reservation fee — rest settled on delivery.' },
          { tag: '/ 05', title: 'Optimal route', desc: "We build the cheapest viable route from yard to your driveway." },
          { tag: '/ 06', title: 'Parts sourcing', desc: 'OEM and quality-grade parts straight from EU suppliers.' },
          { tag: '/ 07', title: 'Fast 24/7 response', desc: 'Auto-quote in minutes, a manager on the line within an hour.' },
        ],
      };

  return (
    <section
      data-testid="mobile-our-services"
      style={{ background: CREAM, padding: '48px 16px 40px', fontFamily: FONT }}
    >
      <SectionHead kicker={t.kicker} title={t.title} subline={t.intro} />

      {/* Featured / signature card */}
      <article
        data-testid="mobile-our-services-featured"
        style={{
          marginTop: 8,
          background: NAVY,
          color: CREAM,
          borderRadius: 18,
          padding: '22px 20px',
          boxShadow: '0 18px 36px rgba(22, 46, 81, 0.18)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 160,
            height: 160,
            background: 'radial-gradient(circle, rgba(254, 174, 0, 0.18), transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 10px',
            background: 'rgba(254, 174, 0, 0.18)',
            color: AMBER,
            borderRadius: 999,
            fontFamily: FONT,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER }} />
          {t.signatureBadge}
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 12,
            fontWeight: 700,
            color: AMBER,
            letterSpacing: '0.10em',
            marginBottom: 6,
          }}
        >
          {t.featured.tag}
        </div>
        <h3
          style={{
            margin: 0,
            fontFamily: FONT,
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1.2,
            color: CREAM,
            letterSpacing: '-0.005em',
            overflowWrap: 'anywhere',
          }}
        >
          {t.featured.title}
        </h3>
        <p
          style={{
            margin: '10px 0 14px',
            fontFamily: FONT,
            fontSize: 14,
            lineHeight: 1.55,
            color: 'rgba(245, 240, 232, 0.78)',
          }}
        >
          {t.featured.desc}
        </p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {t.featured.points.map((p) => (
            <li
              key={p}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                fontFamily: FONT,
                fontSize: 13,
                lineHeight: 1.45,
                color: CREAM,
                marginBottom: 6,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flex: '0 0 14px', marginTop: 3 }} aria-hidden="true">
                <path d="M3 8.5l3.2 3.2L13 4.5" stroke={AMBER} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </article>

      {/* 6 supporting tiles — 2-column grid */}
      <div
        style={{
          marginTop: 14,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}
      >
        {t.cards.map((c, i) => (
          <article
            key={c.tag}
            data-testid={`mobile-our-services-tile-${i + 2}`}
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #E6DED4',
              borderRadius: 14,
              padding: '14px 14px 14px',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontFamily: FONT,
                fontSize: 11,
                fontWeight: 700,
                color: AMBER,
                letterSpacing: '0.10em',
                marginBottom: 6,
              }}
            >
              {c.tag}
            </div>
            <h4
              style={{
                margin: '0 0 6px',
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1.25,
                color: NAVY,
                overflowWrap: 'anywhere',
              }}
            >
              {c.title}
            </h4>
            <p
              style={{
                margin: 0,
                fontFamily: FONT,
                fontSize: 12,
                lineHeight: 1.45,
                color: TEXT_MUTED,
                overflowWrap: 'anywhere',
              }}
            >
              {c.desc}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ═════════════════════ 6. Avito Proof (Real Deals) ═════════════════════
   Mirrors BeforeAfterSection (which is actually the AVITO PROOF block —
   "ДОКАЗАТЕЛЬСТВО · АВИТО / Реальные сделки, проверенные отзывы").
   Loads /api/site-info → avito_proof. Falls back to a hard-coded sample
   of 3 deals so the section is never empty.
   ════════════════════════════════════════════════════════════════════ */

const AVITO_FALLBACK_ITEMS = {
  ru: [
    { id: 'demo-1', model: 'BMW X5 xDrive40i', year: 2021, completed_date: 'Октябрь 2026', price: '42 500 €', route: 'Германия → Минск' },
    { id: 'demo-2', model: 'Mercedes-Benz GLE 350d', year: 2020, completed_date: 'Сентябрь 2026', price: '38 900 €', route: 'Нидерланды → Москва' },
    { id: 'demo-3', model: 'Audi Q7 50 TDI', year: 2022, completed_date: 'Август 2026', price: '55 200 €', route: 'Бельгия → Гомель' },
  ],
  en: [
    { id: 'demo-1', model: 'BMW X5 xDrive40i', year: 2021, completed_date: 'October 2026', price: '€42,500', route: 'Germany → Minsk' },
    { id: 'demo-2', model: 'Mercedes-Benz GLE 350d', year: 2020, completed_date: 'September 2026', price: '€38,900', route: 'Netherlands → Moscow' },
    { id: 'demo-3', model: 'Audi Q7 50 TDI', year: 2022, completed_date: 'August 2026', price: '€55,200', route: 'Belgium → Gomel' },
  ],
};

export function MobileAvitoProof() {
  const { lang } = useLang();
  const isRu = (lang || 'en').toLowerCase().startsWith('ru');
  const [cfg, setCfg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await axios.get(`${API}/api/site-info`);
        if (cancelled) return;
        const proof = r.data?.avito_proof;
        if (proof && typeof proof === 'object') setCfg(proof);
      } catch { /* keep null → fallback */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const t = isRu
    ? {
        eyebrow: 'ДОКАЗАТЕЛЬСТВО · АВИТО',
        title: 'Реальные сделки,\nпроверенные отзывы',
        subtitle: 'Наш живой track-record на Авито: активные предложения, закрытые сделки и отзывы реальных клиентов.',
        statRating: 'Рейтинг · Авито',
        statReviews: 'Отзывов клиентов',
        statCompleted: 'Сделок доставлено',
        statActive: 'Сейчас в работе',
        recentTitle: 'Недавно доставлены',
        cta: 'Открыть профиль на Авито',
        of5: '/ 5',
      }
    : {
        eyebrow: 'PROOF · AVITO',
        title: 'Real deals,\nverified reviews',
        subtitle: 'Our live track record on Avito — active listings, completed deliveries and reviews from real clients.',
        statRating: 'Rating · Avito',
        statReviews: 'Client reviews',
        statCompleted: 'Deals delivered',
        statActive: 'Active right now',
        recentTitle: 'Recently delivered',
        cta: 'Open profile on Avito',
        of5: '/ 5',
      };

  const rating = (cfg?.rating ?? 4.9).toFixed(1);
  const reviewsCount = cfg?.reviews_count ?? 67;
  const completed = cfg?.completed_count ?? 142;
  const active = cfg?.active_count ?? 18;
  const avitoUrl = cfg?.url || 'https://www.avito.ru/';
  const rawItems = (cfg?.items && Array.isArray(cfg.items) && cfg.items.length > 0)
    ? cfg.items
    : (isRu ? AVITO_FALLBACK_ITEMS.ru : AVITO_FALLBACK_ITEMS.en);
  const items = rawItems
    .filter((c) => c && c.enabled !== false)
    .slice(0, 4)
    .map((it) => ({
      model: it.model,
      year: it.year,
      completed: isRu
        ? (it.completed_date_ru || it.completed_date || it.completed_date_en || '')
        : (it.completed_date_en || it.completed_date || it.completed_date_ru || ''),
      route: isRu
        ? (it.route_ru || it.route || it.route_en || '')
        : (it.route_en || it.route || it.route_ru || ''),
      price: it.price,
      image: it.image_url || it.image || '',
    }));

  return (
    <section
      data-testid="mobile-avito-proof"
      style={{ background: CREAM, padding: '48px 16px 36px', fontFamily: FONT }}
    >
      <SectionHead kicker={`// ${t.eyebrow}`} title={t.title.replace('\n', ' ')} subline={t.subtitle} />

      {/* Stats row — 2x2 grid */}
      <div
        style={{
          marginTop: 22,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}
      >
        {[
          { value: `${rating}${t.of5}`, label: t.statRating, isRating: true },
          { value: `${reviewsCount}+`, label: t.statReviews },
          { value: `${completed}+`, label: t.statCompleted },
          { value: `${active}`, label: t.statActive },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #E6DED4',
              borderRadius: 12,
              padding: '14px 14px 13px',
            }}
          >
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: 22,
                color: AMBER,
                lineHeight: 1,
                marginBottom: 6,
                letterSpacing: '-0.01em',
              }}
            >
              {s.value}
            </div>
            {s.isRating ? (
              <div style={{ display: 'flex', gap: 1, marginBottom: 6 }}>
                {Array.from({ length: 5 }, (_, k) => (
                  <svg key={k} width="10" height="10" viewBox="0 0 16 16" fill={AMBER} aria-hidden="true">
                    <path d="M8 1.5l1.96 4.32 4.72.5-3.5 3.22.96 4.7L8 11.9l-4.14 2.34.96-4.7-3.5-3.22 4.72-.5z" />
                  </svg>
                ))}
              </div>
            ) : null}
            <div
              style={{
                fontFamily: FONT,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: TEXT_MUTED,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Recent deals — vertical list */}
      <div style={{ marginTop: 28 }}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: NAVY,
            marginBottom: 12,
          }}
        >
          {t.recentTitle}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((d, i) => (
            <article
              key={i}
              data-testid={`mobile-avito-deal-${i}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '88px 1fr auto',
                gap: 12,
                alignItems: 'center',
                background: '#FFFFFF',
                border: '1.5px solid #E6DED4',
                borderRadius: 12,
                padding: 10,
              }}
            >
              <div
                style={{
                  width: 88,
                  height: 66,
                  background: '#EEE5DA',
                  borderRadius: 8,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {d.image ? (
                  <img src={d.image} alt={d.model} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="1.4" opacity="0.4">
                    <path d="M5 13l1.5-4a3 3 0 0 1 2.8-2h5.4A3 3 0 0 1 17.5 9L19 13M3 13h18v5a1 1 0 0 1-1 1h-1.5a1.5 1.5 0 0 1-1.5-1.5V17h-8v.5A1.5 1.5 0 0 1 7.5 19H6a1 1 0 0 1-1-1z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: NAVY, lineHeight: 1.25, overflowWrap: 'anywhere' }}>
                  {d.model} {d.year ? `· ${d.year}` : ''}
                </div>
                <div style={{ fontFamily: FONT, fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>
                  {d.completed}{d.route ? ` · ${d.route}` : ''}
                </div>
              </div>
              <div
                style={{
                  fontFamily: FONT,
                  fontWeight: 800,
                  fontSize: 13,
                  color: AMBER,
                  whiteSpace: 'nowrap',
                  marginLeft: 4,
                }}
              >
                {d.price}
              </div>
            </article>
          ))}
        </div>
      </div>

      <a
        href={avitoUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="mobile-avito-cta"
        style={{
          marginTop: 22,
          display: 'inline-flex',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: NAVY,
          color: CREAM,
          border: 'none',
          borderRadius: 999,
          padding: '14px 16px',
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          textDecoration: 'none',
          boxShadow: '0 12px 26px rgba(22, 46, 81, 0.22)',
          overflowWrap: 'anywhere',
          whiteSpace: 'normal',
          textAlign: 'center',
          lineHeight: 1.25,
        }}
      >
        {t.cta}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </section>
  );
}

/* ═════════════════════ 7. Reviews ══════════════════════════════════════
   Mirrors ReviewsArea1. Loads admin-managed reviews from /api/site-info.
   Horizontal scroll-snap carousel with one review per card.
   ════════════════════════════════════════════════════════════════════ */

export function MobileReviews() {
  const { lang } = useLang();
  const isRu = (lang || 'en').toLowerCase().startsWith('ru');
  const [reviews, setReviews] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await axios.get(`${API}/api/site-info`);
        if (cancelled) return;
        const arr = (r.data?.reviews?.items || []).filter((x) => x && x.enabled !== false);
        setReviews(arr);
      } catch {
        if (!cancelled) setReviews([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const list = (reviews && reviews.length > 0)
    ? reviews
    : isRu
      ? [
          { name: 'Георгий', rating: 5, text: 'Подход — чётко, прозрачно, без сюрпризов. Машина по бюджету, на связи всегда.' },
          { name: 'Димитр', rating: 5, text: 'Привёз джип через DM Auto — реально знают рынок. Хорошее соотношение цена / качество.' },
          { name: 'Алексей', rating: 5, text: 'Заказывал кроссовер из Германии — пришёл в идеальном состоянии, без сюрпризов.' },
        ]
      : [
          { name: 'Georgi', rating: 5, text: 'Approach — clear, transparent, no surprises. Car matched my budget, always in touch.' },
          { name: 'Dimitar', rating: 5, text: 'Bought a German SUV through DM Auto — they really know their stuff. Great value for money.' },
          { name: 'Alex', rating: 5, text: 'Ordered a crossover from Germany — arrived in perfect condition with no surprises.' },
        ];

  const kicker = isRu ? '// ОТЗЫВЫ' : '// REVIEWS';
  const title  = isRu ? 'Что говорят наши клиенты' : 'What our clients say';

  return (
    <section
      data-testid="mobile-reviews"
      style={{ background: CREAM, padding: '40px 0 32px', fontFamily: FONT }}
    >
      <div style={{ padding: '0 16px' }}>
        <SectionHead kicker={kicker} title={title} />
      </div>
      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          padding: '0 16px 16px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {list.map((r, i) => {
          // Backend stores RU translations under the `_bg` suffix (legacy
          // Bulgarian rollout). Map both keys so RU/BG locales pick up
          // the localised name & body, with EN/raw fields as fallbacks.
          const ruKey = isRu ? ['name_ru', 'name_bg', 'name'] : ['name_en', 'name'];
          const name = ruKey.map((k) => r[k]).find((v) => v) || '';
          const textCandidates = isRu
            ? [r.text_ru, r.text_bg, r.text_en, r.text]
            : [r.text_en, r.text, r.text_bg];
          const text = (() => {
            for (const c of textCandidates) {
              if (!c) continue;
              if (typeof c === 'string' && c.trim()) return c;
              if (typeof c === 'object') {
                const inner = c.ru || c.bg || c.en;
                if (inner && String(inner).trim()) return inner;
              }
            }
            return '';
          })();
          const rating = Number(r.rating) || 5;
          return (
            <article
              key={i}
              data-testid={`mobile-review-${i}`}
              style={{
                flex: '0 0 86%',
                maxWidth: '86%',
                scrollSnapAlign: 'center',
                background: '#FFFFFF',
                border: '1.5px solid #E6DED4',
                borderRadius: 16,
                padding: '20px 18px',
                boxShadow: '0 10px 22px rgba(22, 46, 81, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 200,
              }}
            >
              <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
                {Array.from({ length: 5 }, (_, k) => (
                  <svg key={k} width="14" height="14" viewBox="0 0 16 16" fill={k < rating ? AMBER : '#E6DED4'} aria-hidden="true">
                    <path d="M8 1.5l1.96 4.32 4.72.5-3.5 3.22.96 4.7L8 11.9l-4.14 2.34.96-4.7-3.5-3.22 4.72-.5z" />
                  </svg>
                ))}
              </div>
              <p
                style={{
                  margin: 0,
                  fontFamily: FONT,
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: INK,
                  overflowWrap: 'anywhere',
                  flex: '1 1 auto',
                }}
              >
                {text}
              </p>
              <div
                style={{
                  marginTop: 14,
                  fontFamily: FONT,
                  fontSize: 13,
                  fontWeight: 700,
                  color: NAVY,
                  letterSpacing: '0.04em',
                }}
              >
                — {name}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
