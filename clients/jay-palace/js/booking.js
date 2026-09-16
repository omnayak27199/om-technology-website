// ============================================================
//  JAY PALACE — Booking + Payment Logic
// ============================================================

let db = null
let _pendingBooking = null   // stores booking data between form step and payment step

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderAmenities()
  renderContact()
  setMinDates()

  // Init EmailJS for guest confirmation emails
  if (window.EMAILJS && window.EMAILJS.publicKey !== 'YOUR_PUBLIC_KEY') {
    if (typeof emailjs !== 'undefined') emailjs.init({ publicKey: window.EMAILJS.publicKey })
  }

  document.getElementById('bookingModal').addEventListener('click', function(e) {
    if (e.target === this) closeBookingModal()
  })

  try {
    if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG)
    db = firebase.firestore()
    loadRoomsFromDB()
    loadBlockedDatesPublic()
  } catch (e) {
    console.error('Firebase init failed:', e)
    renderRooms()
    populateRoomSelect()
  }
})

function loadRoomsFromDB() {
  db.collection('config').doc('rooms').get()
    .then(doc => {
      if (doc.exists && doc.data().rooms && doc.data().rooms.length) {
        window.ROOMS = doc.data().rooms
      }
      renderRooms()
      populateRoomSelect()
    })
    .catch(() => {
      renderRooms()
      populateRoomSelect()
    })
}

let _publicBlockedDates = []

function loadBlockedDatesPublic() {
  if (!db) return
  db.collection('config').doc('blockedDates').get()
    .then(doc => {
      _publicBlockedDates = (doc.exists && doc.data().dates) ? doc.data().dates : []
    })
    .catch(() => {})
}

function isDateBlocked(dateStr) {
  return _publicBlockedDates.some(entry => dateStr >= entry.from && dateStr <= entry.to)
}

// ── Render ─────────────────────────────────────────────────
function renderRooms() {
  const grid = document.getElementById('roomsGrid')
  if (!grid) return
  grid.innerHTML = ROOMS.map(room => `
    <div class="room-card">
      <div class="room-thumb" style="background:${room.gradient}">
        ${room.emoji}
        <div class="room-badge">${room.maxGuests} Guests Max</div>
      </div>
      <div class="room-body">
        <div class="room-name">${room.name}</div>
        <div class="room-meta">
          <span>🛏 ${room.beds}</span>
          <span>👥 Up to ${room.maxGuests}</span>
        </div>
        <div class="room-desc">${room.desc}</div>
        <div class="room-amenities">
          ${room.amenities.slice(0,5).map(a => `<span>${a}</span>`).join('')}
          ${room.amenities.length > 5 ? `<span>+${room.amenities.length-5} more</span>` : ''}
        </div>
        <div class="room-price">₹${room.price.toLocaleString('en-IN')} <small>/ night</small></div>
        <button class="btn-book-room" onclick="openBookingModal('${room.id}')">Book Now</button>
      </div>
    </div>
  `).join('')
}

function renderAmenities() {
  const grid = document.getElementById('amenitiesGrid')
  if (!grid) return
  grid.innerHTML = AMENITIES.map(a => `
    <div class="amenity-card">
      <div class="amenity-icon">${a.icon}</div>
      <div class="amenity-name">${a.name}</div>
      <div class="amenity-desc">${a.desc}</div>
    </div>
  `).join('')
}

function renderContact() {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v }
  set('contactPhone',   HOTEL.phone)
  set('contactEmail',   HOTEL.email)
  set('contactAddress', HOTEL.address)
  set('contactTimes',   `Check-in: ${HOTEL.checkIn} · Check-out: ${HOTEL.checkOut}`)
  const wa = document.getElementById('contactWA')
  if (wa) { wa.href = `https://wa.me/${HOTEL.whatsapp}?text=Hello%20Hotel%20Jay%20Palace!`; wa.textContent = 'Chat on WhatsApp' }
  const waFloat = document.getElementById('waFloat')
  if (waFloat) waFloat.href = `https://wa.me/${HOTEL.whatsapp}?text=Hello%20Hotel%20Jay%20Palace!`
}

function populateRoomSelect() {
  const sel = document.getElementById('roomType')
  if (!sel) return
  ROOMS.forEach(room => {
    const opt = document.createElement('option')
    opt.value = room.id
    opt.textContent = `${room.name} — ₹${room.price.toLocaleString('en-IN')}/night`
    sel.appendChild(opt)
  })
}

// ── Dates ──────────────────────────────────────────────────
function setMinDates() {
  const today = new Date().toISOString().split('T')[0]
  const ci = document.getElementById('checkIn'); if (ci) ci.min = today
  const co = document.getElementById('checkOut'); if (co) co.min = today
}

function recalcPrice() {
  const checkIn  = document.getElementById('checkIn').value
  const checkOut = document.getElementById('checkOut').value
  const roomId   = document.getElementById('selectedRoomId').value || document.getElementById('roomType').value
  const room     = ROOMS.find(r => r.id === roomId)
  if (!room || !checkIn || !checkOut) return
  const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000)
  if (nights < 1) { document.getElementById('checkOut').value = ''; showToast('Check-out must be after check-in', true); return }
  if (isDateBlocked(checkIn)) {
    document.getElementById('checkIn').value = ''
    showToast('Selected check-in date is not available (blocked). Please choose another date.', true)
    return
  }
  const base = nights * room.price
  const gst  = HOTEL.gst ? Math.round(base * HOTEL.gst / 100) : 0
  document.getElementById('priceLabel').textContent = `${nights} night${nights>1?'s':''} × ₹${room.price.toLocaleString('en-IN')}`
  document.getElementById('priceBase').textContent  = `₹${base.toLocaleString('en-IN')}`
  document.getElementById('priceTotal').textContent = `₹${(base+gst).toLocaleString('en-IN')}`
  document.getElementById('gstRow').style.display   = HOTEL.gst ? 'flex' : 'none'
  if (HOTEL.gst) document.getElementById('priceGst').textContent = `₹${gst.toLocaleString('en-IN')}`
  document.getElementById('priceSummary').style.display = 'block'
  const next = new Date(checkIn); next.setDate(next.getDate()+1)
  document.getElementById('checkOut').min = next.toISOString().split('T')[0]
}

function onRoomTypeChange() {
  const room = ROOMS.find(r => r.id === document.getElementById('roomType').value)
  if (!room) return
  document.getElementById('selectedRoomId').value       = room.id
  document.getElementById('modalRoomEmoji').textContent = room.emoji
  document.getElementById('modalRoomName').textContent  = room.name
  document.getElementById('modalRoomPrice').textContent = `₹${room.price.toLocaleString('en-IN')} / night`
  recalcPrice()
}

// ── Modal steps helper ─────────────────────────────────────
function showStep(id) {
  ['bookingForm','paymentStep','upiStep','bookingSuccess'].forEach(s => {
    const el = document.getElementById(s)
    if (el) el.style.display = s === id ? 'block' : 'none'
  })
  // Update progress indicator
  const bs  = document.getElementById('bookingSteps')
  const tr  = document.getElementById('modalTrustRow')
  const s1  = document.getElementById('bstep1')
  const s2  = document.getElementById('bstep2')
  if (!bs) return
  if (id === 'bookingSuccess') {
    bs.style.display = 'none'
    if (tr) tr.style.display = 'none'
  } else {
    bs.style.display = 'flex'
    if (tr) tr.style.display = 'flex'
    const onStep2 = (id === 'paymentStep' || id === 'upiStep')
    if (s1) s1.className = 'bstep' + (onStep2 ? ' done' : ' active')
    if (s2) s2.className = 'bstep' + (onStep2 ? ' active' : '')
  }
}

// ── Modal Open / Close ─────────────────────────────────────
function openBookingModal(roomId) {
  showStep('bookingForm')
  document.getElementById('bookingModal').classList.add('open')
  const id = roomId || ROOMS[0].id
  document.getElementById('roomType').value       = id
  document.getElementById('selectedRoomId').value = id
  onRoomTypeChange()
  setMinDates()
  _pendingBooking = null
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.remove('open')
  document.getElementById('bookingForm').reset()
  document.getElementById('priceSummary').style.display = 'none'
  _pendingBooking = null
}

function backToForm()    { showStep('bookingForm') }
function backToPayment() { showStep('paymentStep') }

// ── Step 1: Form Submit → show payment options ─────────────
function submitBooking(e) {
  e.preventDefault()

  const roomId   = document.getElementById('selectedRoomId').value || document.getElementById('roomType').value
  const room     = ROOMS.find(r => r.id === roomId)
  const checkIn  = document.getElementById('checkIn').value
  const checkOut = document.getElementById('checkOut').value
  if (!checkIn || !checkOut) { showToast('Please select check-in and check-out dates', true); return }

  const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000)
  if (nights < 1) { showToast('Check-out must be after check-in', true); return }

  const phone = document.getElementById('guestPhone').value.trim()
  if (!/^\+?[0-9\s\-]{10,15}$/.test(phone)) { showToast('Please enter a valid phone number', true); return }

  const base  = nights * room.price
  const gst   = HOTEL.gst ? Math.round(base * HOTEL.gst / 100) : 0
  const total = base + gst

  // Store pending booking
  _pendingBooking = {
    bookingCode:     'JP-' + Date.now().toString().slice(-6),
    customerName:    document.getElementById('guestName').value.trim(),
    customerPhone:   phone,
    customerEmail:   document.getElementById('guestEmail').value.trim(),
    roomId:          room.id,
    roomName:        room.name,
    pricePerNight:   room.price,
    checkIn, checkOut, nights,
    guests:          parseInt(document.getElementById('guests').value),
    specialRequests: document.getElementById('specialRequests').value.trim(),
    totalAmount:     total,
    gstAmount:       gst,
    status:          'pending',
    paymentMethod:   null,
    paymentId:       null,
  }

  // Show payment step
  document.getElementById('payStepTotal').textContent = `₹${total.toLocaleString('en-IN')}`
  document.getElementById('payStepSub').textContent   =
    `${room.name} · ${nights} night${nights>1?'s':''} · ${_pendingBooking.customerName}`
  showStep('paymentStep')
}

// ── Step 2a: Razorpay ──────────────────────────────────────
function payWithRazorpay() {
  const b = _pendingBooking
  if (!b) return

  const options = {
    key:         RAZORPAY_KEY,
    amount:      b.totalAmount * 100,
    currency:    'INR',
    name:        'Hotel Jay Palace',
    description: `${b.roomName} · ${b.nights} night${b.nights>1?'s':''}`,
    prefill:     { name: b.customerName, contact: b.customerPhone, email: b.customerEmail || '' },
    theme:       { color: '#C9A84C' },
    handler: function(response) {
      saveBooking({ ...b, status: 'pending', paymentMethod: 'razorpay', paymentId: response.razorpay_payment_id })
    },
  }
  const rzp = new Razorpay(options)
  rzp.on('payment.failed', () => showToast('Payment failed. Please try again or choose another method.', true))
  rzp.open()
}

// ── Step 2b: UPI QR + App buttons ──────────────────────────
let _upiTimer    = null
let _upiTimeLeft = 0
const UPI_DURATION = 420  // 7 minutes

function showUpiQR() {
  const b = _pendingBooking
  if (!b) return

  const pa = encodeURIComponent(HOTEL.upiId)
  const pn = encodeURIComponent('Hotel Jay Palace')
  const tn = encodeURIComponent('Room booking ' + b.bookingCode)
  const upiLink = `upi://pay?pa=${pa}&pn=${pn}&am=${b.totalAmount}&cu=INR&tn=${tn}`
  const qrUrl   = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=000000&bgcolor=ffffff&data=${encodeURIComponent(upiLink)}&qzone=1&format=png`

  document.getElementById('upiAmountDisplay').textContent = b.totalAmount.toLocaleString('en-IN')
  document.getElementById('upiIdDisplay').textContent     = HOTEL.upiId
  document.getElementById('upiQRImg').src                 = qrUrl
  document.getElementById('utrInput').value               = ''
  document.getElementById('upiExpired').style.display     = 'none'
  document.getElementById('utrSection').style.display     = 'block'
  const btn = document.getElementById('btnConfirmUpi')
  if (btn) btn.disabled = false

  showStep('upiStep')
  startUpiTimer()
}

function openUpiApp(app) {
  const b = _pendingBooking
  if (!b) return
  const pa = encodeURIComponent(HOTEL.upiId)
  const pn = encodeURIComponent('Hotel Jay Palace')
  const am = b.totalAmount
  const tn = encodeURIComponent('Room booking ' + b.bookingCode)
  const links = {
    gpay:    `tez://upi/pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`,
    phonepe: `phonepe://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`,
    paytm:   `paytmmp://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`,
    bhim:    `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`,
  }
  window.location.href = links[app] || links.bhim
}

function startUpiTimer() {
  clearInterval(_upiTimer)
  _upiTimeLeft = UPI_DURATION
  const ring = document.getElementById('timerRing')
  const circumference = 182.2  // 2π × r(29)

  function tick() {
    const mins = Math.floor(_upiTimeLeft / 60)
    const secs = _upiTimeLeft % 60
    const el = document.getElementById('timerDisplay')
    const timerEl = document.getElementById('upiTimerEl')
    if (el) el.textContent = `${mins}:${secs.toString().padStart(2, '0')}`

    // Ring progress
    if (ring) ring.style.strokeDashoffset = circumference * (1 - _upiTimeLeft / UPI_DURATION)

    // Colour stages
    if (timerEl) {
      timerEl.className = 'upi-timer' +
        (_upiTimeLeft <= 60 ? ' timer-danger' : _upiTimeLeft <= 180 ? ' timer-warn' : '')
    }
    if (ring) {
      ring.style.stroke = _upiTimeLeft <= 60 ? '#dc2626'
                        : _upiTimeLeft <= 180 ? '#d97706'
                        : '#7b4f2e'
    }

    if (_upiTimeLeft <= 0) {
      clearInterval(_upiTimer)
      const expiredEl = document.getElementById('upiExpired')
      const utrEl     = document.getElementById('utrSection')
      const btn       = document.getElementById('btnConfirmUpi')
      if (expiredEl) expiredEl.style.display = 'block'
      if (utrEl)     utrEl.style.display     = 'none'
      if (btn)       btn.disabled            = true
      return
    }
    _upiTimeLeft--
  }
  tick()
  _upiTimer = setInterval(tick, 1000)
}

function backToPaymentFromUpi() {
  clearInterval(_upiTimer)
  backToPayment()
}

function confirmUpiPayment() {
  const b = _pendingBooking
  if (!b) return
  if (_upiTimeLeft <= 0) { showToast('Session expired. Please go back and try again.', true); return }
  const utr = (document.getElementById('utrInput').value || '').trim()
  if (!utr || utr.length < 6) {
    showToast('Please enter the UTR / Transaction ID from your UPI app', true)
    document.getElementById('utrInput').focus()
    return
  }
  clearInterval(_upiTimer)
  saveBooking({ ...b, status: 'pending', paymentMethod: 'upi', paymentId: 'UTR:' + utr })
}

// ── Step 2c: Pay at Hotel ──────────────────────────────────
function payAtHotel() {
  const b = _pendingBooking
  if (!b) return
  saveBooking({ ...b, status: 'pending', paymentMethod: 'cash', paymentId: null })
}

// ── Save booking to Firestore + notify owner ───────────────
function saveBooking(booking) {
  if (!db) { showToast('Database not connected. Please refresh and try again.', true); return }

  const data = {
    ...booking,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  }

  db.collection('bookings').add(data)
    .then(() => {
      // Auto-download PDF receipt for online-paid customers
      if (booking.paymentMethod === 'razorpay' || booking.paymentMethod === 'upi') {
        setTimeout(() => generateReceiptPDF(booking), 800)
      }

      // Send booking confirmation email to guest automatically (if configured + email provided)
      if (booking.customerEmail && window.EMAILJS && window.EMAILJS.publicKey !== 'YOUR_PUBLIC_KEY' && typeof emailjs !== 'undefined') {
        emailjs.send(window.EMAILJS.serviceId, window.EMAILJS.confirmationTemplate, {
          to_name:        booking.customerName,
          to_email:       booking.customerEmail,
          booking_id:     booking.bookingCode,
          room_name:      booking.roomName,
          check_in:       fmtDate(booking.checkIn) + ' (' + HOTEL.checkIn + ')',
          check_out:      fmtDate(booking.checkOut) + ' (' + HOTEL.checkOut + ')',
          nights:         booking.nights,
          guests:         booking.guests,
          total_amount:   '₹' + booking.totalAmount.toLocaleString('en-IN'),
          payment_method: booking.paymentMethod === 'razorpay' ? 'Online — Razorpay'
                        : booking.paymentMethod === 'upi'      ? 'UPI Transfer'
                        : 'Pay at Hotel (Cash)',
          payment_status: 'Pending Hotel Approval',
          special_req:    booking.specialRequests || 'None',
          hotel_phone:    HOTEL.phone,
          hotel_email:    HOTEL.email,
          hotel_address:  HOTEL.address,
        }).catch(() => {})
      }

      // Success screen with Track Booking button
      const payMsg = booking.paymentMethod === 'razorpay'
        ? 'Payment successful! Your booking has been received and will be confirmed shortly.'
        : booking.paymentMethod === 'upi'
        ? 'UPI payment noted. The hotel will verify and send a WhatsApp confirmation to you.'
        : 'Booking received! Pay when you arrive at the hotel on check-in.'

      const emailNote = booking.customerEmail
        ? `A confirmation email has been sent to <strong>${booking.customerEmail}</strong><br>`
        : ''

      const successEl = document.getElementById('bookingSuccess')
      successEl.innerHTML = `
        <div class="success-icon">${booking.paymentMethod === 'razorpay' ? '🎉' : booking.paymentMethod === 'upi' ? '📱' : '✅'}</div>
        <h3>Booking Request Sent!</h3>
        <p>${payMsg}</p>
        <div class="booking-code">Booking ID: ${booking.bookingCode}</div>
        <p style="margin-top:10px;font-size:.78rem;color:var(--muted);line-height:1.6">
          ${emailNote}You'll receive a WhatsApp confirmation at <strong>${booking.customerPhone}</strong> once the hotel approves.
        </p>
        <a href="track.html"
           onclick="sessionStorage.setItem('jp_track_code','${booking.bookingCode}')"
           style="display:inline-block;margin-top:18px;padding:13px 32px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border-radius:9999px;font-weight:800;font-size:.9375rem;text-decoration:none;box-shadow:0 4px 20px rgba(22,163,74,.45)">
          📦 Track My Booking
        </a>
        <div class="whats-next">
          <div class="wn-title">What happens next?</div>
          <div class="wn-step">
            <div class="wn-icon">📱</div>
            <div><strong>Hotel confirms via WhatsApp</strong><span>Within 1–2 hours of your booking</span></div>
          </div>
          <div class="wn-step">
            <div class="wn-icon">🏨</div>
            <div><strong>Arrive &amp; check in at reception</strong><span>Show your Booking ID — no printout needed</span></div>
          </div>
          <div class="wn-step">
            <div class="wn-icon">⭐</div>
            <div><strong>Enjoy your stay</strong><span>24×7 hotel team ready to assist you</span></div>
          </div>
        </div>
      `
      showStep('bookingSuccess')
    })
    .catch(err => {
      console.error('Firestore error:', err.code, err.message)
      showToast(err.code === 'permission-denied'
        ? 'Permission denied — fix Firestore Security Rules.'
        : `Error: ${err.message}`, true)
    })
}

// ── Customer Receipt PDF ───────────────────────────────────
function generateReceiptPDF(booking) {
  if (!window.jspdf) return
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const W = 210, M = 14
  const DBROWN = [80, 45, 20]
  const BROWN  = [123, 79, 46]
  const CREAM  = [250, 248, 245]
  const CREAM2 = [240, 232, 220]
  const BORDER = [210, 195, 180]
  const DARK   = [26, 15, 8]
  const GREY   = [130, 120, 110]
  const WHITE  = [255, 255, 255]
  const GREEN  = [22, 163, 74]
  const AMBER  = [180, 120, 0]
  const STRIPE = [244, 240, 236]

  const isCash = booking.paymentMethod === 'cash'
  const isUpi  = booking.paymentMethod === 'upi'

  function sectionBar(label, y) {
    doc.setFillColor(...BROWN)
    doc.rect(M, y, W - M * 2, 8, 'F')
    doc.setTextColor(...WHITE)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(label, M + 4, y + 5.5)
    return y + 8
  }

  // ── HEADER ─────────────────────────────────────────────
  doc.setFillColor(...DBROWN); doc.rect(0, 0, W, 44, 'F')
  doc.setFillColor(...BROWN); doc.rect(0, 0, W, 2, 'F')
  doc.setTextColor(...WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(22)
  doc.text('HOTEL JAY PALACE', W / 2, 15, { align: 'center' })
  doc.setFontSize(8); doc.setTextColor(232, 215, 188)
  doc.text('★  ★  ★  ★  ★', W / 2, 21, { align: 'center' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
  doc.text(HOTEL.address, W / 2, 28, { align: 'center' })
  doc.text('Tel: ' + HOTEL.phone + '   |   Email: ' + HOTEL.email, W / 2, 34, { align: 'center' })
  doc.text('Web: jaypalace.online', W / 2, 40, { align: 'center' })

  // ── TITLE STRIP ─────────────────────────────────────────
  doc.setFillColor(...CREAM2); doc.rect(0, 44, W, 11, 'F')
  doc.setTextColor(...DBROWN); doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
  doc.text(isCash ? 'BOOKING CONFIRMATION' : 'PAYMENT RECEIPT', W / 2, 52, { align: 'center' })

  // ── RECEIPT META ─────────────────────────────────────────
  let y = 60
  doc.setFillColor(...CREAM); doc.setDrawColor(...BORDER); doc.setLineWidth(0.3)
  doc.rect(M, y, W - M * 2, 16, 'FD')

  doc.setTextColor(...GREY); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.text('Receipt No.', M + 4, y + 5.5)
  doc.text('Date', M + 4, y + 11.5)
  doc.setTextColor(...DARK); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.text('RCP-JP-' + booking.bookingCode, M + 28, y + 5.5)
  doc.text(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), M + 28, y + 11.5)

  doc.setDrawColor(...BORDER); doc.line(W / 2 + 5, y + 3, W / 2 + 5, y + 13)

  doc.setTextColor(...GREY); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.text('Booking ID', W / 2 + 9, y + 5.5)
  doc.text('Payment', W / 2 + 9, y + 11.5)
  doc.setTextColor(...DARK); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.text(booking.bookingCode, W - M - 4, y + 5.5, { align: 'right' })
  const pmLabel = { razorpay: 'Online — Razorpay', upi: 'UPI Transfer', cash: 'Pay at Hotel' }
  doc.setTextColor(...(isCash ? AMBER : GREEN))
  doc.text(pmLabel[booking.paymentMethod] || '—', W - M - 4, y + 11.5, { align: 'right' })
  y += 20

  // ── TWO COLUMNS ──────────────────────────────────────────
  const colW = (W - M * 2 - 5) / 2
  const col1 = M, col2 = M + colW + 5
  const boxH = 52

  // Guest Details
  doc.setFillColor(...CREAM); doc.rect(col1, y, colW, boxH, 'F')
  doc.setFillColor(...BROWN); doc.rect(col1, y, colW, 8, 'F')
  doc.setDrawColor(...BORDER); doc.setLineWidth(0.3); doc.rect(col1, y, colW, boxH, 'D')
  doc.setTextColor(...WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
  doc.text('GUEST DETAILS', col1 + 4, y + 5.5)

  const guestRows = [
    ['Name',    booking.customerName  || '—'],
    ['Phone',   booking.customerPhone || '—'],
    ['Email',   booking.customerEmail || '—'],
    ['Aadhaar', '(Verified at check-in)'],
    ['Guests',  booking.guests ? booking.guests + (booking.guests > 1 ? ' Guests' : ' Guest') : '—'],
    ['Request', booking.specialRequests ? doc.splitTextToSize(booking.specialRequests, colW - 28)[0] : 'None'],
  ]
  let gy = y + 11
  guestRows.forEach(([lbl, val], i) => {
    if (i % 2 === 0) { doc.setFillColor(...STRIPE); doc.rect(col1 + 1, gy - 1, colW - 2, 7, 'F') }
    doc.setTextColor(...GREY); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
    doc.text(lbl, col1 + 4, gy + 4)
    doc.setTextColor(...DARK); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.text(doc.splitTextToSize(String(val), colW - 28)[0], col1 + 26, gy + 4)
    gy += 7
  })

  // Booking Summary
  doc.setFillColor(...CREAM); doc.rect(col2, y, colW, boxH, 'F')
  doc.setFillColor(...BROWN); doc.rect(col2, y, colW, 8, 'F')
  doc.setDrawColor(...BORDER); doc.setLineWidth(0.3); doc.rect(col2, y, colW, boxH, 'D')
  doc.setTextColor(...WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
  doc.text('BOOKING SUMMARY', col2 + 4, y + 5.5)

  const bookingRows = [
    ['Room Type', booking.roomName  || '—'],
    ['Room No.',  'Assigned at check-in'],
    ['Check-in',  fmtDate(booking.checkIn)  + (HOTEL.checkIn  ? ' (' + HOTEL.checkIn  + ')' : '')],
    ['Check-out', fmtDate(booking.checkOut) + (HOTEL.checkOut ? ' (' + HOTEL.checkOut + ')' : '')],
    ['Duration',  (booking.nights || '—') + (booking.nights > 1 ? ' Nights' : ' Night')],
    ['Booked On', new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
  ]
  let ry2 = y + 11
  bookingRows.forEach(([lbl, val], i) => {
    if (i % 2 === 0) { doc.setFillColor(...STRIPE); doc.rect(col2 + 1, ry2 - 1, colW - 2, 7, 'F') }
    doc.setTextColor(...GREY); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
    doc.text(lbl, col2 + 4, ry2 + 4)
    doc.setTextColor(...DARK); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.text(doc.splitTextToSize(String(val), colW - 28)[0], col2 + 28, ry2 + 4)
    ry2 += 7
  })
  y += boxH + 6

  // ── CHARGES ──────────────────────────────────────────────
  y = sectionBar('CHARGES', y)
  doc.setFillColor(50, 30, 15); doc.rect(M, y, W - M * 2, 8, 'F')
  doc.setTextColor(...WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
  doc.text('Description', M + 4, y + 5.5)
  doc.text('Nights', M + 108, y + 5.5, { align: 'center' })
  doc.text('Rate / Night', M + 136, y + 5.5, { align: 'center' })
  doc.text('Amount', W - M - 4, y + 5.5, { align: 'right' })
  y += 8

  const roomTotal = (booking.pricePerNight || 0) * booking.nights
  doc.setFillColor(...CREAM); doc.rect(M, y, W - M * 2, 10, 'F')
  doc.setDrawColor(...BORDER); doc.setLineWidth(0.2); doc.line(M, y + 10, W - M, y + 10)
  doc.setTextColor(...DARK); doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.text(booking.roomName || 'Accommodation', M + 4, y + 6.5)
  doc.text(String(booking.nights || 1), M + 108, y + 6.5, { align: 'center' })
  doc.text('Rs.' + (booking.pricePerNight || 0).toLocaleString('en-IN'), M + 136, y + 6.5, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.text('Rs.' + roomTotal.toLocaleString('en-IN'), W - M - 4, y + 6.5, { align: 'right' })
  y += 10

  if (booking.gstAmount) {
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.2); doc.line(M, y + 10, W - M, y + 10)
    doc.setTextColor(...GREY); doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
    doc.text('GST', M + 4, y + 6.5)
    doc.setTextColor(...DARK); doc.setFont('helvetica', 'bold')
    doc.text('Rs.' + booking.gstAmount.toLocaleString('en-IN'), W - M - 4, y + 6.5, { align: 'right' })
    y += 10
  }

  doc.setFillColor(...BROWN); doc.rect(M, y, W - M * 2, 12, 'F')
  doc.setTextColor(...WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
  doc.text('TOTAL AMOUNT', M + 4, y + 8.5)
  doc.text('Rs.' + (booking.totalAmount || roomTotal).toLocaleString('en-IN'), W - M - 4, y + 8.5, { align: 'right' })
  y += 15

  // ── PAYMENT INFORMATION ──────────────────────────────────
  y = sectionBar('PAYMENT INFORMATION', y)
  const payRef = booking.paymentId && booking.paymentId !== 'UPI-VERIFY' ? booking.paymentId.replace('UTR:', 'UTR ') : '—'
  const pRows = [
    ['Payment Method',    pmLabel[booking.paymentMethod] || '—', true],
    ['Transaction / UTR', payRef, false],
    ['Payment Status',    isCash ? 'DUE AT CHECK-IN' : 'PAYMENT RECEIVED ✓', true],
  ]
  pRows.forEach(([lbl, val, shade]) => {
    if (shade) { doc.setFillColor(...CREAM); doc.rect(M, y, W - M * 2, 8, 'F') }
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.2); doc.line(M, y + 8, W - M, y + 8)
    doc.setTextColor(...GREY); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    doc.text(lbl, M + 4, y + 5.5)
    const vc = lbl === 'Payment Status' ? (isCash ? AMBER : GREEN) : DARK
    doc.setTextColor(...vc); doc.setFont('helvetica', 'bold')
    doc.text(val, W - M - 4, y + 5.5, { align: 'right' })
    y += 8
  })
  y += 6

  // Cash / UPI note
  if (isCash) {
    doc.setFillColor(255, 248, 235); doc.setDrawColor(215, 150, 40); doc.setLineWidth(0.4)
    doc.rect(M, y, W - M * 2, 12, 'FD')
    doc.setTextColor(150, 90, 10); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.text('Payment due at hotel check-in. Please carry this confirmation document.', W / 2, y + 8, { align: 'center' })
    y += 14
  } else if (isUpi) {
    doc.setFillColor(240, 253, 244); doc.setDrawColor(22, 163, 74); doc.setLineWidth(0.4)
    doc.rect(M, y, W - M * 2, 12, 'FD')
    doc.setTextColor(22, 163, 74); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.text('UPI payment received. Your booking is pending hotel confirmation via WhatsApp.', W / 2, y + 8, { align: 'center' })
    y += 14
  }

  // ── TERMS & CONDITIONS ───────────────────────────────────
  doc.setFillColor(248, 245, 240); doc.setDrawColor(...BORDER); doc.setLineWidth(0.3)
  doc.rect(M, y, W - M * 2, 30, 'FD')
  doc.setTextColor(...BROWN); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
  doc.text('TERMS & CONDITIONS', M + 4, y + 6)
  doc.setTextColor(...GREY); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8)
  doc.text('1.  Check-in: 12:00 PM  |  Check-out: 11:00 AM  |  Early check-in subject to availability.', M + 4, y + 12)
  doc.text('2.  Valid government photo ID (Aadhaar / PAN / Passport) is mandatory at check-in.', M + 4, y + 17)
  doc.text('3.  This receipt is computer-generated and legally valid without a physical signature.', M + 4, y + 22)
  doc.text('4.  For queries: ' + HOTEL.phone + '  |  ' + HOTEL.email, M + 4, y + 27)
  y += 34

  // ── FOOTER ───────────────────────────────────────────────
  const fy = Math.max(y + 4, 266)
  doc.setDrawColor(...BORDER); doc.setLineWidth(0.4)
  const sx1 = W - M - 54, sx2 = W - M
  doc.line(sx1, fy - 10, sx2, fy - 10)
  doc.setTextColor(...GREY); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5)
  doc.text('Authorized Signatory', (sx1 + sx2) / 2, fy - 5, { align: 'center' })
  doc.text('Hotel Jay Palace', (sx1 + sx2) / 2, fy - 1, { align: 'center' })

  doc.setDrawColor(...BROWN); doc.setLineWidth(0.8)
  doc.line(M, fy + 2, W - M, fy + 2)
  doc.setTextColor(...BROWN); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.text('Thank you for choosing Hotel Jay Palace. We look forward to welcoming you!', W / 2, fy + 8, { align: 'center' })
  doc.setTextColor(170, 155, 135); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5)
  doc.text('Booking system powered by OM Technology  ·  omtechnology.online', W / 2, fy + 14, { align: 'center' })

  doc.save('Receipt-JP-' + booking.bookingCode + '.pdf')
}

function fmtDate(d) {
  return d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
}

// ── Helpers ────────────────────────────────────────────────
function showToast(msg, isError) {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.className   = 'toast show' + (isError ? ' error' : '')
  setTimeout(() => { t.className = 'toast' }, 4000)
}

// Expose to HTML
window.openBookingModal      = openBookingModal
window.closeBookingModal     = closeBookingModal
window.submitBooking         = submitBooking
window.onRoomTypeChange      = onRoomTypeChange
window.recalcPrice           = recalcPrice
window.payWithRazorpay       = payWithRazorpay
window.showUpiQR             = showUpiQR
window.openUpiApp            = openUpiApp
window.confirmUpiPayment     = confirmUpiPayment
window.payAtHotel            = payAtHotel
window.backToForm            = backToForm
window.backToPayment         = backToPayment
window.backToPaymentFromUpi  = backToPaymentFromUpi
