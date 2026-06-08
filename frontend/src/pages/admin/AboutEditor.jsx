/**
 * AboutEditor — admin UI for the public About-Us page.
 *
 * Controls the `about` section of /api/site-info:
 *   • hero     — eyebrow / 3-line title / 3 KPIs / background image
 *   • intro    — bilingual paragraphs with yellow-accent phrases
 *   • stats    — 4 KPI numbers shown above the values block
 *   • gallery  — chaotic image + video grid (add / remove / reorder / upload)
 *   • values   — 3 value cards (icon + title + description)
 *   • cta      — yellow/white split heading above the consultation form
 *
 * Uploads:
 *   POST /api/admin/site-info/upload-hero-image?variant=web   (hero bg)
 *   POST /api/admin/site-info/upload-about-media?kind=image   (gallery image)
 *   POST /api/admin/site-info/upload-about-media?kind=video   (gallery video)
 *   POST /api/admin/site-info/upload-about-media?kind=poster  (video poster)
 */
import React, { useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Plus, Trash, ArrowUp, ArrowDown, Eye, EyeSlash,
  UploadSimple, Image as ImageIcon, FilmStrip, X,
} from '@phosphor-icons/react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const VALUE_ICONS = ['ShieldCheck', 'Lightning', 'Heart', 'Star', 'Sparkle', 'Trophy', 'Handshake', 'Globe', 'Headset'];
const TILE_SIZES = [
  { value: 'sm',   label: 'Small (2×2)' },
  { value: 'md',   label: 'Medium (2×3)' },
  { value: 'lg',   label: 'Large (3×3)' },
  { value: 'xl',   label: 'Extra Large (4×4)' },
  { value: 'tall', label: 'Tall (2×4)' },
  { value: 'wide', label: 'Wide (4×2)' },
];

const inputCls =
  'w-full bg-white border border-[#E4E4E7] rounded-lg px-3.5 h-10 text-[14px] text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#18181B] focus:ring-2 focus:ring-[#18181B]/10 transition-all';
const textareaCls =
  'w-full bg-white border border-[#E4E4E7] rounded-lg px-3.5 py-2.5 text-[14px] text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#18181B] focus:ring-2 focus:ring-[#18181B]/10 transition-all resize-y';
const selectCls = inputCls;

function Block({ title, description, children, footer }) {
  return (
    <div className="bg-white border border-[#E4E4E7] rounded-2xl">
      {(title || description) && (
        <div className="px-5 pt-5 pb-4">
          {title && <h2 className="font-semibold text-[#18181B] text-[15px]">{title}</h2>}
          {description && <p className="text-[12.5px] text-[#71717A] mt-1 leading-relaxed">{description}</p>}
        </div>
      )}
      <div className="px-5 pb-5">{children}</div>
      {footer && <div className="px-5 py-3 border-t border-[#F4F4F5] bg-[#FAFAFA] rounded-b-2xl text-[12px] text-[#71717A]">{footer}</div>}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-semibold text-[#52525B] mb-1.5 uppercase tracking-wider">{label}</span>
      {children}
      {hint && <span className="block text-[11.5px] text-[#A1A1AA] mt-1">{hint}</span>}
    </label>
  );
}

function resolveUrl(raw) {
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/api/static') || raw.startsWith('/static')) return `${API_URL}${raw}`;
  return raw;
}

/** Re-usable file upload helper for about-media or hero. */
async function uploadFile({ url, field, file, params = {} }) {
  const fd = new FormData();
  fd.append(field, file);
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const q = new URLSearchParams(params).toString();
  const r = await axios.post(
    `${API_URL}${url}${q ? `?${q}` : ''}`,
    fd,
    { headers: { ...headers, 'Content-Type': 'multipart/form-data' } },
  );
  return r.data;
}

// ─── Hero block ──────────────────────────────────────────────────────────
function HeroSection({ about, update }) {
  const fileInput = useRef(null);
  const hero = about?.hero || {};
  const photoUrl = resolveUrl(hero.image_url);

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large (max 5 MB)');
      return;
    }
    try {
      const data = await uploadFile({
        url: '/api/admin/site-info/upload-hero-image',
        field: 'image',
        file,
        params: { variant: 'web' },
      });
      if (data?.url) {
        update('hero', { ...hero, image_url: data.url });
        toast.success('Hero image uploaded');
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Upload failed');
    }
  };

  return (
    <div className="space-y-5">
      <Block title="Hero — Eyebrow & KPIs" description="Top label and three KPI lines, shown above the call-to-action button.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Eyebrow (EN)" hint="Use '|' to insert the amber separator.">
            <input className={inputCls} value={hero.eyebrow_en || ''}
              onChange={(e) => update('hero', { ...hero, eyebrow_en: e.target.value })}
              placeholder="ABOUT US | DM AUTO" />
          </Field>
          <Field label="Eyebrow (RU)" hint="Используйте '|' для янтарного разделителя.">
            <input className={inputCls} value={hero.eyebrow_ru || ''}
              onChange={(e) => update('hero', { ...hero, eyebrow_ru: e.target.value })}
              placeholder="О НАС | DM AUTO" />
          </Field>
          {[1, 2, 3].map((n) => (
            <React.Fragment key={n}>
              <Field label={`KPI ${n} (EN)`}>
                <input className={inputCls} value={hero[`kpi${n}_en`] || ''}
                  onChange={(e) => update('hero', { ...hero, [`kpi${n}_en`]: e.target.value })} />
              </Field>
              <Field label={`KPI ${n} (RU)`}>
                <input className={inputCls} value={hero[`kpi${n}_ru`] || ''}
                  onChange={(e) => update('hero', { ...hero, [`kpi${n}_ru`]: e.target.value })} />
              </Field>
            </React.Fragment>
          ))}
        </div>
      </Block>

      <Block title="Hero — Display title" description="Three lines stacked. The 2nd line renders in the amber accent colour.">
        {[1, 2, 3].map((n) => (
          <div key={n} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 last:mb-0">
            <Field label={`Title line ${n} (EN)`}>
              <input className={inputCls} value={hero[`title_line${n}_en`] || ''}
                onChange={(e) => update('hero', { ...hero, [`title_line${n}_en`]: e.target.value })} />
            </Field>
            <Field label={`Title line ${n} (RU)`}>
              <input className={inputCls} value={hero[`title_line${n}_ru`] || ''}
                onChange={(e) => update('hero', { ...hero, [`title_line${n}_ru`]: e.target.value })} />
            </Field>
          </div>
        ))}
      </Block>

      <Block title="Hero — Background image"
        description="Recommended 1920×1080 JPG/WebP, focal subject right of centre (left side darkens for legibility)."
        footer="JPG / PNG / WebP up to 5 MB. Leave URL empty to fall back to the default brand image.">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4 items-start">
          <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-[#E4E4E7] bg-[#FAFAFA]">
            {photoUrl ? (
              <img src={photoUrl} alt="hero preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#A1A1AA] text-[12px] uppercase tracking-wider">
                No image
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <Field label="Image URL">
              <input className={inputCls} value={hero.image_url || ''}
                placeholder="/api/static/hero/your-image.jpg"
                onChange={(e) => update('hero', { ...hero, image_url: e.target.value })} />
            </Field>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => fileInput.current?.click()}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#18181B] hover:bg-black text-white text-[13px] font-semibold transition-colors"
                data-testid="about-hero-upload">
                <UploadSimple size={15} weight="bold" /> Upload image
              </button>
              {hero.image_url && (
                <button type="button" onClick={() => update('hero', { ...hero, image_url: '' })}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-[#E4E4E7] text-[#52525B] hover:bg-[#FAFAFA] text-[13px] font-semibold transition-colors">
                  <X size={14} weight="bold" /> Clear
                </button>
              )}
              <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onUpload}
                data-testid="about-hero-file-input" />
            </div>
          </div>
        </div>
      </Block>
    </div>
  );
}

// ─── Intro block ────────────────────────────────────────────────────────
function IntroSection({ about, update }) {
  const intro = about?.intro || {};
  const set = (key, val) => update('intro', { ...intro, [key]: val });
  return (
    <Block title="Editorial hero"
      description="Top section of the About-Us page: amber kicker, big navy headline (use \\n for line breaks) and a calm subline.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Kicker (EN)" hint='Small amber label, e.g. "// DM AUTO".'>
          <input className={inputCls} value={intro.kicker_en || ''} onChange={(e) => set('kicker_en', e.target.value)} placeholder="// DM AUTO" />
        </Field>
        <Field label="Kicker (RU)">
          <input className={inputCls} value={intro.kicker_ru || ''} onChange={(e) => set('kicker_ru', e.target.value)} placeholder="// DM AUTO" />
        </Field>
        <Field label="Headline (EN)" hint="Use \n to break to a new line.">
          <textarea rows={3} className={textareaCls} value={intro.headline_en || ''} onChange={(e) => set('headline_en', e.target.value)} />
        </Field>
        <Field label="Headline (RU)">
          <textarea rows={3} className={textareaCls} value={intro.headline_ru || ''} onChange={(e) => set('headline_ru', e.target.value)} />
        </Field>
        <Field label="Subline (EN)">
          <textarea rows={3} className={textareaCls} value={intro.subline_en || ''} onChange={(e) => set('subline_en', e.target.value)} />
        </Field>
        <Field label="Subline (RU)">
          <textarea rows={3} className={textareaCls} value={intro.subline_ru || ''} onChange={(e) => set('subline_ru', e.target.value)} />
        </Field>
      </div>
    </Block>
  );
}

// ─── Stats ──────────────────────────────────────────────────────────────
function StatsSection({ about, update }) {
  const stats = about?.stats || {};
  const items = stats.items || [];
  const setStats = (patch) => update('stats', { ...stats, ...patch });
  const setItem = (idx, patch) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    setStats({ items: next });
  };
  return (
    <Block title="Stats band"
      description="4 KPI tiles rendered between the gallery and the values cards."
      footer="Tip: keep `value` short (e.g. 10+ / 5000+ / 24/7) for the bold yellow display.">
      <label className="flex items-center gap-3 text-[14px] text-[#18181B] mb-4 cursor-pointer">
        <input type="checkbox" checked={stats.enabled !== false} onChange={(e) => setStats({ enabled: e.target.checked })}
          className="w-4 h-4 accent-[#18181B] cursor-pointer" />
        <span className="font-medium">Show stats band</span>
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((it, idx) => (
          <div key={it.id || idx} className="border border-[#E4E4E7] rounded-xl p-4 space-y-3 bg-[#FAFAFA]">
            <Field label={`Stat ${idx + 1} — Value`}>
              <input className={inputCls} value={it.value || ''} onChange={(e) => setItem(idx, { value: e.target.value })}
                placeholder="10+" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Label (EN)">
                <input className={inputCls} value={it.label_en || ''} onChange={(e) => setItem(idx, { label_en: e.target.value })} />
              </Field>
              <Field label="Label (RU)">
                <input className={inputCls} value={it.label_ru || ''} onChange={(e) => setItem(idx, { label_ru: e.target.value })} />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </Block>
  );
}

// ─── Gallery ────────────────────────────────────────────────────────────
function GalleryItemRow({ item, idx, total, update, remove, move, upload }) {
  const imgInput = useRef(null);
  const vidInput = useRef(null);
  const posterInput = useRef(null);
  const isVideo = item.kind === 'video';
  const set = (patch) => update(idx, patch);

  return (
    <div className={`border rounded-xl overflow-hidden ${item.enabled === false ? 'bg-[#FAFAFA] opacity-70' : 'bg-white'} border-[#E4E4E7]`}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#F4F4F5] bg-[#FAFAFA]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#18181B] text-white text-[11px] font-bold shrink-0">{idx + 1}</span>
          <span className="text-[13px] font-semibold text-[#18181B] truncate">
            {item.caption_en || item.caption_ru || <em className="text-[#A1A1AA] font-normal">Untitled tile</em>}
          </span>
          <span className={`ml-2 inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${isVideo ? 'bg-[#FFEFCB] text-[#7A4A00]' : 'bg-[#E0F2FE] text-[#075985]'}`}>
            {isVideo ? <FilmStrip size={10} weight="fill" /> : <ImageIcon size={10} weight="fill" />}
            {item.kind || 'image'}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={() => set({ enabled: item.enabled === false })}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[#52525B] hover:bg-[#F4F4F5]" title={item.enabled === false ? 'Show' : 'Hide'}>
            {item.enabled === false ? <EyeSlash size={16} /> : <Eye size={16} />}
          </button>
          <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[#52525B] hover:bg-[#F4F4F5] disabled:opacity-30">
            <ArrowUp size={16} />
          </button>
          <button type="button" onClick={() => move(idx, +1)} disabled={idx === total - 1}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[#52525B] hover:bg-[#F4F4F5] disabled:opacity-30">
            <ArrowDown size={16} />
          </button>
          <button type="button" onClick={() => remove(idx)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-red-500 hover:bg-red-50">
            <Trash size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
          {/* Preview */}
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-[#E4E4E7] bg-[#FAFAFA]">
            {isVideo && item.video_url ? (
              <div className="w-full h-full flex items-center justify-center text-[#71717A] text-[12px]">External: {item.video_url}</div>
            ) : (item.url) ? (
              isVideo ? (
                <video src={resolveUrl(item.url)} poster={resolveUrl(item.poster_url)} muted className="w-full h-full object-cover" />
              ) : (
                <img src={resolveUrl(item.url)} alt="" className="w-full h-full object-cover" />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#A1A1AA] text-[12px] uppercase tracking-wider">No media</div>
            )}
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Kind">
                <select className={selectCls} value={item.kind || 'image'} onChange={(e) => set({ kind: e.target.value })}>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </Field>
              <Field label="Size (grid span)">
                <select className={selectCls} value={item.size || 'md'} onChange={(e) => set({ size: e.target.value })}>
                  {TILE_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
            </div>

            {/* Image upload */}
            {!isVideo && (
              <div className="space-y-2">
                <Field label="Image URL">
                  <input className={inputCls} value={item.url || ''}
                    placeholder="/api/static/about/your-image.jpg"
                    onChange={(e) => set({ url: e.target.value })} />
                </Field>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => imgInput.current?.click()}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-[#18181B] hover:bg-black text-white text-[12.5px] font-semibold transition-colors">
                    <UploadSimple size={14} weight="bold" /> Upload image
                  </button>
                  <input ref={imgInput} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(idx, 'image', f); }} />
                </div>
              </div>
            )}

            {/* Video uploads */}
            {isVideo && (
              <div className="space-y-3">
                <Field label="Video URL (uploaded MP4 / WebM)" hint="Or use the upload button below.">
                  <input className={inputCls} value={item.url || ''}
                    placeholder="/api/static/about/your-video.mp4"
                    onChange={(e) => set({ url: e.target.value })} />
                </Field>
                <Field label="External embed (YouTube / Vimeo URL)" hint="Optional — used if no file URL above.">
                  <input className={inputCls} value={item.video_url || ''}
                    placeholder="https://www.youtube.com/watch?v=…"
                    onChange={(e) => set({ video_url: e.target.value })} />
                </Field>
                <Field label="Poster image URL" hint="Shown before the video plays.">
                  <input className={inputCls} value={item.poster_url || ''}
                    placeholder="/api/static/about/your-poster.jpg"
                    onChange={(e) => set({ poster_url: e.target.value })} />
                </Field>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => vidInput.current?.click()}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-[#18181B] hover:bg-black text-white text-[12.5px] font-semibold transition-colors">
                    <UploadSimple size={14} weight="bold" /> Upload video
                  </button>
                  <button type="button" onClick={() => posterInput.current?.click()}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-[#E4E4E7] text-[#52525B] hover:bg-[#FAFAFA] text-[12.5px] font-semibold transition-colors">
                    <UploadSimple size={14} weight="bold" /> Upload poster
                  </button>
                  <input ref={vidInput} type="file" accept="video/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(idx, 'video', f); }} />
                  <input ref={posterInput} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(idx, 'poster', f); }} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Caption (EN)">
                <input className={inputCls} value={item.caption_en || ''} onChange={(e) => set({ caption_en: e.target.value })} />
              </Field>
              <Field label="Caption (RU)">
                <input className={inputCls} value={item.caption_ru || ''} onChange={(e) => set({ caption_ru: e.target.value })} />
              </Field>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GallerySection({ about, update }) {
  const gallery = about?.gallery || {};
  const items = gallery.items || [];
  const setGallery = (patch) => update('gallery', { ...gallery, ...patch });
  const setItem = (idx, patch) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    setGallery({ items: next });
  };
  const addItem = () => {
    setGallery({
      items: [...items, {
        id: `g-${Date.now()}`, enabled: true, kind: 'image',
        url: '', video_url: '', poster_url: '',
        caption_en: '', caption_ru: '',
        size: 'md', tilt: 0,
      }],
    });
  };
  const removeItem = (idx) => setGallery({ items: items.filter((_, i) => i !== idx) });
  const moveItem = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = items.slice();
    const tmp = next[idx]; next[idx] = next[target]; next[target] = tmp;
    setGallery({ items: next });
  };
  const uploadMedia = async (idx, kind, file) => {
    const maxMb = kind === 'video' ? 50 : 10;
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`File too large (max ${maxMb} MB)`);
      return;
    }
    try {
      const data = await uploadFile({
        url: '/api/admin/site-info/upload-about-media',
        field: 'file', file, params: { kind },
      });
      if (!data?.url) return;
      const patch = kind === 'poster' ? { poster_url: data.url }
                  : kind === 'video'  ? { url: data.url, kind: 'video' }
                  : { url: data.url };
      setItem(idx, patch);
      toast.success(`${kind === 'poster' ? 'Poster' : kind === 'video' ? 'Video' : 'Image'} uploaded`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Upload failed');
    }
  };

  return (
    <div className="space-y-5">
      <Block title="Gallery — Section heading"
        description="Title and bracketed tagline shown above the masonry grid.">
        <label className="flex items-center gap-3 text-[14px] text-[#18181B] mb-4 cursor-pointer">
          <input type="checkbox" checked={gallery.enabled !== false}
            onChange={(e) => setGallery({ enabled: e.target.checked })}
            className="w-4 h-4 accent-[#18181B] cursor-pointer" />
          <span className="font-medium">Show gallery section</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Title (EN)">
            <input className={inputCls} value={gallery.title_en || ''} onChange={(e) => setGallery({ title_en: e.target.value })} />
          </Field>
          <Field label="Title (RU)">
            <input className={inputCls} value={gallery.title_ru || ''} onChange={(e) => setGallery({ title_ru: e.target.value })} />
          </Field>
          <Field label="Tagline (EN)">
            <input className={inputCls} value={gallery.subtitle_en || ''} onChange={(e) => setGallery({ subtitle_en: e.target.value })} />
          </Field>
          <Field label="Tagline (RU)">
            <input className={inputCls} value={gallery.subtitle_ru || ''} onChange={(e) => setGallery({ subtitle_ru: e.target.value })} />
          </Field>
        </div>
      </Block>

      <Block title="Gallery — Media tiles"
        description={`${items.length} tile${items.length === 1 ? '' : 's'}. Drag-free reorder via arrows. Each tile is image or video.`}
        footer={
          <div className="flex items-center justify-between">
            <span>Tip: mix sizes (sm / md / lg / wide / tall) for a dynamic layout.</span>
            <button type="button" onClick={addItem}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md bg-[#18181B] hover:bg-black text-white text-[12px] font-semibold">
              <Plus size={14} weight="bold" /> Add tile
            </button>
          </div>
        }>
        <div className="space-y-3">
          {items.length === 0 && (
            <div className="text-center py-10 text-[#71717A]">
              <ImageIcon size={28} className="mx-auto mb-2" />
              <p className="text-[13px]">No tiles yet — click <strong>Add tile</strong> to create the first one.</p>
            </div>
          )}
          {items.map((it, idx) => (
            <GalleryItemRow
              key={it.id || idx}
              item={it} idx={idx} total={items.length}
              update={setItem}
              remove={removeItem}
              move={moveItem}
              upload={uploadMedia}
            />
          ))}
        </div>
      </Block>
    </div>
  );
}

// ─── Values ─────────────────────────────────────────────────────────────
function ValuesSection({ about, update }) {
  const values = about?.values || {};
  const items = values.items || [];
  const setValues = (patch) => update('values', { ...values, ...patch });
  const setItem = (idx, patch) => setValues({ items: items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) });
  const addItem = () => setValues({ items: [...items, { id: `v-${Date.now()}`, icon: 'ShieldCheck', title_en: '', title_ru: '', desc_en: '', desc_ru: '' }] });
  const removeItem = (idx) => setValues({ items: items.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-5">
      <Block title="Values — Section heading">
        <label className="flex items-center gap-3 text-[14px] text-[#18181B] mb-4 cursor-pointer">
          <input type="checkbox" checked={values.enabled !== false}
            onChange={(e) => setValues({ enabled: e.target.checked })}
            className="w-4 h-4 accent-[#18181B] cursor-pointer" />
          <span className="font-medium">Show values section</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Title (EN)">
            <input className={inputCls} value={values.title_en || ''} onChange={(e) => setValues({ title_en: e.target.value })} />
          </Field>
          <Field label="Title (RU)">
            <input className={inputCls} value={values.title_ru || ''} onChange={(e) => setValues({ title_ru: e.target.value })} />
          </Field>
        </div>
      </Block>

      <Block title="Values — Cards"
        footer={
          <div className="flex items-center justify-end">
            <button type="button" onClick={addItem}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md bg-[#18181B] hover:bg-black text-white text-[12px] font-semibold">
              <Plus size={14} weight="bold" /> Add card
            </button>
          </div>
        }>
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={it.id || idx} className="border border-[#E4E4E7] rounded-xl p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#18181B] text-white text-[11px] font-bold">{idx + 1}</span>
                <button type="button" onClick={() => removeItem(idx)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-md text-red-500 hover:bg-red-50">
                  <Trash size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Icon">
                  <select className={selectCls} value={it.icon || 'ShieldCheck'} onChange={(e) => setItem(idx, { icon: e.target.value })}>
                    {VALUE_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                </Field>
                <div />
                <Field label="Title (EN)">
                  <input className={inputCls} value={it.title_en || ''} onChange={(e) => setItem(idx, { title_en: e.target.value })} />
                </Field>
                <Field label="Title (RU)">
                  <input className={inputCls} value={it.title_ru || ''} onChange={(e) => setItem(idx, { title_ru: e.target.value })} />
                </Field>
                <Field label="Description (EN)">
                  <textarea rows={3} className={textareaCls} value={it.desc_en || ''} onChange={(e) => setItem(idx, { desc_en: e.target.value })} />
                </Field>
                <Field label="Description (RU)">
                  <textarea rows={3} className={textareaCls} value={it.desc_ru || ''} onChange={(e) => setItem(idx, { desc_ru: e.target.value })} />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </Block>
    </div>
  );
}

// ─── CTA ────────────────────────────────────────────────────────────────
function CtaSection({ about, update }) {
  const cta = about?.cta || {};
  const set = (k, v) => update('cta', { ...cta, [k]: v });
  return (
    <Block title="CTA — Headline above the consultation form">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Yellow line (EN)">
          <input className={inputCls} value={cta.title_yellow_en || ''} onChange={(e) => set('title_yellow_en', e.target.value)} />
        </Field>
        <Field label="Yellow line (RU)">
          <input className={inputCls} value={cta.title_yellow_ru || ''} onChange={(e) => set('title_yellow_ru', e.target.value)} />
        </Field>
        <Field label="White line (EN)">
          <input className={inputCls} value={cta.title_white_en || ''} onChange={(e) => set('title_white_en', e.target.value)} />
        </Field>
        <Field label="White line (RU)">
          <input className={inputCls} value={cta.title_white_ru || ''} onChange={(e) => set('title_white_ru', e.target.value)} />
        </Field>
      </div>
    </Block>
  );
}

// ─── Root tabbed editor ─────────────────────────────────────────────────
const SUB_TABS = [
  { id: 'intro',   label: 'Hero copy' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'values',  label: 'Values' },
];

export default function AboutEditor({ data, setData, setDirty }) {
  const [sub, setSub] = useState('intro');
  const about = data?.about || {};
  const update = (key, value) => {
    setData((prev) => ({ ...(prev || {}), about: { ...((prev || {}).about || {}), [key]: value } }));
    setDirty(true);
  };

  return (
    <div className="space-y-5">
      <Block title="About-Us page" description="Public route: /about. Editorial Welcome-style page. Bilingual EN ⇄ RU.">
        <label className="flex items-center gap-3 text-[14px] text-[#18181B] cursor-pointer">
          <input type="checkbox" checked={about.enabled !== false} onChange={(e) => update('enabled', e.target.checked)}
            className="w-4 h-4 accent-[#18181B] cursor-pointer" data-testid="about-enabled" />
          <span className="font-medium">Show the About-Us page</span>
        </label>
      </Block>

      <div className="bg-white border border-[#E4E4E7] rounded-2xl p-2 flex flex-wrap gap-1">
        {SUB_TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => setSub(t.id)}
            data-testid={`about-subtab-${t.id}`}
            className={`px-3.5 h-9 rounded-lg text-[13px] font-semibold transition-colors ${
              sub === t.id ? 'bg-[#18181B] text-white' : 'text-[#52525B] hover:bg-[#FAFAFA]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {sub === 'intro'   && <IntroSection   about={about} update={update} />}
      {sub === 'gallery' && <GallerySection about={about} update={update} />}
      {sub === 'values'  && <ValuesSection  about={about} update={update} />}
    </div>
  );
}
