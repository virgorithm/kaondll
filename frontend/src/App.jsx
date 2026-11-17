import { useCallback, useEffect, useMemo, useState } from 'react'
import { Archive, ArrowRight, BarChart3, Check, ChevronDown, Clock3, Eye, EyeOff, Heart, ImagePlus, LogOut, MapPin, MessageSquareText, Minus, MousePointer2, Plus, Search, ShoppingBag, SlidersHorizontal, Star, UserRound, Utensils, X } from 'lucide-react'

const starterMenu = [
  { id: 1, name: 'Chicken Inasal', description: 'Grilled chicken, garlic rice, atchara', price: 95, category: 'Meals', emoji: '🍗', color: 'peach', popular: true },
  { id: 2, name: 'Pork Sisig Bowl', description: 'Sizzling sisig with egg and rice', price: 89, category: 'Meals', emoji: '🍳', color: 'yellow', popular: true },
  { id: 3, name: 'Sinigang na Baboy', description: 'Tamarind broth, pork, fresh veg', price: 85, category: 'Meals', emoji: '🍲', color: 'green' },
  { id: 4, name: 'Pancit Canton', description: 'Wok-tossed noodles, veggies, calamansi', price: 65, category: 'Snacks', emoji: '🍜', color: 'pink' },
  { id: 5, name: 'Turon', description: 'Crispy banana roll with langka', price: 20, category: 'Snacks', emoji: '🍌', color: 'yellow' },
  { id: 6, name: 'Iced Calamansi', description: 'Fresh-squeezed, lightly sweetened', price: 25, category: 'Drinks', emoji: '🍋', color: 'green' },
  { id: 7, name: 'Ube Milk Tea', description: 'Creamy ube with chewy pearls', price: 55, category: 'Drinks', emoji: '🧋', color: 'lavender' },
  { id: 8, name: 'Pandesal Duo', description: 'Warm, soft pandesal (2 pcs)', price: 18, category: 'Snacks', emoji: '🥖', color: 'peach' },
]
const categories = ['Meals', 'Snacks', 'Drinks', 'Milk Tea']
const mealAddOns = [{ id: 'extra_rice', name: 'Extra rice', price: 15 }]
const friesAddOns = [{ id: 'fries_cheese', name: 'Cheese powder', price: 10 }, { id: 'fries_bbq', name: 'BBQ powder', price: 10 }, { id: 'fries_sour_cream', name: 'Sour cream powder', price: 10 }]
const addOnsForItem = item => (item.name.toLowerCase().includes('fries') ? friesAddOns : item.category === 'Meals' ? mealAddOns : [])
const API_BASE = `${(import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')}/api`
const resolveImageUrl = image => {
  if (!image) return image
  const url = new URL(image, window.location.origin)
  const mediaPath = url.pathname.indexOf('/media/')
  return mediaPath >= 0 ? url.pathname.slice(mediaPath) : image
}
const emptyMenuItem = { name: '', description: '', price: '', category: 'Meals', image: null, imagePreview: '', imageFile: null, available: true, popular: false }
const manilaDateFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' })
const manilaDateKey = value => {
  const parts = Object.fromEntries(manilaDateFormatter.formatToParts(new Date(value)).map(part => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}
const formatCanteenTime = value => {
  if (!value) return ''
  const [hourText, minuteText] = value.split(':')
  const hour = Number(hourText)
  return `${hour % 12 || 12}:${minuteText} ${hour >= 12 ? 'PM' : 'AM'}`
}

async function adminRequest(path, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { Authorization: `Token ${localStorage.getItem('kaonToken')}`, ...(options.body && !isFormData ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  })
  if (response.status === 204) return null
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || (response.status === 403 ? 'This portal is for staff accounts only.' : 'The request could not be completed.'))
  return data
}

function Cloche({ small = false, open = false }) { return <svg className={small ? 'cloche-svg small' : 'cloche-svg'} viewBox="0 0 180 150" fill="none" aria-hidden="true"><g className={`cloche-lid ${open ? 'cloche-lid-open' : ''}`}><path d="M90 25v-7a13 13 0 0 1 26 0v12" stroke="currentColor" strokeWidth="9" strokeLinecap="round"/><path d="M24 114a66 66 0 0 1 132 0H24Z" stroke="currentColor" strokeWidth="9" strokeLinejoin="round"/></g><path d="M24 128h132" stroke="currentColor" strokeWidth="9" strokeLinecap="round"/></svg> }
function Brand({ compact = false }) { return <div className={`brand ${compact ? 'brand-compact' : ''}`}><div className="brand-word">KA<span className="brand-mark"><Utensils size={compact ? 21 : 27}/></span>N</div><div className="brand-sub">DALUBCENIAN</div></div> }

function Splash({ onDone }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (step === 0) { const t = setTimeout(() => setStep(1), 1650); return () => clearTimeout(t) }
    if (step === 1) { const t = setTimeout(() => setStep(2), 700); return () => clearTimeout(t) }
    if (step === 2) { const t = setTimeout(onDone, 1800); return () => clearTimeout(t) }
  }, [step, onDone])
  return <main className={`splash splash-step-${step}`}>
    <img className={`splash-artwork ${step < 2 ? 'artwork-waiting' : 'artwork-revealed'}`} src="/kaon-splash.png" alt="KAON Dalubcenian logo" />
    {step < 2 && <div className="cloche-button"><Cloche open={step === 1} /></div>}
    {step < 2 && <div className={`mouse-indicator ${step === 1 ? 'mouse-click' : ''}`}><MousePointer2 className="pointer-cursor" size={38} strokeWidth={1.8}/><span/></div>}
  </main>
}

function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const isRegister = mode === 'register'

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (isRegister && password !== confirmPassword) { setError('Passwords do not match.'); return }
    setBusy(true)
    try {
      const response = await fetch(`${API_BASE}/auth/${mode}/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Could not connect to your account.')
      if (isRegister) {
        setMode('login')
        setPassword('')
        setConfirmPassword('')
        setShowPassword(false)
        setSuccess('Account created. Please log in with your username and password.')
      } else {
        localStorage.setItem('kaonToken', data.token)
        onAuthenticated(data)
      }
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Can’t reach the server. Start the Django backend and try again.' : err.message)
    } finally { setBusy(false) }
  }

  return <main className={`auth-page ${isRegister ? 'register-mode' : 'login-mode'}`}>
    <div className="auth-decoration auth-decoration-one"/><div className="auth-decoration auth-decoration-two"/>
    <section className="auth-content">
      <div className="auth-brand"><img className="auth-logo-image" src="/kaon-logo.png" alt="KAON Dalubcenian"/></div>
      <h1 className="auth-slogan">Kaon na! No more Pila-pila!</h1>
      <form className="auth-form" onSubmit={submit}>
        <label>Username<input type="text" autoComplete="username" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} minLength={isRegister ? 3 : undefined} maxLength={150} required/></label>
        <label>Password<span className="password-wrap"><input type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} minLength={isRegister ? 8 : undefined} required/><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}</button></span></label>
        {isRegister && <label>Confirm Password<span className="password-wrap"><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Enter your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={8} required/><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}</button></span></label>}
        {success && <p className="auth-success" role="status">{success}</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}<ArrowRight size={16}/></button>
      </form>
      <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to Kaon?'} <button onClick={() => { setMode(isRegister ? 'login' : 'register'); setError(''); setSuccess(''); setPassword(''); setConfirmPassword('') }}>{isRegister ? 'Log in' : 'Create an account'}</button></p>
    </section>
  </main>
}

function AdminPortal({ user, onSignOut }) {
  const [section, setSection] = useState('orders')
  const [orderHistorySearch, setOrderHistorySearch] = useState('')
  const [menuCategory, setMenuCategory] = useState('Meals')
  const [items, setItems] = useState([])
  const [orders, setOrders] = useState([])
  const [reviews, setReviews] = useState([])
  const [hours, setHours] = useState({ open_time: '08:00:00', close_time: '16:00:00', is_open: false })
  const [hoursSaving, setHoursSaving] = useState(false)
  const [editor, setEditor] = useState(null)
  const [busy, setBusy] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [clockNow, setClockNow] = useState(Date.now())
  const [timerMinutes, setTimerMinutes] = useState({})
  const [replyDrafts, setReplyDrafts] = useState({})
  const [replyBusyId, setReplyBusyId] = useState(null)
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState(null)

  useEffect(() => {
    const timer = setInterval(() => setClockNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  async function refresh() {
    setBusy(true); setError('')
    try {
      const [menuData, orderData, reviewData, hoursData] = await Promise.all([adminRequest('/admin/menu/'), adminRequest('/admin/orders/'), adminRequest('/reviews/'), adminRequest('/admin/hours/')])
      setItems(menuData); setOrders(orderData); setReviews(reviewData); setHours(hoursData)
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  useEffect(() => { refresh() }, [])
  useEffect(() => {
    const poll = async () => {
      try {
        const [orderData, reviewData] = await Promise.all([adminRequest('/admin/orders/'), adminRequest('/reviews/')])
        setOrders(orderData); setReviews(reviewData)
      } catch {}
    }
    const timer = setInterval(poll, 5000)
    return () => clearInterval(timer)
  }, [])

  async function saveMenuItem(event) {
    event.preventDefault(); setSaving(true); setError('')
    const payload = new FormData()
    for (const [key, value] of Object.entries(editor)) {
      if (['image', 'imagePreview', 'imageFile', 'emoji', 'color'].includes(key)) continue
      if (value !== undefined && value !== null) payload.append(key, key === 'price' ? String(Number(value)) : String(value))
    }
    if (editor.imageFile) payload.append('image', editor.imageFile)
    try {
      if (editor.id) await adminRequest(`/admin/menu/${editor.id}/`, { method: 'PATCH', body: payload })
      else await adminRequest('/admin/menu/', { method: 'POST', body: payload })
      setEditor(null); await refresh(); window.dispatchEvent(new Event('kaon-menu-updated'))
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }
  async function toggleAvailability(item) {
    setError('')
    try {
      const updated = await adminRequest(`/admin/menu/${item.id}/`, { method: 'PATCH', body: JSON.stringify({ available: !item.available }) })
      setItems(current => current.map(menuItem => menuItem.id === item.id ? updated : menuItem))
      window.dispatchEvent(new Event('kaon-menu-updated'))
    }
    catch (err) { setError(err.message) }
  }
  async function removeMenuItem(item) {
    setError('')
    try {
      await adminRequest(`/admin/menu/${item.id}/`, { method: 'DELETE' })
      setItems(current => current.filter(menuItem => menuItem.id !== item.id))
      setDeletingItem(null)
      window.dispatchEvent(new Event('kaon-menu-updated'))
    } catch (err) { setError(err.message) }
  }
  async function updateOrderStatus(order, status, durationMinutes = 15) {
    setError('')
    try {
      const updated = await adminRequest(`/admin/orders/${order.id}/`, { method: 'PATCH', body: JSON.stringify({ status, preparation_duration_minutes: durationMinutes }) })
      setOrders(current => current.map(item => item.id === order.id ? updated : item))
    } catch (err) { setError(err.message) }
  }

  async function submitReviewReply(event, review) {
    event.preventDefault(); setReplyBusyId(review.id); setError('')
    try {
      const updated = await adminRequest(`/admin/reviews/${review.id}/reply/`, { method: 'POST', body: JSON.stringify({ message: replyDrafts[review.id] ?? review.admin_reply ?? '' }) })
      setReviews(current => current.map(item => item.id === review.id ? updated : item))
    } catch (err) { setError(err.message) }
    finally { setReplyBusyId(null) }
  }

  async function saveHours(event) {
    event.preventDefault(); setHoursSaving(true); setError('')
    try {
      setHours(await adminRequest('/admin/hours/', { method: 'PATCH', body: JSON.stringify({ open_time: hours.open_time.slice(0, 5), close_time: hours.close_time.slice(0, 5) }) }))
    } catch (err) { setError(err.message) }
    finally { setHoursSaving(false) }
  }

  const todayInManila = manilaDateKey(Date.now())
  const todaySalesOrders = orders.filter(order => order.status === 'collected' && manilaDateKey(order.created_at) === todayInManila)
  const todaySales = todaySalesOrders.reduce((sum, order) => sum + Number(order.total), 0)
  const salesByItem = {}
  todaySalesOrders.forEach(order => order.items?.forEach(line => {
    const key = line.menu_item ?? line.name
    if (!salesByItem[key]) salesByItem[key] = { name: line.name, quantity: 0, sales: 0 }
    salesByItem[key].quantity += line.quantity
    salesByItem[key].sales += Number(line.unit_price) * line.quantity
  }))
  const allSalesItems = Object.values(salesByItem).sort((a, b) => b.quantity - a.quantity || b.sales - a.sales)
  const bestSellingItems = allSalesItems.slice(0, 5)
  const totalItemsSold = allSalesItems.reduce((sum, item) => sum + item.quantity, 0)
  const activeSalesMonth = todayInManila.slice(0, 7)
  const [salesYear, salesMonth] = activeSalesMonth.split('-').map(Number)
  const daysInSalesMonth = new Date(salesYear, salesMonth, 0).getDate()
  const salesByDay = {}
  const salesOrdersByDay = {}
  const monthlyOrders = orders.filter(order => order.status === 'collected' && manilaDateKey(order.created_at).startsWith(activeSalesMonth))
  monthlyOrders.forEach(order => {
    const day = manilaDateKey(order.created_at).slice(-2)
    salesByDay[day] = (salesByDay[day] || 0) + Number(order.total)
    salesOrdersByDay[day] = (salesOrdersByDay[day] || 0) + 1
  })
  const dailySales = Array.from({ length: daysInSalesMonth }, (_, index) => {
    const day = String(index + 1).padStart(2, '0')
    return { day, date: `${activeSalesMonth}-${day}`, total: salesByDay[day] || 0, orders: salesOrdersByDay[day] || 0 }
  })
  const monthlySalesTotal = dailySales.reduce((sum, day) => sum + day.total, 0)
  const elapsedDays = Number(todayInManila.slice(-2))
  const averageDailySales = monthlySalesTotal / Math.max(1, elapsedDays)
  const bestSalesDay = dailySales.filter(day => Number(day.day) <= elapsedDays).reduce((best, day) => day.total > (best?.total || 0) ? day : best, null)
  const recentDailySales = dailySales.filter(day => Number(day.day) <= elapsedDays).slice(-7).reverse()
  const salesMonthLabel = new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', month: 'long', year: 'numeric' }).format(new Date(`${activeSalesMonth}-15T12:00:00+08:00`))
  const filteredHistoryOrders = orders.filter(order => order.status === 'collected' && String(order.id).includes(orderHistorySearch.trim()))
  const menuCategories = ['Meals', 'Snacks', 'Drinks', 'Milk Tea']
  const selectedCategoryItems = items.filter(item => item.category === menuCategory)

  return <div className="admin-shell">
    <header className="admin-topbar"><div className="admin-brand"><span className="admin-logo"><img src="/kaon-logo.png" alt="KAON"/></span><span><b>Canteen Admin</b><small>DLL ordering portal</small></span></div><button className="admin-user" onClick={() => setProfileOpen(true)} title="Account profile" aria-label="Open account profile"><span>{(user.username || user.email)?.slice(0,1).toUpperCase() || 'A'}</span></button></header>
    <main key={section} className="admin-content page-transition"><section className="admin-welcome"><div><p className="eyebrow">KAON · STAFF WORKSPACE</p><h1>Good day, <em>Admin.</em></h1><p>Manage today’s canteen menu and pickup orders.</p></div><div className="admin-stats"><article><span>OPEN ORDERS</span><b>{orders.filter(order => order.status !== 'collected').length}</b></article><article><span>MENU ITEMS</span><b>{items.length}</b></article></div></section>
      <nav className="admin-tabs"><button className={section === 'orders' ? 'active' : ''} onClick={() => setSection('orders')}><ShoppingBag size={16}/> Orders <i>{orders.filter(order => order.status !== 'collected').length}</i></button><button className={section === 'history' ? 'active' : ''} onClick={() => setSection('history')}><Archive size={16}/> History <i>{orders.filter(order => order.status === 'collected').length}</i></button><button className={section === 'menu' ? 'active' : ''} onClick={() => setSection('menu')}><Utensils size={16}/> Menu <i>{items.length}</i></button><button className={section === 'analytics' ? 'active' : ''} onClick={() => setSection('analytics')}><BarChart3 size={16}/> Overview</button><button className={section === 'reviews' ? 'active' : ''} onClick={() => setSection('reviews')}><MessageSquareText size={16}/> Reviews <i>{reviews.length}</i></button><button className={section === 'hours' ? 'active' : ''} onClick={() => setSection('hours')}><Clock3 size={16}/> Hours</button></nav>
      {error && <div className="admin-error" role="alert">{error}<button onClick={() => setError('')}><X size={15}/></button></div>}
      {busy ? <div className="admin-loading"><span/> Loading your workspace…</div> : section === 'hours' ? <section className="admin-hours"><div className="analytics-heading"><div><p className="eyebrow">CANTEEN SCHEDULE</p><h2>Opening hours</h2></div><span className={`hours-status ${hours.is_open ? 'currently-open' : ''}`}><i/>{hours.is_open ? 'Open now' : 'Closed now'}</span></div><form className="hours-editor" onSubmit={saveHours}><label>Opening time<input type="time" value={(hours.open_time || '08:00').slice(0, 5)} onChange={event => setHours(current => ({ ...current, open_time: event.target.value }))} required/></label><label>Closing time<input type="time" value={(hours.close_time || '16:00').slice(0, 5)} onChange={event => setHours(current => ({ ...current, close_time: event.target.value }))} required/></label><div className="hours-preview"><Clock3 size={18}/><span>Customers will see: <b>{formatCanteenTime(hours.open_time)} to {formatCanteenTime(hours.close_time)}</b></span></div><button className="primary-button" disabled={hoursSaving}>{hoursSaving ? 'Saving...' : 'Save opening hours'}</button></form></section> : section === 'analytics' ? <section className="admin-analytics"><div className="analytics-heading"><div><p className="eyebrow">SALES OVERVIEW</p><h2>Overview</h2></div><span>{new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'long' }).format(new Date())}</span></div><div className="analytics-metrics"><article><small>TOTAL SALES TODAY</small><b>₱{todaySales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b><span>Collected orders today</span></article><article><small>ORDERS COLLECTED</small><b>{todaySalesOrders.length}</b><span>Completed pickups today</span></article><article><small>ITEMS SOLD</small><b>{totalItemsSold}</b><span>Across collected orders</span></article></div><section className="analytics-products"><div className="analytics-products-heading"><div><p className="eyebrow">TOP PERFORMERS</p><h3>Best-selling items</h3></div><span>Today</span></div>{bestSellingItems.length ? <div className="analytics-product-list">{bestSellingItems.map((item, index) => <article className="analytics-product" key={item.name}><span className="analytics-rank">{index + 1}</span><div className="analytics-product-main"><div><b>{item.name}</b><small>{item.quantity} sold · ₱{item.sales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</small></div><div className="analytics-bar"><i style={{ width: `${Math.max(8, item.quantity / bestSellingItems[0].quantity * 100)}%` }}/></div></div></article>)}</div> : <div className="admin-empty analytics-empty"><BarChart3 size={24}/><b>No completed sales today</b><span>Collected orders will appear here.</span></div>}</section><section className="analytics-products monthly-overview"><div className="analytics-products-heading"><div><p className="eyebrow">MONTHLY OVERVIEW</p><h3>{salesMonthLabel}</h3></div><span>{monthlyOrders.length} collected orders</span></div><div className="monthly-overview-metrics"><article><small>MONTH SALES</small><b>{'\u20b1'}{monthlySalesTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></article><article><small>DAILY AVERAGE</small><b>{'\u20b1'}{averageDailySales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></article><article><small>BEST SALES DAY</small><b>{bestSalesDay && bestSalesDay.total > 0 ? new Date(`${bestSalesDay.date}T12:00:00+08:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : '?'}</b><span>{bestSalesDay && bestSalesDay.total > 0 ? `\u20b1${bestSalesDay.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'No sales yet'}</span></article></div><div className="recent-daily-sales"><div className="recent-daily-sales-heading"><b>Daily sales</b><small>Last 7 days</small></div>{recentDailySales.length ? recentDailySales.map(day => <article key={day.date}><span>{new Date(`${day.date}T12:00:00+08:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}<small>{day.orders} {day.orders === 1 ? 'order' : 'orders'}</small></span><strong>{'\u20b1'}{day.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></article>) : <p className="sales-breakdown-empty">No sales recorded this month.</p>}</div></section></section> : section === 'history' ? <section className="admin-section"><div className="admin-section-title history-section-title"><div><p className="eyebrow">COMPLETED PICKUPS</p><h2>Order history</h2></div><label className="history-search"><Search size={15}/><input type="search" aria-label="Search order number" placeholder="Search order #" value={orderHistorySearch} onChange={event => setOrderHistorySearch(event.target.value.replace(/[^0-9]/g, ''))}/>{orderHistorySearch && <button type="button" aria-label="Clear order search" onClick={() => setOrderHistorySearch('')}><X size={14}/></button>}</label></div>{filteredHistoryOrders.length ? <div className="admin-order-list">{filteredHistoryOrders.map(order => <article className="admin-order-card history-order-card" key={order.id}><div className="admin-order-heading"><div><b>Order #{order.id}</b><small>{order.customer_username || 'DLL customer'} · {new Date(order.created_at).toLocaleString()}</small></div><strong>₱{order.total}</strong></div><div className="admin-order-items">{order.items?.map((line, index) => <span key={`${order.id}-${index}`}>{line.quantity} × {line.name}</span>)}</div><span className="admin-status-pill collected">Collected</span></article>)}</div> : <div className="admin-empty"><Archive size={24}/><b>{orderHistorySearch ? 'No matching order found' : 'No completed orders yet'}</b><span>{orderHistorySearch ? 'Try another order number.' : 'Collected orders will be archived here.'}</span></div>}</section> : section === 'reviews' ? <section className="admin-section"><div className="admin-section-title"><div><p className="eyebrow">CUSTOMER FEEDBACK</p><h2>Reviews</h2></div><span className="admin-review-count">{reviews.length} total</span></div>{reviews.length ? <div className="admin-review-list">{reviews.map(review => <article className="admin-review-card" key={review.id}><div className="admin-review-top"><div><b>{review.username}</b><small>Order #{review.order_number} · {new Date(review.created_at).toLocaleString()}</small></div><span>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span></div>{review.comment && <p>{review.comment}</p>}{review.admin_reply && <div className="admin-review-reply-existing"><b>Admin reply by {review.reply_username || "Staff"}</b><p>{review.admin_reply}</p></div>}<form className="admin-review-reply-form" onSubmit={event => submitReviewReply(event, review)}><textarea aria-label={`Reply to ${review.username} review`} value={replyDrafts[review.id] ?? review.admin_reply ?? ""} onChange={event => setReplyDrafts(current => ({ ...current, [review.id]: event.target.value }))} placeholder="Write a reply to this review..." maxLength={1000} required/><button className="admin-edit" disabled={replyBusyId === review.id}>{replyBusyId === review.id ? "Sending..." : review.admin_reply ? "Update reply" : "Reply"}</button></form></article>)}</div> : <div className="admin-empty"><MessageSquareText size={24}/><b>No customer reviews yet</b><span>New feedback will appear here.</span></div>}</section> : section === 'orders' ? <section className="admin-section"><div className="admin-section-title"><div><p className="eyebrow">LIVE PICKUPS</p><h2>Incoming orders</h2></div><button className="admin-refresh" onClick={refresh}>Refresh</button></div>{orders.some(order => order.status !== 'collected') ? <div className="admin-order-list">{orders.filter(order => order.status !== 'collected').map(order => {
        const startedAt = order.preparation_started_at ? new Date(order.preparation_started_at).getTime() : (order.status === 'preparing' ? new Date(order.created_at).getTime() : null)
        const remaining = startedAt ? Math.ceil((startedAt + (order.preparation_duration_minutes || 15) * 60000 - clockNow) / 1000) : null
        const urgent = order.status === 'preparing' && remaining !== null && remaining <= 120
        const action = order.status === 'received' ? ['preparing', 'Start preparing'] : order.status === 'preparing' ? ['ready', 'Mark ready for pickup'] : order.status === 'ready' ? ['collected', 'Mark collected'] : null
        return <article className={`admin-order-card ${urgent ? 'order-urgent' : ''}`} key={order.id}><div className="admin-order-heading"><div><b>Order #{order.id}</b><small>{order.customer_username || 'DLL customer'} · {new Date(order.created_at).toLocaleString()}</small></div><strong>₱{order.total}</strong></div><p className="admin-pickup"><Clock3 size={14}/> Pickup: {order.pickup_time}</p><div className="admin-order-items">{order.items?.map((line, index) => <span key={`${order.id}-${index}`}>{line.quantity} × {line.name}</span>)}</div>{order.add_ons?.length > 0 && <div className="saved-order-items order-addon-summary">{order.add_ons.map((option, index) => <span key={`${order.id}-addon-${index}`}>{option.quantity} {'\u00d7'} {option.name} {'\u00b7'} {'\u20b1'}{option.price}</span>)}</div>}{order.customer_note && <p className="order-customer-note"><b>Customer request:</b> {order.customer_note}</p>}<div className="admin-status-row"><span className={`admin-status-pill ${order.status}`}>{order.status === 'ready' ? 'Ready for pickup' : order.status[0].toUpperCase() + order.status.slice(1)}</span>{order.status === 'preparing' && remaining !== null && <span className={`prep-timer ${urgent ? 'urgent' : ''}`}><Clock3 size={14}/>{remaining < 0 ? `Overdue ${Math.floor(Math.abs(remaining) / 60)}:${String(Math.abs(remaining) % 60).padStart(2, '0')}` : `Time left ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`}{urgent && <b> · RUNNING LATE</b>}</span>}{order.status === 'received' && <label className="prep-duration">Timer <select value={timerMinutes[order.id] || 15} onChange={event => setTimerMinutes(current => ({ ...current, [order.id]: Number(event.target.value) }))}><option value={10}>10 min</option><option value={15}>15 min</option><option value={20}>20 min</option><option value={30}>30 min</option></select></label>}{action && <button className={`order-action ${order.status === 'preparing' && urgent ? 'late-action' : ''}`} onClick={() => updateOrderStatus(order, action[0], timerMinutes[order.id] || 15)}>{action[1]} <ArrowRight size={14}/></button>}</div></article>
      })}</div> : <div className="admin-empty"><ShoppingBag size={24}/><b>No orders yet</b><span>New pre-orders will appear here.</span></div>}</section> : <section className="admin-section"><div className="admin-section-title"><div><p className="eyebrow">DIGITAL MENU</p><h2>Menu items</h2></div><button className="admin-add" onClick={() => setEditor({ ...emptyMenuItem })}><Plus size={16}/> Add item</button></div><nav className="admin-menu-category-tabs" aria-label="Menu categories">{menuCategories.map(category => <button type="button" key={category} className={menuCategory === category ? 'active' : ''} aria-current={menuCategory === category ? 'page' : undefined} onClick={() => setMenuCategory(category)}>{category}<i>{items.filter(item => item.category === category).length}</i></button>)}</nav>{selectedCategoryItems.length ? <div className="admin-menu-list">{selectedCategoryItems.map(item => <article className="admin-menu-row" key={item.id}><span className="admin-food-icon">{item.image ? <img src={resolveImageUrl(item.image)} alt={item.name} /> : item.emoji}</span><div className="admin-menu-copy"><b>{item.name}</b><small>?{item.price}{item.popular ? ' ? Popular' : ''}</small></div><select className={`availability-select ${item.available ? 'is-available' : 'is-unavailable'}`} aria-label={`${item.name} availability`} value={item.available ? 'available' : 'unavailable'} onChange={event => toggleAvailability(item)}><option value="available">Available</option><option value="unavailable">Unavailable</option></select><button className="admin-edit" onClick={() => setEditor({ ...item })}>Edit</button><button className="admin-toggle" onClick={() => setDeletingItem(item)}>Delete</button></article>)}</div> : <div className="admin-empty"><Utensils size={24}/><b>No menu items</b><span>Add a dish to publish it on the student menu.</span></div>}</section>}
    </main>
    {deletingItem && <div className="signout-backdrop"><section className="signout-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-menu-title"><h2 id="delete-menu-title">Remove {deletingItem.name}?</h2><p>This will permanently remove this product from the menu.</p><div><button className="signout-cancel" onClick={() => setDeletingItem(null)}>Cancel</button><button className="signout-confirm" onClick={() => removeMenuItem(deletingItem)}>Remove product</button></div></section></div>}
    {profileOpen && <div className="profile-overlay" onClick={() => setProfileOpen(false)}><section className="profile-card" role="dialog" aria-modal="true" aria-labelledby="admin-profile-title" onClick={event => event.stopPropagation()}><button className="profile-close" aria-label="Close profile" onClick={() => setProfileOpen(false)}><X size={18}/></button><div className="profile-icon"><UserRound size={24}/></div><p className="eyebrow">STAFF ACCOUNT</p><h2 id="admin-profile-title">Account profile</h2><div className="profile-email"><small>USERNAME</small><b>{user.username || user.email}</b></div><button className="profile-signout" onClick={() => { setProfileOpen(false); setConfirmSignOut(true) }}><LogOut size={16}/> Sign out</button></section></div>}
    {confirmSignOut && <div className="signout-backdrop"><section className="signout-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-signout-title"><div className="signout-icon"><LogOut size={20}/></div><h2 id="admin-signout-title">Sign out?</h2><p>Are you sure you want to end this staff session?</p><div><button className="signout-cancel" onClick={() => setConfirmSignOut(false)}>Stay signed in</button><button className="signout-confirm" onClick={onSignOut}>Sign out</button></div></section></div>}
    {editor && <div className="admin-modal-backdrop" onClick={() => !saving && setEditor(null)}><form className="admin-editor" onSubmit={saveMenuItem} onClick={event => event.stopPropagation()}><div className="editor-heading"><div><p className="eyebrow">MENU MANAGEMENT</p><h2>{editor.id ? 'Edit item' : 'Add menu item'}</h2></div><button type="button" className="icon-button" onClick={() => setEditor(null)}><X size={18}/></button></div><label>Item name<input value={editor.name} onChange={e => setEditor({ ...editor, name: e.target.value })} required maxLength={120}/></label><label>Description<input value={editor.description} onChange={e => setEditor({ ...editor, description: e.target.value })} maxLength={240}/></label><div className="editor-pair"><label>Price (₱)<input type="number" min="0.01" step="0.01" value={editor.price} onChange={e => setEditor({ ...editor, price: e.target.value })} required/></label>{!editor.id && <label>Category<select value={editor.category} onChange={e => setEditor({ ...editor, category: e.target.value })}><option>Meals</option><option>Snacks</option><option>Drinks</option><option>Milk Tea</option></select></label>}</div><label className="menu-photo-field">Food photo<input type="file" accept="image/*" required={!editor.imagePreview && !editor.image} onChange={event => { const file = event.target.files?.[0]; if (file && file.type.startsWith("image/")) setEditor({ ...editor, imageFile: file, imagePreview: URL.createObjectURL(file) }) }}/>{(editor.imagePreview || editor.image) && <img className="menu-photo-preview" src={resolveImageUrl(editor.imagePreview || editor.image)} alt="Food preview"/>}</label><label className="editor-checkbox"><input type="checkbox" checked={editor.available} onChange={e => setEditor({ ...editor, available: e.target.checked })}/> Show in student menu</label>{error && <div className="admin-error editor-error">{error}</div>}<button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save menu item'}</button></form></div>}
  </div>
}

export default function App() {
  const [splash, setSplash] = useState(true)
  const finishSplash = useCallback(() => setSplash(false), [])
  const [user, setUser] = useState(() => localStorage.getItem('kaonToken') ? { username: localStorage.getItem('kaonUsername') || localStorage.getItem('kaonEmail') || '' } : null)
  const [authReady, setAuthReady] = useState(() => !localStorage.getItem('kaonToken'))
  const [menu, setMenu] = useState(starterMenu)
  const [category, setCategory] = useState('Meals')
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState({})
  const [tab, setTab] = useState('menu')
  const [favorites, setFavorites] = useState(() => { try { const saved = JSON.parse(localStorage.getItem('kaonFavorites') || '[]'); return Array.isArray(saved) ? saved : [] } catch { return [] } })
  const [modal, setModal] = useState(false)
  const [orders, setOrders] = useState([])
  const [placingOrder, setPlacingOrder] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(user?.username || localStorage.getItem('kaonUsername') || '')
  const [nameSaving, setNameSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [pickup, setPickup] = useState('ASAP · about 15 min')
  const [customerNote, setCustomerNote] = useState('')
  const [selectedAddOns, setSelectedAddOns] = useState({})
  const [notice, setNotice] = useState('')
  const [clockNow, setClockNow] = useState(Date.now())
  const [canteenHours, setCanteenHours] = useState({ open_time: '08:00:00', close_time: '16:00:00', is_open: false })
  const [recentOrder, setRecentOrder] = useState(null)
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [reviews, setReviews] = useState([])
  const [reviewOrderId, setReviewOrderId] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewBusy, setReviewBusy] = useState(false)
  const [reviewMessage, setReviewMessage] = useState('')
  const [dismissedTrackerKey, setDismissedTrackerKey] = useState('')

  useEffect(() => {
    const timer = setInterval(() => setClockNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  useEffect(() => { localStorage.setItem('kaonFavorites', JSON.stringify(favorites)) }, [favorites])

  useEffect(() => {
    const token = localStorage.getItem('kaonToken')
    if (!token) return
    let active = true
    fetch(`${API_BASE}/auth/me/`, { headers: { Authorization: `Token ${token}` } })
      .then(response => response.ok ? response.json() : null)
      .then(profile => {
        if (!active) return
        if (profile) { localStorage.setItem('kaonUsername', profile.username); setUser(profile) }
        else { localStorage.removeItem('kaonToken'); localStorage.removeItem('kaonEmail'); localStorage.removeItem('kaonUsername'); setUser(null) }
      })
      .catch(() => {})
      .finally(() => { if (active) setAuthReady(true) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    const loadMenu = () => fetch(`${API_BASE}/menu/`).then(r => r.ok ? r.json() : []).then(data => { if (active && Array.isArray(data)) setMenu(data.map(item => ({ ...item, emoji: item.emoji || '???', color: item.color || 'neutral' }))) }).catch(() => {})
    loadMenu()
    const timer = setInterval(loadMenu, 3000)
    window.addEventListener('kaon-menu-updated', loadMenu)
    return () => { active = false; clearInterval(timer); window.removeEventListener('kaon-menu-updated', loadMenu) }
  }, [])
  useEffect(() => {
    let active = true
    const loadHours = () => fetch(`${API_BASE}/hours/`).then(response => response.ok ? response.json() : null).then(data => { if (active && data) setCanteenHours(data) }).catch(() => {})
    loadHours()
    const timer = setInterval(loadHours, 60000)
    return () => { active = false; clearInterval(timer) }
  }, [])
  useEffect(() => {
    if (!user) return
    let active = true
    const loadOrders = () => fetch(`${API_BASE}/orders/`, { headers: { Authorization: `Token ${localStorage.getItem('kaonToken')}` } })
      .then(response => {
        if (response.status === 401) {
          localStorage.removeItem('kaonToken'); localStorage.removeItem('kaonEmail'); localStorage.removeItem('kaonUsername')
          if (active) setUser(null)
          return []
        }
        return response.ok ? response.json() : []
      })
      .then(data => { if (active && Array.isArray(data)) setOrders(data) })
      .catch(() => {})
    loadOrders()
    const timer = setInterval(loadOrders, 5000)
    return () => { active = false; clearInterval(timer) }
  }, [user])
  useEffect(() => {
    if (!user || tab !== 'reviews') return
    fetch(`${API_BASE}/reviews/`, { headers: { Authorization: `Token ${localStorage.getItem('kaonToken')}` } })
      .then(response => response.ok ? response.json() : [])
      .then(data => { if (Array.isArray(data)) setReviews(data) })
      .catch(() => {})
  }, [user, tab])
  const visible = useMemo(() => menu.filter(item => item.category === category && `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase())), [menu, category, query])
  const count = Object.values(cart).reduce((a, b) => a + b, 0)
  const menuTotal = menu.reduce((sum, item) => sum + Number(item.price) * (cart[item.id] || 0), 0)
  const addOnTotal = menu.filter(item => cart[item.id]).reduce((sum, item) => sum + addOnsForItem(item).reduce((itemSum, option) => itemSum + option.price * (selectedAddOns[`${item.id}:${option.id}`] || 0), 0), 0)
  const total = menuTotal + addOnTotal
  const trackingOrders = orders.filter(order => order.status !== 'collected').slice(0, 2)
  const trackingDetails = trackingOrders.map(order => {
    const startedAt = order.preparation_started_at ? new Date(order.preparation_started_at).getTime() : (order.status === 'preparing' ? new Date(order.created_at).getTime() : null)
    const remaining = startedAt ? Math.ceil((startedAt + (order.preparation_duration_minutes || 15) * 60000 - clockNow) / 1000) : null
    const urgent = order.status === 'preparing' && remaining !== null && remaining <= 120
    const overdue = order.status === 'preparing' && remaining !== null && remaining < 0
    const label = order.status === 'received' ? 'Order received · waiting for the canteen' : order.status === 'preparing' ? (remaining < 0 ? `Preparing · ${Math.floor(Math.abs(remaining) / 60)}:${String(Math.abs(remaining) % 60).padStart(2, '0')} over` : `Preparing · ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')} left`) : 'Ready for pickup · Please collect your order'
    return { ...order, urgent, overdue, label }
  })
  const trackerKey = trackingDetails.map(order => `${order.id}:${order.status}:${order.urgent}:${order.overdue}`).join('|')
  const showTracker = trackingDetails.length > 0 && dismissedTrackerKey !== trackerKey
  const reviewableOrders = orders.filter(order => order.status === 'collected' && !reviews.some(review => review.order === order.id))
  const favoriteItems = menu.filter(item => favorites.includes(item.id))
  const changeQty = (id, delta) => setCart(current => { const next = { ...current, [id]: Math.max(0, (current[id] || 0) + delta) }; if (!next[id]) delete next[id]; return next })
  const toggleFavorite = id => setFavorites(current => current.includes(id) ? current.filter(itemId => itemId !== id) : [...current, id])
  const saveAccountName = async event => {
    event.preventDefault(); setNameSaving(true); setProfileError('')
    try {
      const response = await fetch(`${API_BASE}/auth/me/`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Token ${localStorage.getItem('kaonToken')}` }, body: JSON.stringify({ username: nameDraft.trim() }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || 'Could not update your account name.')
      setUser(current => ({ ...current, ...data }))
      setNameDraft(data.username)
      localStorage.setItem('kaonUsername', data.username)
      setEditingName(false)
    } catch (err) { setProfileError(err.message) }
    finally { setNameSaving(false) }
  }
  const placeOrder = async () => {
    if (!canteenHours.is_open) { setNotice('The canteen is currently closed. Please place your order during opening hours.'); return }
    const payload = { pickup_time: pickup, customer_note: customerNote.trim(), add_ons: menu.filter(item => cart[item.id]).flatMap(item => addOnsForItem(item).filter(option => selectedAddOns[`${item.id}:${option.id}`]).map(option => ({ id: option.id, menu_item: item.id, quantity: selectedAddOns[`${item.id}:${option.id}`] }))), items: menu.filter(item => cart[item.id]).map(item => ({ menu_item: item.id, quantity: cart[item.id] })), total }
    setPlacingOrder(true); setNotice('')
    try {
      const response = await fetch(`${API_BASE}/orders/`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Token ${localStorage.getItem('kaonToken')}` }, body: JSON.stringify(payload) })
      const data = await response.json()
      if (!response.ok) { const detail = data.detail || Object.values(data).flatMap(value => Array.isArray(value) ? value : [value]).filter(value => typeof value === 'string').join(' '); throw new Error(detail || `Could not place your order (HTTP ${response.status}). Please try again.`) }
      setOrders(current => [data, ...current]); setRecentOrder(data); setCustomerNote(''); setSelectedAddOns({}); setCart({}); setModal(false); setTab('orders')
    } catch (error) { setNotice(error.message === 'Failed to fetch' ? 'Can’t reach the canteen server. Please try again.' : error.message) }
    finally { setPlacingOrder(false) }
  }
  const submitReview = async event => {
    event.preventDefault(); setReviewBusy(true); setReviewMessage('')
    try {
      const response = await fetch(`${API_BASE}/reviews/`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Token ${localStorage.getItem('kaonToken')}` }, body: JSON.stringify({ order: Number(reviewOrderId || reviewableOrders[0]?.id), rating: reviewRating, comment: reviewComment }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Could not submit your review.')
      setReviews(current => [data, ...current]); setReviewComment(''); setReviewOrderId(''); setReviewMessage('Thanks! Your review has been submitted.')
    } catch (err) { setReviewMessage(err.message) }
    finally { setReviewBusy(false) }
  }
  if (splash) return <Splash onDone={finishSplash} />
  if (!authReady) return <div className="admin-loading session-loading"><span/> Checking your account…</div>
  if (!user) return <AuthPage onAuthenticated={data => { localStorage.setItem('kaonUsername', data.username); setUser(data) }} />
  if (user.is_staff) return <AdminPortal user={user} onSignOut={() => { localStorage.removeItem('kaonToken'); localStorage.removeItem('kaonEmail'); localStorage.removeItem('kaonUsername'); setUser(null) }} />
  const signOut = () => { localStorage.removeItem('kaonToken'); localStorage.removeItem('kaonEmail'); localStorage.removeItem('kaonUsername'); setProfileOpen(false); setUser(null) }
  return <div className="app-shell">
    <header className="topbar"><button className="location-pill"><MapPin size={15}/><span><small>PICKUP AT</small><b>DLL Canteen</b></span><ChevronDown size={15}/></button><button className="avatar" aria-label="Account profile" title={user.username} onClick={() => { setNameDraft(user.username || localStorage.getItem('kaonUsername') || ''); setProfileError(''); setEditingName(false); setProfileOpen(true) }}><UserRound size={17}/></button></header>
    <main key={tab} className="content page-transition">
      {tab === 'menu' && <>
        <section className="welcome"><div><p className="eyebrow">MADE FOR DLL</p><h1>Kaon na!<br/><em>No more pila-pila!</em></h1><p className="welcome-copy">Order ahead and pick up when it’s ready.</p></div><div className="welcome-art"><img src="/kaon-logo.png" alt="KAON Dalubcenian logo"/></div></section>
        <section className="canteen-status"><span className={`open-dot ${canteenHours.is_open ? '' : 'closed'}`}/><div><b>{canteenHours.is_open ? 'Canteen is open' : 'Canteen is closed'}</b><small>{canteenHours.is_open ? `Serving until ${formatCanteenTime(canteenHours.close_time)}` : `Opens at ${formatCanteenTime(canteenHours.open_time)}`}</small></div><span className="status-time"><Clock3 size={14}/>{formatCanteenTime(canteenHours.open_time)} to {formatCanteenTime(canteenHours.close_time)}</span></section>
        <div className="section-heading"><div><p className="eyebrow">MADE FRESH TODAY</p><h2>What sounds good?</h2></div><button className="icon-button"><SlidersHorizontal size={18}/></button></div>
        <label className="searchbox"><Search size={18}/><input placeholder="Search meals, snacks, drinks..." value={query} onChange={e => setQuery(e.target.value)}/>{query && <button onClick={() => setQuery('')}><X size={15}/></button>}</label>
        <nav className="categories">{categories.map(c => <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{c}</button>)}</nav>
        <div className="menu-grid">{visible.map(item => <article className="food-card" key={item.id}><div className={`food-art ${item.image ? "with-photo" : "neutral"}`}><span>{item.image ? <img className="food-photo" src={resolveImageUrl(item.image)} alt={item.name}/> : (item.emoji || <ImagePlus size={28}/>)}</span><button className={`favorite ${favorites.includes(item.id) ? "is-saved" : ""}`} aria-label={favorites.includes(item.id) ? `Remove ${item.name} from saved items` : `Save ${item.name}`} aria-pressed={favorites.includes(item.id)} onClick={() => toggleFavorite(item.id)}><Heart size={16} fill={favorites.includes(item.id) ? "currentColor" : "none"}/></button>{item.popular && <b className="popular-tag">POPULAR</b>}</div><div className="food-info"><div className="food-title"><h3>{item.name}</h3><b>₱{item.price}</b></div><p>{item.description}</p><div className="food-bottom"><span>{item.category}</span>{cart[item.id] ? <div className="qty-control"><button onClick={() => changeQty(item.id, -1)}><Minus size={14}/></button><b>{cart[item.id]}</b><button onClick={() => changeQty(item.id, 1)}><Plus size={14}/></button></div> : <button className="add-button" onClick={() => changeQty(item.id, 1)}><Plus size={15}/> Add</button>}</div></div></article>)}</div>
        {!visible.length && <div className="empty-state">No dishes found. Try another search.</div>}
      </>}
      {tab === 'orders' && <section className="orders-view"><div className="section-heading"><div><p className="eyebrow">YOUR PICKUPS</p><h2>My orders</h2></div></div>{orders.some(order => order.status !== 'collected') ? <div className="saved-order-list order-list-container">{orders.filter(order => order.status !== 'collected').map(order => <article className="saved-order-card" key={order.id}><div className="saved-order-top"><b>Order #{order.id}</b><span className={`order-status ${order.status}`}>{order.status === 'ready' ? 'Ready for pickup' : order.status}</span></div><p>Pickup · {order.pickup_time} · Name: {order.customer_username || user.username}</p><div className="saved-order-items">{order.items?.map((line, index) => <span key={`${order.id}-${index}`}>{line.quantity} × {line.name}</span>)}</div>{order.add_ons?.length > 0 && <div className="saved-order-items order-addon-summary">{order.add_ons.map((option, index) => <span key={`${order.id}-addon-${index}`}>{option.quantity} {'\u00d7'} {option.name} {'\u00b7'} {'\u20b1'}{option.price}</span>)}</div>}{order.customer_note && <p className="order-customer-note"><b>Your request:</b> {order.customer_note}</p>}<div className="saved-order-total"><span>Total</span><b>₱{order.total}</b></div></article>)}</div> : <div className="empty-state order-empty"><div>🧾</div><h3>No active orders</h3><p>New pre-orders will show up here.</p><button className="primary-button" onClick={() => setTab('menu')}>Browse the menu</button></div>}</section>}
      {tab === 'history' && <section className="orders-view"><div className="section-heading"><div><p className="eyebrow">PAST PICKUPS</p><h2>Order history</h2></div></div>{orders.some(order => order.status === 'collected') ? <div className="saved-order-list order-list-container">{orders.filter(order => order.status === 'collected').map(order => <article className="saved-order-card" key={order.id}><div className="saved-order-top"><b>Order #{order.id}</b><span className="order-status collected">Collected</span></div><p>Pickup · {order.pickup_time} · Name: {order.customer_username || user.username}</p><div className="saved-order-items">{order.items?.map((line, index) => <span key={`${order.id}-${index}`}>{line.quantity} × {line.name}</span>)}</div>{order.add_ons?.length > 0 && <div className="saved-order-items order-addon-summary">{order.add_ons.map((option, index) => <span key={`${order.id}-addon-${index}`}>{option.quantity} {'\u00d7'} {option.name} {'\u00b7'} {'\u20b1'}{option.price}</span>)}</div>}{order.customer_note && <p className="order-customer-note"><b>Your request:</b> {order.customer_note}</p>}<div className="saved-order-total"><span>Total</span><b>₱{order.total}</b></div></article>)}</div> : <div className="empty-state order-empty"><div><Archive size={36}/></div><h3>No order history</h3><p>Collected orders will appear here.</p></div>}</section>}
      {tab === 'reviews' && <section className="reviews-view"><div className="section-heading"><div><p className="eyebrow">YOUR FEEDBACK MATTERS</p><h2>Reviews</h2></div></div><section className="review-compose"><div><p className="eyebrow">RATE YOUR PICKUP</p><h3>How was your order?</h3></div>{reviewableOrders.length ? <form onSubmit={submitReview}><label className="review-order-select">Completed order<select value={reviewOrderId || String(reviewableOrders[0].id)} onChange={event => setReviewOrderId(event.target.value)}>{reviewableOrders.map(order => <option key={order.id} value={order.id}>Order #{order.id}</option>)}</select></label><div className="review-stars" role="radiogroup" aria-label="Rating from 1 to 5 stars">{[1, 2, 3, 4, 5].map(star => <button type="button" key={star} aria-label={`${star} star${star > 1 ? 's' : ''}`} aria-checked={reviewRating === star} role="radio" onClick={() => setReviewRating(star)}><Star size={25} fill={star <= reviewRating ? 'currentColor' : 'none'}/></button>)}</div><label className="review-comment-label">Comment (optional)<textarea value={reviewComment} onChange={event => setReviewComment(event.target.value)} placeholder="Tell us how your food and pickup experience went..." maxLength={1000}/></label>{reviewMessage && <p className="review-message" role="status">{reviewMessage}</p>}<button className="primary-button" disabled={reviewBusy}>{reviewBusy ? 'Submitting…' : 'Submit review'}</button></form> : <p className="review-empty-note">After an order is marked Collected, you can rate it and leave a comment here.</p>}</section><section className="review-list-section"><div className="analytics-products-heading"><div><p className="eyebrow">COMMUNITY FEEDBACK</p><h3>Recent reviews</h3></div><span>{reviews.length} reviews</span></div>{reviews.length ? <div className="review-list">{reviews.map(review => <article className="review-card" key={review.id}><div className="review-card-top"><div><b>{review.username}</b><small>Order #{review.order_number}</small></div><span className="review-rating">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span></div>{review.comment && <p>{review.comment}</p>}{review.admin_reply && <div className="review-admin-reply"><b>Reply from {review.reply_username || "Canteen staff"}</b><p>{review.admin_reply}</p></div>}<small className="review-date">{new Date(review.created_at).toLocaleDateString()}</small></article>)}</div> : <div className="review-empty-list">No reviews yet. Be the first to share feedback after pickup.</div>}</section></section>}
      {tab === 'saved' && <section className="saved-view"><div className="section-heading"><div><p className="eyebrow">YOUR FAVORITES</p><h2>Saved picks</h2></div></div>{favoriteItems.length ? <div className="menu-grid">{favoriteItems.map(item => <article className="food-card" key={item.id}><div className={`food-art ${item.image ? "with-photo" : "neutral"}`}><span>{item.image ? <img className="food-photo" src={resolveImageUrl(item.image)} alt={item.name}/> : (item.emoji || <ImagePlus size={28}/>)}</span><button className="favorite is-saved" aria-label={`Remove ${item.name} from saved items`} aria-pressed="true" onClick={() => toggleFavorite(item.id)}><Heart size={16} fill="currentColor"/></button></div><div className="food-info"><div className="food-title"><h3>{item.name}</h3><b>₱{item.price}</b></div><p>{item.description}</p><div className="food-bottom"><span>{item.category}</span>{cart[item.id] ? <div className="qty-control"><button onClick={() => changeQty(item.id, -1)}><Minus size={14}/></button><b>{cart[item.id]}</b><button onClick={() => changeQty(item.id, 1)}><Plus size={14}/></button></div> : <button className="add-button" onClick={() => changeQty(item.id, 1)}><Plus size={15}/> Add</button>}</div></div></article>)}</div> : <div className="empty-state order-empty"><div><Heart size={36}/></div><h3>Your saved picks</h3><p>Tap the heart on a dish to keep it here.</p><button className="primary-button" onClick={() => setTab('menu')}>Explore menu</button></div>}</section>}
    </main>
    {showTracker && <aside className="order-tracker" aria-label="Live order updates"><div className="tracker-header"><span>ORDER UPDATES</span><button aria-label="Dismiss order updates" onClick={() => setDismissedTrackerKey(trackerKey)}><X size={16}/></button></div>{trackingDetails.map(order => <button key={order.id} className={`order-tracker-item ${order.urgent ? 'urgent' : ''} ${order.status === 'ready' ? 'is-ready' : ''}`} onClick={() => setTab('orders')}><span className="tracker-dot"/><span><b>Order #{order.id}</b><small>{order.label}</small></span><ChevronDown size={15}/></button>)}</aside>}
    {count > 0 && tab === 'menu' && <button className={`cart-bar ${trackingOrders.length ? 'with-order-tracker' : ''}`} onClick={() => setModal(true)}><span className="cart-count">{count}</span><span>View your order</span><b>₱{total}</b><ArrowRight size={18}/></button>}
    <footer className="bottom-nav"><button className={tab === 'menu' ? 'selected' : ''} onClick={() => setTab('menu')}><Utensils size={19}/><span>Menu</span></button><button className={tab === 'orders' ? 'selected' : ''} onClick={() => setTab('orders')}><ShoppingBag size={19}/><span>Orders</span></button><button className={tab === 'history' ? 'selected' : ''} onClick={() => setTab('history')}><Archive size={19}/><span>History</span></button><button className={tab === 'reviews' ? 'selected' : ''} onClick={() => setTab('reviews')}><Star size={19}/><span>Reviews</span></button><button className={tab === 'saved' ? 'selected' : ''} onClick={() => setTab('saved')}><Heart size={19}/><span>Saved</span></button></footer>
    {modal && <div className="overlay" onClick={() => !placingOrder && setModal(false)}><section className="order-sheet" onClick={e => e.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div><p className="eyebrow">READY WHEN YOU ARE</p><h2>Your order</h2></div><button className="icon-button" onClick={() => setModal(false)}><X size={19}/></button></div><div className="order-lines">{menu.filter(item => cart[item.id]).map(item => <div className="order-line" key={item.id}><span className={`line-emoji ${item.color}`}>{item.image ? <img className="line-food-photo" src={resolveImageUrl(item.image)} alt=""/> : item.emoji}</span><div className="line-details"><b>{item.name}</b><small>₱{item.price} each</small></div><div className="qty-control"><button onClick={() => changeQty(item.id, -1)}><Minus size={14}/></button><b>{cart[item.id]}</b><button onClick={() => changeQty(item.id, 1)}><Plus size={14}/></button></div><strong>₱{item.price * cart[item.id]}</strong></div>)}</div>{menu.filter(item => cart[item.id] && addOnsForItem(item).length).map(item => <section className="order-addons" key={`addons-${item.id}`}><div className="order-addons-heading"><b>Add-ons for {item.name}</b><small>Optional</small></div>{addOnsForItem(item).map(option => { const key = `${item.id}:${option.id}`; return <div className="order-addon-row" key={option.id}><span><b>{option.name}</b><small>+{'\u20b1'}{option.price}</small></span><div className="qty-control"><button type="button" aria-label={`Remove one ${option.name}`} onClick={() => setSelectedAddOns(current => { const next = { ...current, [key]: Math.max(0, (current[key] || 0) - 1) }; if (!next[key]) delete next[key]; return next })}><Minus size={14}/></button><b>{selectedAddOns[key] || 0}</b><button type="button" aria-label={`Add ${option.name}`} onClick={() => setSelectedAddOns(current => ({ ...current, [key]: Math.min(20, (current[key] || 0) + 1) }))}><Plus size={14}/></button></div></div>})}</section>)}<label className="pickup-label">PICKUP TIME<select value={pickup} onChange={e => setPickup(e.target.value)}><option>ASAP · about 15 min</option><option>In 30 minutes</option><option>In 1 hour</option></select></label><label className="order-note-label">CUSTOMER REQUEST <span>Optional</span><textarea value={customerNote} onChange={event => setCustomerNote(event.target.value)} placeholder="Any special requests for your order?" maxLength={500} rows={3}/><small>{customerNote.length}/500</small></label><div className="total-row"><span>Total</span><b>₱{total}</b></div><button className="primary-button" onClick={placeOrder} disabled={placingOrder || !canteenHours.is_open}>{placingOrder ? 'Sending order…' : <>Place pre-order <ArrowRight size={17}/></>}</button><p className="sheet-note">{canteenHours.is_open ? "Pay at the canteen when you pick up." : `Orders reopen at ${formatCanteenTime(canteenHours.open_time)}.`}</p>{notice && <p className="order-error" role="alert">{notice}</p>}</section></div>}
    {profileOpen && <div className="profile-overlay" onClick={() => setProfileOpen(false)}><section className="profile-card" role="dialog" aria-modal="true" aria-labelledby="profile-title" onClick={event => event.stopPropagation()}><button className="profile-close" aria-label="Close profile" onClick={() => setProfileOpen(false)}><X size={18}/></button><div className="profile-icon"><UserRound size={24}/></div><p className="eyebrow">YOUR ACCOUNT</p><h2 id="profile-title">Account profile</h2>{editingName ? <form className="profile-name-form" onSubmit={saveAccountName}><label htmlFor="profile-name-input">Account name</label><input id="profile-name-input" value={nameDraft} onChange={event => setNameDraft(event.target.value)} minLength={3} maxLength={150} required autoComplete="username"/>{profileError && <p className="profile-error" role="alert">{profileError}</p>}<div className="profile-name-actions"><button type="button" onClick={() => { setEditingName(false); setNameDraft(user.username || '') }}>Cancel</button><button type="submit" disabled={nameSaving}>{nameSaving ? 'Saving?' : 'Save name'}</button></div></form> : <><div className="profile-email"><small>ACCOUNT NAME</small><b>{user.username || localStorage.getItem('kaonUsername')}</b></div><button className="profile-edit-name" onClick={() => { setNameDraft(user.username || localStorage.getItem('kaonUsername') || ''); setProfileError(''); setEditingName(true) }}>Edit name</button></>}{confirmSignOut ? <div className="profile-signout-confirm"><b>Sign out of your account?</b><div><button onClick={() => setConfirmSignOut(false)}>Stay signed in</button><button onClick={signOut}>Sign out</button></div></div> : <button className="profile-signout" onClick={() => setConfirmSignOut(true)}><LogOut size={16}/> Sign out</button>}</section></div>}
    {recentOrder && <div className="pickup-confirmation-backdrop"><section className="pickup-confirmation" role="dialog" aria-modal="true" aria-labelledby="pickup-confirmation-title"><button className="pickup-confirmation-close" aria-label="Close confirmation" onClick={() => setRecentOrder(null)}><X size={19}/></button><span className="pickup-confirmation-check"><Check size={25}/></span><p className="eyebrow">ORDER RECEIVED</p><h2 id="pickup-confirmation-title">Order placed!</h2><p className="pickup-confirmation-instruction">Show this number when you pick up.</p><div className="pickup-order-number"><small>YOUR ORDER NUMBER</small><strong>#{recentOrder.id}</strong></div><div className="pickup-order-name"><UserRound size={17}/><span><small>ORDER NAME</small><b>{recentOrder.customer_username || user.username}</b></span></div><button className="primary-button" onClick={() => setRecentOrder(null)}>Continue to order tracking</button></section></div>}
    {notice && <div className="toast">{notice}</div>}
  </div>
}
