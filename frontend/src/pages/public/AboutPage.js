/**
 * DM Auto — About Us page (V11)
 *
 * Strict cream / navy / amber Welcome style — same DNA as Contacts &
 * Calculator pages. Reuses `bibi-c2-*` CSS for editorial section heads
 * and value cards, then layers a custom `bibi-c2-gallery` grid that
 * shows admin-configurable photos / videos.
 *
 * Sections:
 *   1. PageHero            — shared breadcrumb + title
 *   2. Editorial hero      — kicker + subline (no fake numbers)
 *   3. Media gallery       — admin-managed photos + videos with captions
 *   4. Values / advantages — 3 cards
 *   5. LeadCtaBand         — compact bottom CTA (same as Contacts)
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  ShieldCheck, Lightning, Heart, Star, Sparkle, Trophy, Handshake, Globe,
  PlayCircle, SpeakerSimpleHigh, SpeakerSimpleSlash,
} from '@phosphor-icons/react';

import PageHero from '../../components/public/PageHero';
import LeadCtaBand from '../../components/public/LeadCtaBand';
import { useLang } from '../../i18n';
import { API_URL } from '../../App';
import './ContactsPage.css';   // shared cream/navy/amber primitives
import './AboutPage.css';      // small extras (gallery grid, tile, etc.)

const ICONS = {
  ShieldCheck, Lightning, Heart, Star, Sparkle, Trophy, Handshake, Globe,
};

const resolveMediaUrl = (raw) => {
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/api/static') || raw.startsWith('/static')) return `${API_URL}${raw}`;
  return raw;
};

const T = {
  ru: {
    home: 'ГЛАВНАЯ',
    crumb: 'о нас',
    title: 'о нас',
    kicker: '// dm auto',
    headline: 'Мы привозим авто из Европы\nпод ключ — без сюрпризов.',
    subline:
      'Подбор, проверка, выкуп, доставка, таможня и постановка на учёт — каждый шаг в одной заявке. Команда DM Auto держит сроки и цену.',

    galleryKicker: '// Реальные фото и видео',
    galleryTitle: 'Закулисье нашей работы',
    gallerySubline:
      'Аукционы, осмотр, перевозка и выдача — каждый шаг в реальных кадрах.',

    valuesKicker: '// Что мы делаем',
    valuesTitle: 'Берём на себя весь маршрут\nот аукциона до ваших ключей.',
    valuesSubline:
      'Прозрачные условия, единый менеджер и фиксированная стоимость под ключ.',
  },
  en: {
    home: 'HOME',
    crumb: 'about us',
    title: 'about us',
    kicker: '// dm auto',
    headline: 'We bring cars from Europe\nturnkey — with no surprises.',
    subline:
      'Sourcing, inspection, buy-out, road logistics, customs and registration — every step in one request. The DM Auto team keeps the timeline and the price.',

    galleryKicker: '// Real photos & videos',
    galleryTitle: 'Behind the scenes',
    gallerySubline:
      'Auctions, inspection, transport and handover — every step in real frames.',

    valuesKicker: '// What we do',
    valuesTitle: 'We handle the full route\nfrom the auction to your keys.',
    valuesSubline:
      'Transparent terms, a single account manager and a fixed turnkey price.',
  },
};

// ─────────────────────────────────────────────────────────────────────────
//  Editorial section header (matches Contacts page primitives)
// ─────────────────────────────────────────────────────────────────────────
function SectionHead({ kicker, title, subline }) {
  return (
    <header className="bibi-c2-head">
      <div className="bibi-c2-kicker">{kicker}</div>
      <h2 className="bibi-c2-title" style={{ whiteSpace: 'pre-line' }}>{title}</h2>
      {subline ? <p className="bibi-c2-subline">{subline}</p> : null}
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  Media tile — single image OR video item from admin gallery
// ─────────────────────────────────────────────────────────────────────────
function MediaTile({ item, caption }) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef(null);

  const isVideo = item.kind === 'video';
  const mediaUrl = resolveMediaUrl(item.url);
  const externalUrl = (item.video_url || '').trim();
  const posterUrl = resolveMediaUrl(item.poster_url) || mediaUrl || '';
  const isEmbed = isVideo && externalUrl && !mediaUrl;
  const hasFile = isVideo && mediaUrl;

  const embedSrc = useMemo(() => {
    if (!isEmbed) return '';
    const url = externalUrl;
    const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0`;
    const vm = url.match(/vimeo\.com\/(\d+)/);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}?autoplay=1`;
    return url;
  }, [externalUrl, isEmbed]);

  const togglePlay = () => {
    if (isEmbed) { setPlaying(true); return; }
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  const sizeCls = `bibi-c2-tile--size-${item.size || 'md'}`;

  return (
    <figure className={`bibi-c2-tile ${sizeCls}`}>
      <div className="bibi-c2-tile__frame">
        {!isVideo && mediaUrl && (
          <img src={mediaUrl} alt={caption || ''} loading="lazy" />
        )}

        {hasFile && !isEmbed && (
          <>
            {!playing && posterUrl && (
              <img src={posterUrl} alt={caption || ''} loading="lazy" />
            )}
            <video
              ref={videoRef}
              src={mediaUrl}
              poster={posterUrl || undefined}
              muted={muted}
              playsInline
              preload="metadata"
              onEnded={() => setPlaying(false)}
              style={{ display: playing ? 'block' : 'none' }}
            />
            {!playing && (
              <button type="button" className="bibi-c2-tile__play"
                onClick={togglePlay} aria-label="Play video">
                <PlayCircle size={56} weight="fill" />
              </button>
            )}
            {playing && (
              <button type="button" className="bibi-c2-tile__mute"
                onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
                aria-label={muted ? 'Unmute' : 'Mute'}>
                {muted
                  ? <SpeakerSimpleSlash size={18} weight="fill" />
                  : <SpeakerSimpleHigh size={18} weight="fill" />}
              </button>
            )}
          </>
        )}

        {isEmbed && (
          <>
            {!playing && (
              <>
                {posterUrl
                  ? <img src={posterUrl} alt={caption || ''} loading="lazy" />
                  : <div className="bibi-c2-tile__placeholder" />}
                <button type="button" className="bibi-c2-tile__play"
                  onClick={togglePlay} aria-label="Play video">
                  <PlayCircle size={56} weight="fill" />
                </button>
              </>
            )}
            {playing && (
              <iframe
                src={embedSrc}
                title={caption || 'video'}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            )}
          </>
        )}

        {isVideo && <span className="bibi-c2-tile__tag">VIDEO</span>}
      </div>
      {caption && (
        <figcaption className="bibi-c2-tile__caption">{caption}</figcaption>
      )}
    </figure>
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  Value card (icon + title + text) — matches ContactsPage AdvCard
// ─────────────────────────────────────────────────────────────────────────
function ValueCard({ Icon, title, text }) {
  return (
    <div className="bibi-c2-adv">
      <span className="bibi-c2-adv__icon" aria-hidden="true">
        <Icon size={24} weight="duotone" />
      </span>
      <h4 className="bibi-c2-adv__title">{title}</h4>
      <p className="bibi-c2-adv__text">{text}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  Page root
// ─────────────────────────────────────────────────────────────────────────
export default function AboutPage() {
  const { lang } = useLang();
  const isRu = lang === 'ru';
  const t = isRu ? T.ru : T.en;

  const [about, setAbout] = useState(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const r = await axios.get(`${API_URL}/api/site-info`);
        if (!cancel) setAbout(r?.data?.about || {});
      } catch {
        if (!cancel) setAbout({});
      }
    })();
    return () => { cancel = true; };
  }, []);

  // Gallery items (admin-driven)
  const gallery = about?.gallery || {};
  const galleryItems = (gallery.items || []).filter((it) => it && it.enabled !== false);

  // Values (admin-driven)
  const values = about?.values || {};
  const valueItems = (values.items || []).filter((it) => it && it.enabled !== false);

  // Resolve hero copy from admin (fallback to local defaults)
  const heroKicker  = about?.intro?.[`kicker${isRu ? '_ru' : '_en'}`]   || t.kicker;
  const heroTitle   = about?.intro?.[`headline${isRu ? '_ru' : '_en'}`] || t.headline;
  const heroSubline = about?.intro?.[`subline${isRu ? '_ru' : '_en'}`]  || t.subline;

  const galleryTitle    = gallery[`title${isRu ? '_ru' : '_en'}`]    || t.galleryTitle;
  const gallerySubline  = gallery[`subtitle${isRu ? '_ru' : '_en'}`] || t.gallerySubline;

  const valuesTitle    = values[`title${isRu ? '_ru' : '_en'}`]    || t.valuesTitle;
  const valuesSubline  = values[`subtitle${isRu ? '_ru' : '_en'}`] || t.valuesSubline;

  if (about?.enabled === false) {
    return (
      <div className="bibi-c2-page" data-testid="about-page">
        <PageHero home={t.home} crumbs={[{ label: t.crumb }]} title={t.title} testId="about-hero" />
      </div>
    );
  }

  return (
    <div className="bibi-c2-page" data-testid="about-page">
      {/* 1. Shared breadcrumb hero */}
      <PageHero
        home={t.home}
        crumbs={[{ label: t.crumb }]}
        title={t.title}
        testId="about-hero"
        className="bibi-contacts-hero"
      />

      <div className="bibi-c2-container">
        {/* 2. Editorial hero — no fake numbers, just clear positioning */}
        <section className="bibi-c2-hero">
          <SectionHead kicker={heroKicker} title={heroTitle} subline={heroSubline} />
        </section>

        {/* 3. Media gallery — admin-managed */}
        {gallery.enabled !== false && galleryItems.length > 0 && (
          <section className="bibi-c2-gallery-section" data-testid="about-gallery">
            <SectionHead
              kicker={t.galleryKicker}
              title={galleryTitle}
              subline={gallerySubline}
            />
            <div className="bibi-c2-gallery">
              {galleryItems.map((item, idx) => {
                const cap = item[`caption${isRu ? '_ru' : '_en'}`] || item.caption_en || '';
                return <MediaTile key={item.id || idx} item={item} caption={cap} />;
              })}
            </div>
          </section>
        )}

        {/* 4. Values / advantages — same layout as Contacts adv-section */}
        {values.enabled !== false && valueItems.length > 0 && (
          <section className="bibi-c2-adv-section" data-testid="about-values">
            <SectionHead
              kicker={t.valuesKicker}
              title={valuesTitle}
              subline={valuesSubline}
            />
            <div className="bibi-c2-adv-grid">
              {valueItems.slice(0, 6).map((it, i) => {
                const Icon = ICONS[it.icon] || ShieldCheck;
                const tt = it[`title${isRu ? '_ru' : '_en'}`] || it.title_en || '';
                const dd = it[`desc${isRu ? '_ru' : '_en'}`]  || it.desc_en  || '';
                return <ValueCard key={it.id || i} Icon={Icon} title={tt} text={dd} />;
              })}
            </div>
          </section>
        )}
      </div>

      {/* 5. Small bottom CTA — same component used by Contacts/Calculator */}
      <LeadCtaBand
        source="about_page"
        titleRu="Готовы подобрать авто?"
        titleEn="Ready to pick a car?"
        textRu="Оставьте заявку — менеджер свяжется в течение 15 минут, уточнит детали и пришлёт расчёт под ключ."
        textEn="Drop a request — our manager will reach out within 15 minutes, confirm the details and send a turnkey quote."
        ctaRu="Связаться с менеджером"
        ctaEn="Contact the manager"
        testId="about-lead-cta"
      />
    </div>
  );
}
