// ============================================================
//  JAY PALACE — Booking Logic (Frontend)
//  Uses Firebase Firestore to store bookings
//  Uses WhatsApp wa.me links for notifications (no API cost)
// ============================================================

// ── Firebase Init ──────────────────────────────────────────
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'
import { getFirestore, collection, addDoc, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'

const app = initializeApp(FIREBASE_CONFIG)
const db  = getFirestore(app)

// ── Page Init ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderRooms()
  renderAmenities()
  renderContact()
  populateRoomSelect()
  setMinDates()
})

// ── Render Rooms ───────────────────────────────────────────
function renderRooms() {
  const grid = document.getElementById('roomsGrid')
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
          ${room.amenities.slice(0, 5).map(a => `<span>${a}</span>`).join('')}
          ${room.amenities.length > 5 ? `<span>+${room.amenities.length - 5} more</span>` : ''}
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
  document.getElementById('contactPhone').textContent   = HOTEL.phone
  document.getElementById('contactEmail').textContent   = HOTEL.email
  document.getElementById('contactAddress').textContent = HOTEL.address
  document.getElementById('contactTimes').textContent   =
    `Check-in: ${HOTEL.checkIn} · Check-out: ${HOTEL.checkOut}`

  const wa = document.getElementById('contactWA')
  wa.href = `https://wa.me/${HOTEL.whatsapp}?text=Hello%20Jay%20Palace%2C%20I%20have%20a%20query.`
  wa.textContent = 'Chat on WhatsApp'

  const waFloat = document.getElementById('waFloat')
  waFloat.href = `https://wa.me/${HOTEL.whatsapp}?text=Hello%20Jay%20Palace!`

  const mapLinkEl = document.getElementById('mapLink')
  if (HOTEL.mapLink && HOTEL.mapLink !== '#') mapLinkEl.href = HOTEL.mapLink
}

// ── Room Select Dropdown ───────────────────────────────────
function populateRoomSelect() {
  const sel = document.getElementById('roomType')
  ROOMS.forEach(room => {
    const opt = document.createElement('option')
    opt.value = room.id
    opt.textContent = `${room.name} — ₹${room.price.toLocaleString('en-IN')}/night`
    sel.appendChild(opt)
  })
}

// ── Date helpers ───────────────────────────────────────────
function setMinDates() {
  const today = new Date().toISOString().split('T')[0]
  document.getElementById('checkIn').min  = today
  document.getElementById('checkOut').min = today
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

  const base = nights * room.price
  const gst  = HOTEL.gst ? Math.round(base * HOTEL.gst / 100) : 0
  const total = base + gst

  document.getElementById('priceLabel').textContent = `${nights} night${nights > 1 ? 's' : ''} × ₹${room.price.toLocaleString('en-IN')}`
  document.getElementById('priceBase').textContent  = `₹${base.toLocaleString('en-IN')}`
  document.getElementById('priceTotal').textContent = `₹${total.toLocaleString('en-IN')}`

  const gstRow = document.getElementById('gstRow')
  if (HOTEL.gst) {
    gstRow.style.display = 'flex'
    document.getElementById('priceGst').textContent = `₹${gst.toLocaleString('en-IN')}`
  } else {
    gstRow.style.display = 'none'
  }

  document.getElementById('priceSummary').style.display = 'block'

  // Update check-out min
  const nextDay = new Date(checkIn)
  nextDay.setDate(nextDay.getDate() + 1)
  document.getElementById('checkOut').min = nextDay.toISOString().split('T')[0]
}

function onRoomTypeChange() {
  const roomId = document.getElementById('roomType').value
  const room   = ROOMS.find(r => r.id === roomId)
  if (room) {
    document.getElementById('selectedRoomId').value   = room.id
    document.getElementById('modalRoomEmoji').textContent = room.emoji
    document.getElementById('modalRoomName').textContent  = room.name
    document.getElementById('modalRoomPrice').textContent = `₹${room.price.toLocaleString('en-IN')} / night`
    recalcPrice()
  }
}

// ── Modal Open/Close ───────────────────────────────────────
function openBookingModal(roomId) {
  const modal   = document.getElementById('bookingModal')
  const form    = document.getElementById('bookingForm')
  const success = document.getElementById('bookingSuccess')

  form.style.display    = 'block'
  success.style.display = 'none'
  modal.classList.add('open')

  if (roomId) {
    document.getElementById('roomType').value     = roomId
    document.getElementById('selectedRoomId').value = roomId
    onRoomTypeChange()
  } else {
    // default to first room
    const first = ROOMS[0]
    document.getElementById('roomType').value     = first.id
    document.getElementById('selectedRoomId').value = first.id
    onRoomTypeChange()
  }
  setMinDates()
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.remove('open')
  document.getElementById('bookingForm').reset()
  document.getElementById('priceSummary').style.display = 'none'
}

// close on overlay click
document.getElementById('bookingModal').addEventListener('click', function(e) {
  if (e.target === this) closeBookingModal()
})

// ── Submit Booking ─────────────────────────────────────────
async function submitBooking(e) {
  e.preventDefault()

  const btn    = document.getElementById('submitBtn')
  const roomId = document.getElementById('selectedRoomId').value || document.getElementById('roomType').value
  const room   = ROOMS.find(r => r.id === roomId)

  const checkIn  = document.getElementById('checkIn').value
  const checkOut = document.getElementById('checkOut').value
  const nights   = Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000)

  if (nights < 1) { showToast('Please select valid check-in and check-out dates', true); return }

  const base  = nights * room.price
  const gst   = HOTEL.gst ? Math.round(base * HOTEL.gst / 100) : 0
  const total = base + gst

  const phone = document.getElementById('guestPhone').value.trim()
  if (!/^\+?[0-9\s\-]{10,15}$/.test(phone)) {
    showToast('Please enter a valid phone number', true); return
  }

  const bookingCode = 'JP-' + Date.now().toString().slice(-6)

  const booking = {
    bookingCode,
    customerName:    document.getElementById('guestName').value.trim(),
    customerPhone:   phone,
    customerEmail:   document.getElementById('guestEmail').value.trim(),
    roomId:          room.id,
    roomName:        room.name,
    pricePerNight:   room.price,
    checkIn,
    checkOut,
    nights,
    guests:          parseInt(document.getElementById('guests').value),
    specialRequests: document.getElementById('specialRequests').value.trim(),
    totalAmount:     total,
    gstAmount:       gst,
    status:          'pending',
    paymentId:       null,
    createdAt:       serverTimestamp(),
  }

  btn.disabled = true
  btn.textContent = 'Sending...'

  try {
    await addDoc(collection(db, 'bookings'), booking)

    // Notify owner via WhatsApp
    const ownerMsg = encodeURIComponent(
      `🏨 *NEW BOOKING REQUEST*\n\n` +
      `📋 Booking ID: ${bookingCode}\n` +
      `👤 Guest: ${booking.customerName}\n` +
      `📞 Phone: ${booking.customerPhone}\n` +
      `🛏️ Room: ${booking.roomName}\n` +
      `📅 Check-in: ${formatDate(checkIn)}\n` +
      `📅 Check-out: ${formatDate(checkOut)}\n` +
      `🌙 Nights: ${nights}\n` +
      `👥 Guests: ${booking.guests}\n` +
      `💰 Total: ₹${total.toLocaleString('en-IN')}\n` +
      (booking.specialRequests ? `📝 Requests: ${booking.specialRequests}\n` : '') +
      `\nPlease open the admin panel to approve or reject.`
    )
    window.open(`https://wa.me/${HOTEL.whatsapp}?text=${ownerMsg}`, '_blank')

    // Show success
    document.getElementById('bookingForm').style.display    = 'none'
    document.getElementById('bookingSuccess').style.display = 'block'
    document.getElementById('bookingCodeDisplay').textContent = `Booking ID: ${bookingCode}`

  } catch (err) {
    console.error(err)
    showToast('Something went wrong. Please call us directly.', true)
    btn.disabled = false
    btn.textContent = 'Confirm Booking Request'
  }
}

// ── Helpers ────────────────────────────────────────────────
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function showToast(msg, isError = false) {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.className   = 'toast show' + (isError ? ' error' : '')
  setTimeout(() => { t.className = 'toast' }, 3500)
}

// Expose to HTML onclick attributes
window.openBookingModal  = openBookingModal
window.closeBookingModal = closeBookingModal
window.submitBooking     = submitBooking
window.onRoomTypeChange  = onRoomTypeChange
window.recalcPrice       = recalcPrice
