// ============================================================
//  JAY PALACE — Booking + Payment Logic
// ============================================================

let db = null
let _pendingBooking = null   // stores booking data between form step and payment step

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderRooms()
  renderAmenities()
  renderContact()
  populateRoomSelect()
  setMinDates()

  document.getElementById('bookingModal').addEventListener('click', function(e) {
    if (e.target === this) closeBookingModal()
  })

  try {
    if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG)
    db = firebase.firestore()
  } catch (e) {
    console.error('Firebase init failed:', e)
  }
})

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
      saveBooking({ ...b, status: 'paid', paymentMethod: 'razorpay', paymentId: response.razorpay_payment_id })
    },
  }
  const rzp = new Razorpay(options)
  rzp.on('payment.failed', () => showToast('Payment failed. Please try again or choose another method.', true))
  rzp.open()
}

// ── Step 2b: UPI QR ────────────────────────────────────────
function showUpiQR() {
  const b = _pendingBooking
  if (!b) return

  const upiLink = `upi://pay?pa=${encodeURIComponent(HOTEL.upiId)}&pn=${encodeURIComponent('Hotel Jay Palace')}&am=${b.totalAmount}&cu=INR&tn=${encodeURIComponent('Room booking ' + b.bookingCode)}`
  const qrUrl   = `https://chart.googleapis.com/chart?chs=220x220&cht=qr&choe=UTF-8&chl=${encodeURIComponent(upiLink)}`

  document.getElementById('upiAmountDisplay').textContent = b.totalAmount.toLocaleString('en-IN')
  document.getElementById('upiIdDisplay').textContent     = HOTEL.upiId
  document.getElementById('upiQRImg').src                 = qrUrl

  showStep('upiStep')
}

function confirmUpiPayment() {
  const b = _pendingBooking
  if (!b) return
  saveBooking({ ...b, status: 'pending', paymentMethod: 'upi', paymentId: 'UPI-VERIFY' })
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
      const payLabel = booking.paymentMethod === 'razorpay' ? 'Paid via Razorpay ✓'
                     : booking.paymentMethod === 'upi'      ? 'UPI payment (pending verification)'
                     : 'Pay at Hotel (cash on arrival)'

      const ownerMsg = encodeURIComponent(
        `🏨 *NEW BOOKING — Hotel Jay Palace*\n\n` +
        `📋 ID: ${booking.bookingCode}\n` +
        `👤 ${booking.customerName}\n📞 ${booking.customerPhone}\n` +
        `🛏️ ${booking.roomName}\n` +
        `📅 ${booking.checkIn} → ${booking.checkOut} (${booking.nights} nights)\n` +
        `👥 ${booking.guests} guest(s)\n` +
        `💰 ₹${booking.totalAmount.toLocaleString('en-IN')}\n` +
        `💳 ${payLabel}\n` +
        (booking.specialRequests ? `📝 ${booking.specialRequests}\n` : '') +
        `\nOpen admin panel to manage.`
      )
      window.open(`https://wa.me/${HOTEL.whatsapp}?text=${ownerMsg}`, '_blank')

      // Success screen
      const payMsg = booking.paymentMethod === 'razorpay'
        ? '✅ Payment successful! Your booking is confirmed.'
        : booking.paymentMethod === 'upi'
        ? '📱 UPI payment noted. Owner will verify and confirm your booking.'
        : '🏨 Booking received! You will pay at the hotel on check-in.'

      const successEl = document.getElementById('bookingSuccess')
      successEl.innerHTML = `
        <div class="success-icon">${booking.paymentMethod === 'razorpay' ? '🎉' : booking.paymentMethod === 'upi' ? '📱' : '✅'}</div>
        <h3>Booking Request Sent!</h3>
        <p>${payMsg}</p>
        <div class="booking-code">Booking ID: ${booking.bookingCode}</div>
        <p style="margin-top:12px;font-size:.78rem;color:var(--muted)">
          The owner will contact you at <strong>${booking.customerPhone}</strong> to confirm.
        </p>
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

// ── Helpers ────────────────────────────────────────────────
function showToast(msg, isError) {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.className   = 'toast show' + (isError ? ' error' : '')
  setTimeout(() => { t.className = 'toast' }, 4000)
}

// Expose to HTML
window.openBookingModal   = openBookingModal
window.closeBookingModal  = closeBookingModal
window.submitBooking      = submitBooking
window.onRoomTypeChange   = onRoomTypeChange
window.recalcPrice        = recalcPrice
window.payWithRazorpay    = payWithRazorpay
window.showUpiQR          = showUpiQR
window.confirmUpiPayment  = confirmUpiPayment
window.payAtHotel         = payAtHotel
window.backToForm         = backToForm
window.backToPayment      = backToPayment
