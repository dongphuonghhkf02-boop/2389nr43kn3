/**
 * MobileFooter — UNIFIED public-site footer for the ≤ 768 px viewport.
 *
 * Rebuilt 2026-06 to match the new DM Auto cream/navy/amber design system
 * (see desktop Footer1).  No more pixel-positioned 1219-px black slab —
 * this is a flowing, responsive layout that ships from `/` to /calculator,
 * /contacts, /about, /blog, single-car, search, etc.
 *
 * Dynamic data sourced from `GET /api/site-info` (same payload the desktop
 * Footer1 consumes):
 *   • header.phones / footer.contacts.phones      → call buttons
 *   • footer.contacts.addresses(_lang)            → address block
 *   • footer.contacts.working_hours(_lang)        → availability line
 *   • footer.contacts.registration_address(_lang) → legal address
 *   • footer.socials.telegram.{url,label*}        → Telegram channel CTA
 *   • footer.socials.{instagram,facebook,whatsapp,avito}.url → social row
 *
 * Modals reused from shared providers:
 *   • useGetInTouch  → "Get in touch" button (primary CTA)
 *   • usePolicyModal → CONDITIONS / PRIVACY / COOKIES
 */

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Phone, MapPin, ArrowUpRight, Send } from 'lucide-react';
import { useGetInTouch } from '../../components/public/GetInTouchModal';
import { usePolicyModal } from '../../components/public/PolicyModal';
import { useLang } from '../../i18n';
import { SOCIAL_DEFAULTS } from '../../lib/socials';

const API = process.env.REACT_APP_BACKEND_URL || '';

const FALLBACK_PHONES = ['+359 875 313 158', '+359 897 884 804'];
const FALLBACK_ADDRESSES_EN = [
  'Belarus, Minsk — by appointment',
  'Russia, Moscow — by appointment',
];
const FALLBACK_ADDRESSES_RU = [
  'Беларусь, Минск — по записи',
  'Россия, Москва — по записи',
];

function fmtLang(value, langKey) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return value[langKey] || value.en || value.ru || '';
  return String(value);
}

export default function MobileFooter({ lang: langProp }) {
  const [siteInfo, setSiteInfo] = useState(null);
  const { open: openGetInTouch } = useGetInTouch();
  const { open: openPolicy } = usePolicyModal();
  const { t, lang: contextLang } = useLang();
  const lang = langProp || contextLang || 'en';

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${API}/api/site-info`)
      .then((r) => { if (!cancelled) setSiteInfo(r.data || null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const langKey = (lang || 'en').toLowerCase().startsWith('ru') ? 'ru' : 'en';
  const phones = siteInfo?.header?.phones || siteInfo?.footer?.contacts?.phones || FALLBACK_PHONES;

  const contactsBlk = siteInfo?.footer?.contacts || {};
  const langAddrs = contactsBlk[`addresses_${langKey}`];
  let addresses;
  if (Array.isArray(langAddrs) && langAddrs.length > 0) {
    addresses = langAddrs;
  } else if (langKey === 'ru') {
    addresses = FALLBACK_ADDRESSES_RU;
  } else {
    const plain = contactsBlk.addresses;
    addresses = Array.isArray(plain) && plain.length > 0 ? plain : FALLBACK_ADDRESSES_EN;
  }

  const socials = siteInfo?.footer?.socials || {};
  const telegramSocial = socials?.telegram || {};
  const telegramUrl =
    telegramSocial.url ||
    siteInfo?.footer?.viber_community?.url ||
    SOCIAL_DEFAULTS.telegram.url;
  const adminTgLabel = langKey === 'ru'
    ? (telegramSocial.label_ru || telegramSocial.label_en)
    : (telegramSocial.label_en || telegramSocial.label_ru);
  const telegramLabel = adminTgLabel
    || (langKey === 'ru' ? 'Подпишитесь на Telegram-канал' : 'Join our Telegram channel');

  const resolvedSocialUrl = (k) => {
    const raw = socials?.[k];
    if (raw && typeof raw === 'object' && raw.enabled === false) return '';
    if (typeof raw === 'string' && raw) return raw;
    if (raw && raw.url) return raw.url;
    return SOCIAL_DEFAULTS[k]?.url || '';
  };

  const workingHours = (() => {
    const localized = contactsBlk?.[`working_hours_${langKey}`];
    if (localized) return localized;
    return langKey === 'ru' ? 'Пн – Вс · 24/7' : 'Mon – Sun · 24/7';
  })();

  const regAddress = (() => {
    const localized = contactsBlk?.[`registration_address_${langKey}`];
    if (localized) return localized;
    if (langKey === 'ru') return 'Беларусь / Россия — по записи';
    return contactsBlk?.registration_address || 'Belarus / Russia — by appointment';
  })();

  const navItems = [
    { tKey: 'crumbCalculator', fallback: langKey === 'ru' ? 'Калькулятор' : 'Calculator', href: '/calculator' },
    { tKey: 'crumbAbout',      fallback: langKey === 'ru' ? 'О нас' : 'About us',         href: '/about' },
    { tKey: 'crumbContacts',   fallback: langKey === 'ru' ? 'Контакты' : 'Contacts',       href: '/contacts' },
    { tKey: 'crumbBlog',       fallback: langKey === 'ru' ? 'Блог' : 'Blog',               href: '/blog' },
  ];

  return (
    <footer
      data-testid="mobile-footer"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box',
        background: '#FFF7EC',
        color: '#17202A',
        fontFamily: "'Mazzard', 'Mazzard H', system-ui, -apple-system, sans-serif",
        overflow: 'hidden',
        borderTop: '1px solid rgba(22, 46, 81, 0.08)',
      }}
    >
      {/* ─── Top: Logo + tagline ─────────────────────────────────────── */}
      <div style={{ padding: '32px 20px 8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
        <a href="/" aria-label="DM Auto" style={{ display: 'inline-flex' }}>
          <img
            src="/figma/dm-auto-logo.png"
            alt="DM Auto"
            data-testid="footer-logo"
            style={{ height: 38, width: 'auto', objectFit: 'contain', display: 'block' }}
          />
        </a>
        <p style={{
          margin: 0,
          maxWidth: 280,
          fontSize: 13,
          lineHeight: '18px',
          color: '#4a5a73',
          fontWeight: 400,
        }}>
          {langKey === 'ru'
            ? 'Подбор и доставка авто из Европы — под ключ.'
            : 'Sourcing and turnkey delivery of European cars.'}
        </p>
      </div>

      {/* ─── CTA block — Get in touch ────────────────────────────────── */}
      <div style={{ padding: '12px 20px 4px' }}>
        <button
          type="button"
          data-testid="footer-get-in-touch"
          onClick={() => openGetInTouch({ source: 'mobile-footer' })}
          style={{
            width: '100%',
            minHeight: 52,
            background: '#FEAE00',
            color: '#0F1729',
            border: 'none',
            borderRadius: 8,
            padding: '14px 20px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'transform 150ms ease, filter 150ms ease',
            boxShadow: '0 10px 28px rgba(254, 174, 0, 0.32)',
          }}
        >
          {langKey === 'ru' ? 'Связаться с нами' : 'Get in touch'}
          <ArrowUpRight size={16} strokeWidth={2.4} />
        </button>
      </div>

      {/* ─── Contacts block ──────────────────────────────────────────── */}
      <div style={{ padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Phones */}
        <div data-testid="footer-phone-block">
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: '#7a8699',
            marginBottom: 8,
          }}>
            {langKey === 'ru' ? 'Телефон' : 'Phone'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {phones.map((p, i) => (
              <a
                key={i}
                href={`tel:${p.replace(/\s+/g, '')}`}
                data-testid={`footer-phone-${i}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#162E51',
                  fontWeight: 700,
                  fontSize: 16,
                  lineHeight: '20px',
                  textDecoration: 'none',
                }}
              >
                <Phone size={14} strokeWidth={2.2} />
                {p}
              </a>
            ))}
          </div>
        </div>

        {/* Address */}
        <div data-testid="footer-address-block">
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: '#7a8699',
            marginBottom: 8,
          }}>
            {langKey === 'ru' ? 'Адрес' : 'Address'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {addresses.map((a, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  fontSize: 14,
                  lineHeight: '20px',
                  color: '#17202A',
                  fontWeight: 500,
                }}
              >
                <MapPin size={14} strokeWidth={2.2} style={{ marginTop: 3, flexShrink: 0, color: '#FEAE00' }} />
                <span>{a}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Working hours + reg address — small muted lines */}
        <div
          data-testid="footer-working-hours"
          style={{ fontSize: 12, lineHeight: '18px', color: '#7a8699' }}
        >
          {langKey === 'ru' ? 'Режим работы:' : 'Availability:'} {workingHours}
        </div>
        <div
          data-testid="footer-registration-address"
          style={{ fontSize: 12, lineHeight: '18px', color: '#7a8699' }}
        >
          {langKey === 'ru' ? 'Адрес регистрации:' : 'Registration address:'} {regAddress}
        </div>
      </div>

      {/* ─── Telegram channel ────────────────────────────────────────── */}
      <div style={{ padding: '8px 20px 20px' }}>
        <a
          href={telegramUrl}
          target="_blank"
          rel="noreferrer noopener"
          data-testid="footer-telegram-community-link"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            borderRadius: 10,
            background: 'rgba(22, 46, 81, 0.06)',
            border: '1px solid rgba(22, 46, 81, 0.12)',
            color: '#17202A',
            textDecoration: 'none',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38, height: 38,
              borderRadius: 999,
              background: '#FEAE00',
              color: '#0c1d3d',
              flexShrink: 0,
            }}
          >
            <Send size={18} strokeWidth={2.4} />
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7a8699' }}>
              Telegram
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#162E51' }}>
              {telegramLabel}
            </span>
          </div>
        </a>
      </div>

      {/* ─── Socials row + nav ───────────────────────────────────────── */}
      <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div data-testid="footer-social-media">
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: '#7a8699',
            marginBottom: 12,
          }}>
            {langKey === 'ru' ? 'Социальные сети' : 'Social media'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            {['instagram', 'facebook', 'whatsapp', 'avito'].map((key) => {
              const url = resolvedSocialUrl(key);
              if (!url) return null;
              const iconSrc = `/figma/${{
                instagram: 'ri-instagram-line.svg',
                facebook: 'ic-twotone-facebook.svg',
                whatsapp: 'ic-whatsapp.svg',
                avito: 'ic-avito.svg',
              }[key]}`;
              return (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={key}
                  data-testid={`footer-social-${key}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40, height: 40,
                    borderRadius: 999,
                    background: 'rgba(22, 46, 81, 0.06)',
                    border: '1px solid rgba(22, 46, 81, 0.12)',
                    transition: 'transform 150ms ease, background 150ms ease',
                  }}
                >
                  <img src={iconSrc} alt="" width={20} height={20} style={{ display: 'block' }} />
                </a>
              );
            })}
          </div>
        </div>

        {/* Nav links */}
        <nav
          data-testid="footer-nav"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px 24px',
            paddingTop: 16,
            borderTop: '1px solid rgba(22, 46, 81, 0.08)',
          }}
        >
          {navItems.map((it) => {
            const label = t(it.tKey) || it.fallback;
            return (
              <a
                key={it.fallback}
                href={it.href}
                data-testid={`footer-nav-${it.fallback.toLowerCase().replace(/\s+/g, '-')}`}
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: '#17202A',
                  textDecoration: 'none',
                }}
              >
                {label}
              </a>
            );
          })}
        </nav>
      </div>

      {/* ─── Legal row ───────────────────────────────────────────────── */}
      <div
        data-testid="footer-legal-row"
        style={{
          padding: '16px 20px 12px',
          borderTop: '1px solid rgba(22, 46, 81, 0.08)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        {[
          { fallback: langKey === 'ru' ? 'Условия' : 'Conditions',         tKey: 'mobileFooterConditions', key: 'conditions' },
          { fallback: langKey === 'ru' ? 'Конфиденциальность' : 'Privacy', tKey: 'mobileFooterPrivacy',    key: 'privacy'    },
          { fallback: langKey === 'ru' ? 'Cookies' : 'Cookies',            tKey: 'mobileFooterCookies',    key: 'cookies'    },
        ].map((it) => (
          <button
            key={it.key}
            type="button"
            data-testid={`footer-policy-${it.key}`}
            onClick={() => openPolicy(it.key)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 11,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#7a8699',
              whiteSpace: 'nowrap',
            }}
          >
            {t(it.tKey) || it.fallback}
          </button>
        ))}
      </div>

      {/* ─── VAT / Company line ──────────────────────────────────────── */}
      <div
        data-testid="footer-vat-id"
        style={{
          padding: '8px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 8,
          fontSize: 10,
          color: '#7a8699',
          letterSpacing: '0.04em',
        }}
      >
        <span>VAT BG206637283</span>
        <span>ID 206637283</span>
        <span>PM AUTO GROUP LTD</span>
      </div>

      {/* ─── Copyright + credits ─────────────────────────────────────── */}
      <div
        data-testid="footer-copyright"
        style={{
          padding: '8px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          color: '#7a8699',
        }}
      >
        <span style={{ fontSize: 11, letterSpacing: '0.04em' }}>
          © {new Date().getFullYear()} DM AUTO · {langKey === 'ru' ? 'Все права защищены' : 'All rights reserved'}
        </span>
        <a
          href="https://www.olhalazarieva.com"
          target="_blank"
          rel="noreferrer noopener"
          data-testid="footer-credit-design"
          style={{
            fontSize: 10,
            color: '#7a8699',
            textDecoration: 'none',
            letterSpacing: '0.04em',
          }}
        >
          / Website design — O.la /
        </a>
      </div>
    </footer>
  );
}
