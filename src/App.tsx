import { useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

type Payment = { id: string; title: string; amount: number; date: string; time: string; note: string; color: string; done: boolean };
type UserRecord = { id: string; display_name: string; email: string; role: 'admin' | 'user'; created_at: string };
type ThemeName = 'lavender' | 'sage' | 'sand' | 'rose' | 'sky';
type Settings = { workspace: string; currency: string; defaultTime: string; weekStart: 'monday' | 'sunday'; accent: string; theme?: ThemeName; mode?: 'light' | 'dark'; avatarPath?: string; backgroundPath?: string };
const palette = ['#9C8CF4', '#F3A77E', '#6DBFA8', '#E6BC59', '#E785A5', '#78A9E8'];
const defaultSettings: Settings = { workspace: 'Mi espacio', currency: 'COP', defaultTime: '09:00', weekStart: 'monday', accent: '#9686e7', theme: 'lavender', mode: 'light' };
const themes: Record<ThemeName, { label: string; background: string; swatch: string }> = { lavender: { label: 'Lavanda', background: '#f6f4fc', swatch: '#dcd4f5' }, sage: { label: 'Salvia', background: '#f0f6f2', swatch: '#cfe4d5' }, sand: { label: 'Arena', background: '#f8f3eb', swatch: '#ead8b8' }, rose: { label: 'Rosa', background: '#fbf1f3', swatch: '#f0d0d8' }, sky: { label: 'Cielo', background: '#eff5fa', swatch: '#c8deef' } };
const today = new Date();
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const sample: Payment[] = [
  { id: 'a', title: 'Arriendo', amount: 1450000, date: iso(new Date(today.getFullYear(), today.getMonth(), 3)), time: '09:00', note: 'Transferir a la cuenta de siempre', color: palette[0], done: true },
  { id: 'b', title: 'Internet', amount: 89000, date: iso(new Date(today.getFullYear(), today.getMonth(), 8)), time: '10:30', note: 'Pagar desde la app', color: palette[2], done: false },
  { id: 'c', title: 'Tarjeta de crédito', amount: 428500, date: iso(new Date(today.getFullYear(), today.getMonth(), 15)), time: '08:00', note: 'Pago mínimo + cuota del computador', color: palette[1], done: false },
  { id: 'd', title: 'Luz y agua', amount: 176200, date: iso(new Date(today.getFullYear(), today.getMonth(), 20)), time: '12:00', note: '', color: palette[3], done: false },
  { id: 'e', title: 'Suscripciones', amount: 54900, date: iso(new Date(today.getFullYear(), today.getMonth(), 26)), time: '09:30', note: 'Música + almacenamiento', color: palette[4], done: false },
];
const money = (n: number, currency = 'COP') => new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
const monthLabel = (d: Date) => new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(d);
const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function usePrivateImage(path: string | undefined, userId: string | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setUrl(null);
    if (!supabase || !userId || !path) return () => { cancelled = true; };
    void supabase.storage.from('profile-media').download(path).then(({ data }) => {
      if (!data || cancelled) return;
      objectUrl = URL.createObjectURL(data);
      setUrl(objectUrl);
    });
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [path, userId]);
  return url;
}

function AuthGate() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMessage('');
    if (!supabase) { setBusy(false); return; }
    try {
      if (mode === 'reset') {
        const redirectTo = new URL(window.location.pathname, window.location.origin).toString();
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        setMessage(error ? 'No se pudo enviar el enlace. Revisa el correo e inténtalo de nuevo.' : 'Si ese correo tiene una cuenta, recibirás un enlace para restablecer la contraseña.');
      } else {
        const result = mode === 'signup' ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
        if (result.error) setMessage(result.error.message);
        else if (mode === 'signup' && !result.data.session) setMessage('Revisa tu correo para confirmar la cuenta y luego inicia sesión.');
      }
    } catch {
      setMessage('No se pudo completar la solicitud. Revisa tu conexión e inténtalo de nuevo.');
    } finally { setBusy(false); }
  };
  return <div className="auth-screen"><form className="auth-card" onSubmit={submit}><div className="brand auth-brand"><span className="brand-icon">f.</span><span>fecha<span className="brand-dot">.</span></span></div><span className="modal-kicker">ESPACIO PERSONAL SEGURO</span><h1>{mode === 'reset' ? 'Recupera tu acceso' : mode === 'signup' ? 'Crea tu cuenta' : 'Qué bueno verte'}<span className="title-period">.</span></h1><p>{mode === 'reset' ? 'Te enviaremos un enlace para que puedas crear una contraseña nueva.' : 'Entra para ver tus pagos y mantenerlos sincronizados en tus dispositivos.'}</p><label className="field-label">Correo electrónico<input autoComplete="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" /></label>{mode !== 'reset' && <label className="field-label">Contraseña<input autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} type="password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Al menos 8 caracteres" /></label>}{message && <div className="auth-message" role="status">{message}</div>}<button className="save-button auth-submit" disabled={busy}>{busy ? 'Un momento…' : mode === 'reset' ? 'Enviar enlace de recuperación →' : mode === 'signup' ? 'Crear cuenta →' : 'Iniciar sesión →'}</button>{mode === 'signin' && <button type="button" className="auth-switch forgot-link" onClick={() => { setMode('reset'); setMessage(''); }}>¿Olvidaste tu contraseña?</button>}<button type="button" className="auth-switch" onClick={() => { setMode(mode === 'reset' ? 'signin' : mode === 'signup' ? 'signin' : 'signup'); setMessage(''); }}>{mode === 'reset' ? 'Volver a iniciar sesión' : mode === 'signup' ? 'Ya tengo cuenta · Iniciar sesión' : '¿Primera vez? Crear una cuenta'}</button><div className="auth-privacy">Tus pagos son privados y solo tú puedes acceder a ellos.</div></form></div>;
}

function PasswordRecoveryGate({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage('');
    if (password.length < 8) { setMessage('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (password !== confirmation) { setMessage('Las contraseñas no coinciden.'); return; }
    if (!supabase) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setMessage('No se pudo actualizar la contraseña. Solicita un nuevo enlace e inténtalo otra vez.');
      else { setCompleted(true); setMessage('Tu contraseña se actualizó correctamente.'); }
    } catch {
      setMessage('No se pudo actualizar la contraseña. Revisa tu conexión e inténtalo de nuevo.');
    } finally { setBusy(false); }
  };
  return <div className="auth-screen"><form className="auth-card" onSubmit={submit}><div className="brand auth-brand"><span className="brand-icon">f.</span><span>fecha<span className="brand-dot">.</span></span></div><span className="modal-kicker">RECUPERACIÓN SEGURA</span><h1>Contraseña nueva<span className="title-period">.</span></h1><p>Elige una contraseña de al menos 8 caracteres para volver a entrar.</p>{!completed && <><label className="field-label">Nueva contraseña<input autoComplete="new-password" type="password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} placeholder="Al menos 8 caracteres" /></label><label className="field-label">Confirma la contraseña<input autoComplete="new-password" type="password" minLength={8} required value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder="Escríbela de nuevo" /></label></>}{message && <div className="auth-message" role="status">{message}</div>}{completed ? <button type="button" className="save-button auth-submit" onClick={onDone}>Ir a mi calendario →</button> : <button className="save-button auth-submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar contraseña →'}</button>}</form></div>;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [role, setRole] = useState<'admin' | 'user'>('admin');
  const [settings, setSettings] = useState<Settings>(() => { try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem('fecha-settings') || '{}') as Partial<Settings> }; } catch { return defaultSettings; } });
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaMessage, setMediaMessage] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<'calendar' | 'upcoming' | 'admin' | 'users' | 'account'>('calendar');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [payments, setPayments] = useState<Payment[]>(() => {
    try { const stored = localStorage.getItem('fecha-payments'); return stored ? JSON.parse(stored) as Payment[] : sample; } catch { return sample; }
  });
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(iso(today));
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [dragged, setDragged] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', amount: '', date: iso(today), time: '09:00', note: '', color: palette[0] });
  const avatarUrl = usePrivateImage(settings.avatarPath, session?.user.id);
  const backgroundUrl = usePrivateImage(settings.backgroundPath, session?.user.id);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    client.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    const { data } = client.auth.onAuthStateChange((event, currentSession) => { setSession(currentSession); setAuthReady(true); if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (view !== 'calendar') setView('calendar');
        window.setTimeout(() => searchRef.current?.focus(), 0);
      }
      if (event.key === 'Escape') setNotificationsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [view]);

  useEffect(() => {
    const client = supabase;
    if (!client || !session?.user) return;
    const userId = session.user.id;
    const loadCloud = async () => {
      const { data: profile } = await client.from('profiles').select('display_name, role, settings').eq('id', userId).maybeSingle();
      if (profile) {
        setRole(profile.role === 'admin' ? 'admin' : 'user');
        updateSettings({ ...defaultSettings, ...(profile.settings as Partial<Settings>), workspace: profile.display_name || (profile.settings as Settings)?.workspace || 'Mi espacio' });
      } else {
        setRole('user');
        await client.from('profiles').insert({ id: userId, display_name: settings.workspace, settings });
      }
      const { data: rows } = await client.from('payments').select('*').eq('user_id', userId).order('date').order('time');
      if (rows?.length) setPayments(rows.map(row => ({ id: row.id, title: row.title, amount: Number(row.amount), date: row.date, time: String(row.time).slice(0, 5), note: row.note, color: row.color, done: row.done })));
      else {
        const old = localStorage.getItem('fecha-payments');
        const legacy = old ? JSON.parse(old) as Payment[] : payments;
        if (legacy.length) {
          const migrated = legacy.map(payment => ({ title: payment.title, amount: payment.amount, date: payment.date, time: payment.time, note: payment.note, color: payment.color, done: payment.done, user_id: userId }));
          const { data: inserted } = await client.from('payments').insert(migrated).select();
          if (inserted?.length) setPayments(inserted.map(row => ({ id: row.id, title: row.title, amount: Number(row.amount), date: row.date, time: String(row.time).slice(0, 5), note: row.note, color: row.color, done: row.done })));
        }
      }
    };
    void loadCloud();
    const channel = client.channel(`sync-${userId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: `user_id=eq.${userId}` }, async () => {
      const { data } = await client.from('payments').select('*').eq('user_id', userId).order('date').order('time');
      if (data) {
        const synced = data.map(row => ({ id: row.id, title: row.title, amount: Number(row.amount), date: row.date, time: String(row.time).slice(0, 5), note: row.note, color: row.color, done: row.done }));
        setPayments(current => !synced.length && current.length > 0 ? current : synced);
      }
    }).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, event => {
      const profile = event.new as { role?: string; display_name?: string; settings?: Partial<Settings> };
      if (profile.role) setRole(profile.role === 'admin' ? 'admin' : 'user');
      if (profile.settings) setSettings({ ...defaultSettings, ...profile.settings, workspace: profile.display_name || profile.settings.workspace || 'Mi espacio' });
    }).subscribe();
    return () => { void client.removeChannel(channel); };
  // Cloud data is loaded once for each authenticated user; settings are captured for first-time profile creation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  useEffect(() => {
    const client = supabase;
    if (!client || role !== 'admin' || view !== 'users') return;
    let cancelled = false;
    setUsersLoading(true);
    setUsersError('');
    void client.rpc('admin_list_users').then(({ data, error }) => {
      if (cancelled) return;
      if (error) setUsersError('No se pudo cargar la lista. Comprueba que la función admin_list_users esté instalada en Supabase.');
      else setUsers((data || []) as UserRecord[]);
      setUsersLoading(false);
    });
    return () => { cancelled = true; };
  }, [role, view]);

  useEffect(() => {
    const client = supabase;
    const userId = session?.user.id;
    if (!client || !userId || (view !== 'calendar' && view !== 'upcoming')) return;
    let cancelled = false;
    void client.from('payments').select('*').eq('user_id', userId).order('date').order('time').then(({ data }) => {
      if (!cancelled && data?.length) setPayments(data.map(row => ({ id: row.id, title: row.title, amount: Number(row.amount), date: row.date, time: String(row.time).slice(0, 5), note: row.note, color: row.color, done: row.done })));
    });
    return () => { cancelled = true; };
  }, [session?.user.id, view]);

  const save = (next: Payment[]) => { setPayments(next); localStorage.setItem('fecha-payments', JSON.stringify(next)); if (supabase && session?.user) void supabase.from('payments').upsert(next.map(payment => ({ ...payment, user_id: session.user.id }))); };
  const updateSettings = (next: Settings) => { setSettings(next); localStorage.setItem('fecha-settings', JSON.stringify(next)); document.documentElement.style.setProperty('--accent', next.accent); if (supabase && session?.user) void supabase.from('profiles').update({ display_name: next.workspace, settings: next }).eq('id', session.user.id); };
  const uploadMedia = async (kind: 'avatar' | 'background', file?: File) => {
    if (!file) return;
    if (!supabase || !session?.user.id) { setMediaMessage('Inicia sesión para guardar imágenes en tu cuenta.'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setMediaMessage('Usa una imagen JPG, PNG o WebP.'); return; }
    if (file.size > 5 * 1024 * 1024) { setMediaMessage('La imagen debe pesar menos de 5 MB.'); return; }
    setMediaBusy(true); setMediaMessage('');
    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
    const path = `${session.user.id}/${kind}-${crypto.randomUUID()}.${extension}`;
    const previousPath = kind === 'avatar' ? settings.avatarPath : settings.backgroundPath;
    const { data, error } = await supabase.storage.from('profile-media').upload(path, file, { contentType: file.type, cacheControl: '3600', upsert: false });
    if (error) setMediaMessage(`No se pudo guardar la imagen: ${error.message}`);
    else {
      updateSettings({ ...settings, [kind === 'avatar' ? 'avatarPath' : 'backgroundPath']: data.path });
      if (previousPath) void supabase.storage.from('profile-media').remove([previousPath]);
      setMediaMessage(kind === 'avatar' ? 'Foto de perfil actualizada.' : 'Fondo actualizado.');
    }
    setMediaBusy(false);
  };
  const updateUserRole = async (userId: string, nextRole: UserRecord['role']) => {
    if (!supabase || userId === session?.user.id) return;
    setSavingUserId(userId);
    const { error } = await supabase.rpc('admin_set_user_role', { target_user_id: userId, target_role: nextRole });
    if (error) setUsersError(`No se pudo cambiar el rol: ${error.message}`);
    else setUsers(current => current.map(user => user.id === userId ? { ...user, role: nextRole } : user));
    setSavingUserId(null);
  };
  const monthPayments = payments.filter(p => p.date.startsWith(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`));
  const visible = monthPayments.filter(p => !query || p.title.toLowerCase().includes(query.toLowerCase()) || p.note.toLowerCase().includes(query.toLowerCase()));
  const total = monthPayments.reduce((sum, p) => sum + p.amount, 0);
  const pending = monthPayments.filter(p => !p.done).reduce((sum, p) => sum + p.amount, 0);
  const completed = monthPayments.filter(p => p.done).length;
  const upcoming = useMemo(() => payments.filter(p => !p.done && p.date >= iso(today)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).slice(0, 4), [payments]);
  const firstOffset = settings.weekStart === 'monday' ? (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7 : new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(firstOffset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const byDate = (date: string) => visible.filter(p => p.date === date).sort((a, b) => a.time.localeCompare(b.time));
  const orderedWeekdays = settings.weekStart === 'monday' ? weekdays : [...weekdays.slice(6), ...weekdays.slice(0, 6)];

  const openNew = (date = selected) => { setEditing(null); setForm({ title: '', amount: '', date, time: settings.defaultTime, note: '', color: palette[Math.floor(Math.random() * palette.length)] }); setModal(true); };
  const openEdit = (p: Payment) => { setEditing(p); setForm({ title: p.title, amount: String(p.amount), date: p.date, time: p.time, note: p.note, color: p.color }); setModal(true); };
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!form.title.trim() || Number(form.amount) <= 0) return; const next = editing ? payments.map(p => p.id === editing.id ? { ...p, ...form, title: form.title.trim(), amount: Number(form.amount) } : p) : [...payments, { ...form, id: crypto.randomUUID(), title: form.title.trim(), amount: Number(form.amount), done: false }]; save(next); setSelected(form.date); setMonth(new Date(`${form.date}T12:00:00`)); setModal(false); };
  const toggleDone = (id: string) => save(payments.map(p => p.id === id ? { ...p, done: !p.done } : p));
  const remove = (id: string) => { save(payments.filter(p => p.id !== id)); if (supabase && session?.user) void supabase.from('payments').delete().eq('id', id).eq('user_id', session.user.id); setModal(false); };
  const movePayment = (date: string) => { if (!dragged) return; save(payments.map(p => p.id === dragged ? { ...p, date } : p)); setDragged(null); setSelected(date); };
  const moveMonth = (offset: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1));

  const exportBackup = () => { const blob = new Blob([JSON.stringify({ payments, settings }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'fecha-respaldo.json'; link.click(); URL.revokeObjectURL(url); };
  if (!authReady) return <div className="auth-screen"><div className="auth-card">Cargando tu espacio seguro…</div></div>;
  if (passwordRecovery) return <PasswordRecoveryGate onDone={() => setPasswordRecovery(false)} />;
  if (supabase && !session) return <AuthGate />;
  const activeView = view === 'account' || view === 'calendar' || view === 'upcoming' || role === 'admin' ? view : 'calendar';
  const goToPayment = (payment: Payment) => { setView('calendar'); setSelected(payment.date); setMonth(new Date(`${payment.date}T12:00:00`)); };
  const notifications = payments.filter(p => !p.done && p.date >= iso(today) && p.date <= iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7))).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return <div className={`app-shell theme-${settings.theme || 'lavender'} mode-${settings.mode || 'light'}`} style={{ '--accent': settings.accent, '--theme-background': themes[settings.theme || 'lavender'].background, backgroundImage: backgroundUrl ? `linear-gradient(${settings.mode === 'dark' ? 'rgba(20,21,27,.72), rgba(20,21,27,.82)' : 'rgba(255,255,255,.42), rgba(255,255,255,.58)'}), url("${backgroundUrl}")` : undefined } as React.CSSProperties}>
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brand-icon">f.</span><span>fecha<span className="brand-dot">.</span></span></a>
      <div className="side-section"><div className="side-label">TU ESPACIO</div><button className={`nav-item ${activeView === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}><span className="nav-icon">▦</span> Calendario <span className="nav-count">{monthPayments.length}</span></button><button className={`nav-item ${activeView === 'upcoming' ? 'active' : ''}`} onClick={() => setView('upcoming')}><span className="nav-icon">◷</span> Próximos pagos</button>{role === 'admin' && <><button className={`nav-item ${activeView === 'admin' ? 'active' : ''}`} onClick={() => setView('admin')}><span className="nav-icon">⚙</span> Administración</button><button className={`nav-item ${activeView === 'users' ? 'active' : ''}`} onClick={() => setView('users')}><span className="nav-icon">♙</span> Usuarios</button></>}</div>
      <div className="side-month"><div className="side-label">ESTE MES</div><div className="budget-card"><div className="budget-top"><span>Pagos del mes</span><span className="budget-spark">↗</span></div><div className="budget-total">{money(total, settings.currency)}</div><div className="budget-track"><span style={{ width: `${total ? Math.max(4, completed / monthPayments.length * 100) : 0}%` }} /></div><div className="budget-foot"><span>{completed} de {monthPayments.length} completados</span><span>{total ? Math.round(completed / monthPayments.length * 100) : 0}%</span></div></div></div>
      <div className="side-upcoming"><div className="side-label">LO QUE VIENE <span className="mini-arrow">↗</span></div>{upcoming.length ? upcoming.map(p => <button className="upcoming-item" key={p.id} onClick={() => goToPayment(p)}><span className="upcoming-mark" style={{ background: p.color }} /><span className="upcoming-copy"><strong>{p.title}</strong><small>{new Date(`${p.date}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} · {p.time}</small></span><span className="upcoming-amount">{money(p.amount, settings.currency).replace(',00', '')}</span></button>) : <p className="empty-upcoming">Todo al día por ahora ✨</p>}</div>
      <button className="sidebar-bottom profile-button" onClick={() => setView('account')}><div className="avatar">{avatarUrl ? <img src={avatarUrl} alt="" /> : (session?.user.email?.slice(0, 1) || settings.workspace.slice(0, 1)).toUpperCase()}</div><div className="user-copy"><strong>{session?.user.email || settings.workspace}</strong><small>{role === 'admin' ? 'Administrador' : 'Mi cuenta'}</small></div><span className="more-btn">⚙</span></button>
    </aside>

    <main className="main-content"><header className="topbar"><div className="breadcrumb">{settings.workspace} <span>/</span> <strong>{activeView === 'admin' ? 'Administración' : activeView === 'users' ? 'Usuarios' : activeView === 'upcoming' ? 'Próximos pagos' : activeView === 'account' ? 'Mi cuenta' : 'Calendario'}</strong></div><div className="top-actions"><button className="theme-toggle" aria-label={settings.mode === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'} aria-pressed={settings.mode === 'dark'} title={settings.mode === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} onClick={() => updateSettings({ ...settings, mode: settings.mode === 'dark' ? 'light' : 'dark' })}><span aria-hidden="true">{settings.mode === 'dark' ? '☀' : '☾'}</span><span className="theme-toggle-label">{settings.mode === 'dark' ? 'Claro' : 'Oscuro'}</span></button>{activeView === 'calendar' && <><label className="search-box"><span>⌕</span><input ref={searchRef} placeholder="Buscar pagos..." value={query} onChange={e => setQuery(e.target.value)} /><kbd>⌘ K</kbd></label><div className="notification-wrap"><button className="icon-button" aria-label="Notificaciones" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(value => !value)}>♧{notifications.length > 0 && <i />}</button>{notificationsOpen && <div className="notification-popover"><strong>Pagos próximos</strong>{notifications.length ? notifications.map(p => <button key={p.id} onClick={() => { goToPayment(p); setNotificationsOpen(false); }}><span className="upcoming-mark" style={{ background: p.color }} /><span>{p.title}<small>{new Date(`${p.date}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} · {p.time}</small></span></button>) : <p>No tienes pagos en los próximos 7 días.</p>}</div>}</div><button className="add-button" onClick={() => openNew()}>＋ <span>Nuevo pago</span></button></>}</div></header>
      {activeView === 'admin' ? <div className="page-wrap admin-page"><div className="admin-intro"><div><div className="eyebrow"><span className="live-dot" /> PANEL PRIVADO</div><h1>Administración<span className="title-period">.</span></h1><p className="welcome-sub">Personaliza tu espacio y mantén tus datos bajo control.</p></div><span className="admin-badge">⚿ ADMIN</span></div><div className="admin-grid"><section className="settings-card"><div className="settings-card-title"><span className="settings-icon">◉</span><div><h2>Tu espacio</h2><p>El nombre que aparece en tu calendario.</p></div></div><label className="field-label">Nombre del espacio<input value={settings.workspace} maxLength={32} onChange={e => updateSettings({ ...settings, workspace: e.target.value })} /></label><label className="field-label">Moneda principal<select value={settings.currency} onChange={e => updateSettings({ ...settings, currency: e.target.value })}><option value="COP">Peso colombiano · COP</option><option value="USD">Dólar estadounidense · USD</option><option value="MXN">Peso mexicano · MXN</option><option value="EUR">Euro · EUR</option><option value="CLP">Peso chileno · CLP</option><option value="ARS">Peso argentino · ARS</option></select></label><div className="form-row"><label className="field-label">Hora predeterminada<input type="time" value={settings.defaultTime} onChange={e => updateSettings({ ...settings, defaultTime: e.target.value })} /></label><label className="field-label">La semana empieza<select value={settings.weekStart} onChange={e => updateSettings({ ...settings, weekStart: e.target.value as Settings['weekStart'] })}><option value="monday">Lunes</option><option value="sunday">Domingo</option></select></label></div><div className="field-label">Color de acento<div className="color-options">{palette.map(c => <button type="button" key={c} aria-label={`Elegir color ${c}`} className={`color-swatch ${settings.accent.toLowerCase() === c.toLowerCase() ? 'chosen' : ''}`} style={{ background: c }} onClick={() => updateSettings({ ...settings, accent: c })}>{settings.accent.toLowerCase() === c.toLowerCase() && '✓'}</button>)}</div></div></section><section className="settings-card account-card"><div className="settings-card-title"><span className="settings-icon mint">♙</span><div><h2>Cuenta de administrador</h2><p>Sesión privada y datos sincronizados.</p></div></div><div className="account-email"><span className="avatar">{session?.user.email?.slice(0, 1).toUpperCase() || 'M'}</span><div><strong>{session?.user.email || 'Administrador local'}</strong><small>Propietario del espacio · Admin</small></div></div><div className="security-note"><span>✓</span><p>Solo las cuentas autorizadas acceden a sus pagos. Tus cambios se guardan y sincronizan automáticamente.</p></div>{supabase && <button className="signout-button" onClick={() => { if (supabase) void supabase.auth.signOut(); }}>Cerrar sesión <span>↗</span></button>}<button className="backup-button" onClick={exportBackup}>Descargar copia de seguridad <span>↓</span></button></section></div><section className="settings-card payment-manager"><div className="calendar-header"><div><h2>Gestionar pagos</h2><p>{payments.length} pagos en tu espacio · selecciona uno para editarlo.</p></div><button className="calendar-add" onClick={() => openNew()}>＋ Nuevo pago</button></div><div className="payment-list">{payments.length ? [...payments].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).map(p => <div className="payment-row" key={p.id}><span className="upcoming-mark" style={{ background: p.color }} /><div className="payment-row-name"><strong>{p.title}</strong><small>{new Date(`${p.date}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })} · {p.time}</small></div><span className="payment-row-amount">{money(p.amount, settings.currency)}</span><button className={`payment-status ${p.done ? 'is-done' : ''}`} onClick={() => toggleDone(p.id)}>{p.done ? '✓ Listo' : 'Pendiente'}</button><button className="edit-payment" onClick={() => openEdit(p)}>Editar</button></div>) : <p className="empty-upcoming">Aún no tienes pagos. Agrega el primero para comenzar.</p>}</div></section><p className="admin-footnote">Tu configuración y pagos se guardan de forma segura en tu cuenta.</p></div> : activeView === 'users' ? <div className="page-wrap admin-page"><div className="admin-intro"><div><div className="eyebrow"><span className="live-dot" /> PANEL PRIVADO</div><h1>Usuarios<span className="title-period">.</span></h1><p className="welcome-sub">Cuentas registradas. Los pagos de cada persona siguen siendo privados.</p></div><span className="admin-badge">{users.length} CUENTAS</span></div><section className="settings-card users-manager"><div className="calendar-header"><div><h2>Directorio de cuentas</h2><p>Espacios que ya iniciaron sesión en la app.</p></div><label className="users-search"><span>⌕</span><input aria-label="Buscar usuarios" placeholder="Buscar espacio..." value={userSearch} onChange={e => setUserSearch(e.target.value)} /></label></div>{usersError && <p className="user-list-message error-message">{usersError}</p>}{usersLoading ? <p className="user-list-message">Cargando cuentas…</p> : usersError ? null : <div className="user-directory">{users.filter(user => `${user.display_name} ${user.email}`.toLowerCase().includes(userSearch.toLowerCase())).map(user => <div className="user-directory-row" key={user.id}><span className="avatar">{user.display_name.slice(0, 1).toUpperCase() || 'U'}</span><div className="user-directory-copy"><strong>{user.display_name}</strong><small>{user.email}</small><small>Cuenta creada {new Date(user.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</small></div><select className="user-role-select" aria-label={`Rol de ${user.email}`} value={user.role} disabled={savingUserId === user.id || user.id === session?.user.id} onChange={event => void updateUserRole(user.id, event.target.value as UserRecord['role'])}><option value="user">Usuario</option><option value="admin">Administrador</option></select>{user.id === session?.user.id && <span className="self-role-note">Tu cuenta</span>}</div>)}{users.length === 0 && <p className="user-list-message">Aún no hay cuentas que hayan iniciado sesión.</p>}{users.length > 0 && users.filter(user => `${user.display_name} ${user.email}`.toLowerCase().includes(userSearch.toLowerCase())).length === 0 && <p className="user-list-message">No hay cuentas que coincidan con la búsqueda.</p>}</div>}</section><p className="admin-footnote">El directorio no permite consultar pagos ni datos privados de otras cuentas.</p></div> : activeView === 'upcoming' ? <div className="page-wrap admin-page"><div className="admin-intro"><div><div className="eyebrow"><span className="live-dot" /> PAGOS PENDIENTES</div><h1>Próximos pagos<span className="title-period">.</span></h1><p className="welcome-sub">Tus pagos por fecha y hora. Selecciona uno para editarlo.</p></div><span className="admin-badge">{payments.filter(p => !p.done && p.date >= iso(today)).length} PENDIENTES</span></div><section className="settings-card payment-manager"><div className="payment-list">{payments.filter(p => !p.done && p.date >= iso(today)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).map(p => <div className="payment-row" key={p.id}><span className="upcoming-mark" style={{ background: p.color }} /><button className="payment-row-name upcoming-link" onClick={() => openEdit(p)}><strong>{p.title}</strong><small>{new Date(`${p.date}T12:00:00`).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {p.time}</small></button><span className="payment-row-amount">{money(p.amount, settings.currency)}</span><button className="payment-status" onClick={() => toggleDone(p.id)}>Pendiente</button><button className="edit-payment" onClick={() => goToPayment(p)}>Ver día</button></div>)}{payments.filter(p => !p.done && p.date >= iso(today)).length === 0 && <p className="empty-upcoming">No tienes pagos pendientes. ¡Todo al día! ✨</p>}</div></section></div>
  : activeView === 'account' ? <div className="page-wrap admin-page"><div className="admin-intro"><div><div className="eyebrow"><span className="live-dot" /> CUENTA PERSONAL</div><h1>Mi cuenta<span className="title-period">.</span></h1><p className="welcome-sub">Administra tu perfil, apariencia y sesión.</p></div><span className="admin-badge">{role === 'admin' ? 'ADMIN' : 'USUARIO'}</span></div><section className="settings-card account-card account-page-card"><div className="settings-card-title"><span className="settings-icon mint">♙</span><div><h2>Tu perfil</h2><p>Personaliza cómo se ve tu cuenta.</p></div></div><div className="account-email"><div className="avatar profile-avatar">{avatarUrl ? <img src={avatarUrl} alt="Foto de perfil" /> : session?.user.email?.slice(0, 1).toUpperCase() || 'M'}</div><div><strong>{session?.user.email || 'Cuenta local'}</strong><small>{role === 'admin' ? 'Administrador' : 'Usuario'}</small></div></div><input ref={avatarInputRef} className="visually-hidden-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { void uploadMedia('avatar', event.target.files?.[0]); event.currentTarget.value = ''; }} /><button className="backup-button" disabled={mediaBusy} onClick={() => avatarInputRef.current?.click()}>{mediaBusy ? 'Guardando imagen…' : avatarUrl ? 'Cambiar foto de perfil' : 'Agregar foto de perfil'} <span>＋</span></button>{mediaMessage && <p className="media-message" role="status">{mediaMessage}</p>}<div className="security-note"><span>✓</span><p>Tus pagos son privados. Los cambios se sincronizan automáticamente en tus dispositivos.</p></div><button className="backup-button" onClick={exportBackup}>Descargar copia de seguridad <span>↓</span></button>{supabase && <button className="signout-button" onClick={() => { if (supabase) void supabase.auth.signOut(); }}>Cerrar sesión <span>↗</span></button>}</section><section className="settings-card appearance-card"><div className="settings-card-title"><span className="settings-icon">✦</span><div><h2>Apariencia</h2><p>Elige un tema o usa una imagen como fondo.</p></div></div><div className="theme-picker" role="group" aria-label="Tema de fondo">{Object.entries(themes).map(([name, theme]) => <button key={name} className={`theme-choice ${settings.theme === name ? 'selected' : ''}`} onClick={() => updateSettings({ ...settings, theme: name as ThemeName })}><span className="theme-swatch" style={{ background: theme.swatch }} />{theme.label}{settings.theme === name && <span className="theme-check">✓</span>}</button>)}</div><input ref={backgroundInputRef} className="visually-hidden-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { void uploadMedia('background', event.target.files?.[0]); event.currentTarget.value = ''; }} /><div className="background-actions"><button className="backup-button" disabled={mediaBusy} onClick={() => backgroundInputRef.current?.click()}>{mediaBusy ? 'Guardando imagen…' : backgroundUrl ? 'Cambiar imagen de fondo' : 'Subir imagen de fondo'} <span>＋</span></button>{settings.backgroundPath && <button className="edit-payment" onClick={() => { updateSettings({ ...settings, backgroundPath: undefined }); setMediaMessage('Se quitó la imagen de fondo.'); }}>Usar solo el tema</button>}</div><p className="media-help">Imágenes JPG, PNG o WebP de hasta 5 MB. Tus imágenes son privadas y solo tu cuenta puede consultarlas.</p></section></div>
 : <div className="page-wrap"><div className="welcome-row"><div><div className="eyebrow"><span className="live-dot" /> TU DINERO, EN ORDEN</div><h1>Tu calendario<span className="title-period">.</span></h1><p className="welcome-sub">Cada pago en su lugar. Un poco más de tranquilidad.</p></div><div className="month-switcher"><button onClick={() => moveMonth(-1)} aria-label="Mes anterior">‹</button><span>{monthLabel(month)}</span><button onClick={() => moveMonth(1)} aria-label="Mes siguiente">›</button><button className="today-button" onClick={() => { setMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setSelected(iso(today)); }}>Hoy</button></div></div>
      <div className="stats-row"><div className="stat-card"><div className="stat-heading"><span>PROGRAMADO ESTE MES</span><span className="stat-icon purple">↗</span></div><div className="stat-value">{money(total, settings.currency)}</div><div className="stat-note">En {monthPayments.length} pagos <span>·</span> {monthLabel(month)}</div></div><div className="stat-card"><div className="stat-heading"><span>POR PAGAR</span><span className="stat-icon peach">◷</span></div><div className="stat-value">{money(pending, settings.currency)}</div><div className="stat-note"><span className="note-dot" /> {monthPayments.length - completed} pagos pendientes</div></div><div className="stat-card progress-stat"><div className="stat-heading"><span>PROGRESO DEL MES</span><span className="stat-icon mint">✓</span></div><div className="stat-value">{completed}<span className="stat-denom"> / {monthPayments.length}</span></div><div className="progress-track"><span style={{ width: `${monthPayments.length ? completed / monthPayments.length * 100 : 0}%` }} /></div></div></div>
      <section className="calendar-card"><div className="calendar-header"><div><h2>Calendario de pagos</h2><p>Arrastra un pago a otro día para reprogramarlo</p></div><button className="calendar-add" onClick={() => openNew(selected)}>＋ <span>Agregar pago</span></button></div><div className="weekdays">{orderedWeekdays.map((w, i) => <div key={w} className={settings.weekStart === 'monday' ? i > 4 ? 'weekend' : '' : i === 0 || i === 6 ? 'weekend' : ''}>{w}</div>)}</div><div className="calendar-grid">{cells.map((day, i) => { if (!day) return <div className="day-cell blank" key={`blank-${i}`} />; const date = iso(new Date(month.getFullYear(), month.getMonth(), day)); const events = byDate(date); const isToday = date === iso(today); const isSelected = date === selected; const weekdayIndex = i % 7; return <div key={date} className={`day-cell ${(settings.weekStart === 'monday' ? weekdayIndex > 4 : weekdayIndex === 0 || weekdayIndex === 6) ? 'weekend' : ''} ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`} onClick={() => setSelected(date)} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); movePayment(date); }}><div className="day-number"><span>{day}</span>{events.length > 0 && <span className="event-count">{events.length}</span>}</div>{events.slice(0, 2).map(p => <button key={p.id} draggable onDragStart={e => { e.stopPropagation(); setDragged(p.id); }} onDragEnd={() => setDragged(null)} onClick={e => { e.stopPropagation(); setSelected(date); openEdit(p); }} className={`event-chip ${p.done ? 'is-done' : ''}`} style={{ '--event-color': p.color, '--event-tint': `${p.color}20` } as React.CSSProperties} title={`${p.title} · ${money(p.amount, settings.currency)}`}><span className="event-time">{p.time}</span><span className="event-name">{p.title}</span></button>)}{events.length > 2 && <div className="more-events">+{events.length - 2} más</div>}</div>; })}</div><div className="calendar-legend"><span><i className="legend-dot purple-dot" /> Por pagar</span><span><i className="legend-dot green-dot" /> Completado</span><span className="legend-hint">✳ Tus pagos se guardan automáticamente</span></div></section>
      <footer className="page-footer"><span>Un día a la vez. Vas muy bien.</span><span>HECHO PARA SENTIRTE EN CONTROL <span className="footer-heart">♥</span></span></footer></div>}
    </main>
    {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false); }}><form className="payment-modal" onSubmit={submit}><div className="modal-top"><div><span className="modal-kicker">{editing ? 'EDITAR RECORDATORIO' : 'NUEVO RECORDATORIO'}</span><h2>{editing ? 'Edita tu pago' : 'Programa un pago'}<span className="title-period">.</span></h2></div><button type="button" className="close-button" onClick={() => setModal(false)}>×</button></div><label className="field-label">¿Qué tienes que pagar?<input autoFocus required placeholder="Ej. Arriendo, internet..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label><div className="form-row"><label className="field-label">Valor del pago<div className="input-prefix"><span>$</span><input required min="1" type="number" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div></label><label className="field-label">Hora<input required type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></label></div><label className="field-label">Fecha de pago<input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label><label className="field-label">Una nota para ti <span className="optional">OPCIONAL</span><textarea rows={3} placeholder="Detalles, cuenta, o algo que no quieras olvidar..." value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></label><div className="field-label color-label">Elige un color<div className="color-options">{palette.map(c => <button type="button" key={c} className={`color-swatch ${form.color === c ? 'chosen' : ''}`} style={{ background: c }} aria-label={`Color ${c}`} onClick={() => setForm({ ...form, color: c })}>{form.color === c && '✓'}</button>)}</div></div><div className="modal-actions">{editing && <button type="button" className="delete-button" onClick={() => remove(editing.id)}>Eliminar pago</button>}{editing && <button type="button" className={`done-button ${editing.done ? 'done' : ''}`} onClick={() => { toggleDone(editing.id); setModal(false); }}>{editing.done ? '✓ Completado' : 'Marcar listo'}</button>}<button className="save-button" type="submit">{editing ? 'Guardar cambios' : 'Guardar pago'} <span>→</span></button></div></form></div>}
  </div>;
}

export default App;
