// ============================================================
//  JAY PALACE — Booking Logic
// ============================================================

let db = null

// ── Init everything after DOM is ready ────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Render UI immediately — does NOT need Firebase
  renderRooms()
  renderAmenities()
  renderContact()
  populateRoomSelect()
  setMinDates()

  // Close modal on overlay click
  document.getElementById('bookingModal').addEventListener('click', function(e) {
    if (e.target === this) closeBookingModal()
  })

  // Init Firebase (separate — if it fails, UI still works)
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(window.FIREBASE_CONFIG)
    }
    db = firebase.firestore()
    console.log('Firebase ready')
  } catch (e) {
    console.error('Firebase init failed:', e)
  }
})

// ── Render Rooms ───────────────────────────────────────────
function renderRooms() {
  const grid = document.getElementById('roomsGrid')
  if (!grid || !window.ROOMS) return
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

// ── Render Amenities ───────────────────────────────────────
function renderAmenities() {
  const grid = document.getElementById('amenitiesGrid')
  if (!grid || !window.AMENITIES) return
  grid.innerHTML = AMENITIES.map(a => `
    <div class="amenity-card">
      <div class="amenity-icon">${a.icon}</div>
      <div class="amenity-name">${a.name}</div>
      <div class="amenity-desc">${a.desc}</div>
    </div>
  `).join('')
}

// ── Render Contact ─────────────────────────────────────────
function renderContact() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val }
  set('contactPhone',   HOTEL.phone)
  set('contactEmail',   HOTEL.email)
  set('contactAddress', HOTEL.address)
  set('contactTimes',   `Check-in: ${HOTEL.checkIn} · Check-out: ${HOTEL.checkOut}`)

  const wa = document.getElementById('contactWA')
  if (wa) {
    wa.href        = `https://wa.me/${HOTEL.whatsapp}?text=Hello%20Hotel%20Jay%20Palace!`
    wa.textContent = 'Chat on WhatsApp'
  }
  const waFloat = document.getElementById('waFloat')
  if (waFloat) waFloat.href = `https://wa.me/${HOTEL.whatsapp}?text=Hello%20Hotel%20Jay%20Palace!`
}

// ── Room Select Dropdown ───────────────────────────────────
function populateRoomSelect() {
  const sel = document.getElementById('roomType')
  if (!sel) return
  ROOMS.forEach(room => {
    const opt = document.createElement('option')
    opt.value       = room.id
    opt.textContent = `${room.name} — ₹${room.price.toLocaleString('en-IN')}/night`
    sel.appendChild(opt)
  })
}

// ── Dates ──────────────────────────────────────────────────
function setMinDates() {
  const today = new Date().toISOString().split('T')[0]
  const ci = document.getElementById('checkIn')
  const co = document.getElementById('checkOut')
  if (ci) ci.min = today
  if (co) co.min = today
}

function recalcPrice() {
  const checkIn  = document.getElementById('checkIn').value
  const checkOut = document.getElementById('checkOut').value
  const roomId   = document.getElementById('selectedRoomId').value || document.getElementById('roomType').value
  const room     = ROOMS.find(r => r.id === roomId)
  if (!room || !checkIn || !checkOut) return

  const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000)
  if (nights < 1) {
    document.getElementById('checkOut').value = ''
    showToast('Check-out must be after check-in', true)
    return
  }

  const base  = nights * room.price
  const gst   = HOTEL.gst ? Math.round(base * HOTEL.gst / 100) : 0
  const total = base + gst

  document.getElementById('priceLabel').textContent = `${nights} night${nights > 1 ? 's' : ''} × ₹${room.price.toLocaleString('en-IN')}`
  document.getElementById('priceBase').textContent  = `₹${base.toLocaleString('en-IN')}`
  document.getElementById('priceTotal').textContent = `₹${total.toLocaleString('en-IN')}`
  document.getElementById('gstRow').style.display   = HOTEL.gst ? 'flex' : 'none'
  if (HOTEL.gst) document.getElementById('priceGst').textContent = `₹${gst.toLocaleString('en-IN')}`
  document.getElementById('priceSummary').style.display = 'block'

  const next = new Date(checkIn); next.setDate(next.getDate() + 1)
  document.getElementById('checkOut').min = next.toISOString().split('T')[0]
}

function onRoomTypeChange() {
  const roomId = document.getElementById('roomType').value
  const room   = ROOMS.find(r => r.id === roomId)
  if (!room) return
  document.getElementById('selectedRoomId').value       = room.id
  document.getElementById('modalRoomEmoji').textContent = room.emoji
  document.getElementById('modalRoomName').textContent  = room.name
  document.getElementById('modalRoomPrice').textContent = `₹${room.price.toLocaleString('en-IN')} / night`
  recalcPrice()
}

// ── Modal ──────────────────────────────────────────────────
function openBookingModal(roomId) {
  document.getElementById('bookingForm').style.display    = 'block'
  document.getElementById('bookingSuccess').style.display = 'none'
  document.getElementById('bookingModal').classList.add('open')

  const id = roomId || ROOMS[0].id
  document.getElementById('roomType').value       = id
  document.getElementById('selectedRoomId').value = id
  onRoomTypeChange()
  setMinDates()
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.remove('open')
  document.getElementById('bookingForm').reset()
  document.getElementById('priceSummary').style.display = 'none'
}

// ── Submit Booking ─────────────────────────────────────────
function submitBooking(e) {
  e.preventDefault()

  const btn    = document.getElementById('submitBtn')
  const roomId = document.getElementById('selectedRoomId').value || document.getElementById('roomType').value
  const room   = ROOMS.find(r => r.id === roomId)
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
  const bookingCode = 'JP-' + Date.now().toString().slice(-6)

  const booking = {
    bookingCode,
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
    paymentId:       null,
    createdAt:       firebase.firestore.FieldValue.serverTimestamp(),
  }

  btn.disabled = true
  btn.textContent = 'Sending...'

  // Save to Firestore
  if (!db) {
    showToast('Database not connected. Please refresh and try again.', true)
    btn.disabled = false
    btn.textContent = 'Confirm Booking Request'
    return
  }

  db.collection('bookings').add(booking)
    .then(() => {
      // Notify owner via WhatsApp
      const msg = encodeURIComponent(
        `🏨 *NEW BOOKING — Hotel Jay Palace*\n\n` +
        `📋 ID: ${bookingCode}\n👤 ${booking.customerName}\n📞 ${booking.customerPhone}\n` +
        `🛏️ ${booking.roomName}\n📅 ${checkIn} → ${checkOut}\n` +
        `🌙 ${nights} night(s)\n💰 ₹${total.toLocaleString('en-IN')}\n` +
        (booking.specialRequests ? `📝 ${booking.specialRequests}\n` : '') +
        `\nOpen admin panel to approve.`
      )
      window.open(`https://wa.me/${HOTEL.whatsapp}?text=${msg}`, '_blank')

      document.getElementById('bookingForm').style.display    = 'none'
      document.getElementById('bookingSuccess').style.display = 'block'
      document.getElementById('bookingCodeDisplay').textContent = `Booking ID: ${bookingCode}`
    })
    .catch(err => {
      console.error('Firestore error:', err.code, err.message)
      const msg = err.code === 'permission-denied'
        ? 'Permission denied — admin must fix Firestore Security Rules.'
        : `Error: ${err.message}`
      showToast(msg, true)
      btn.disabled = false
      btn.textContent = 'Confirm Booking Request'
    })
}

// ── Helpers ────────────────────────────────────────────────
function showToast(msg, isError) {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.className   = 'toast show' + (isError ? ' error' : '')
  setTimeout(() => { t.className = 'toast' }, 4000)
}

// Expose to HTML onclick handlers
window.openBookingModal  = openBookingModal
window.closeBookingModal = closeBookingModal
window.submitBooking     = submitBooking
window.onRoomTypeChange  = onRoomTypeChange
window.recalcPrice       = recalcPrice
