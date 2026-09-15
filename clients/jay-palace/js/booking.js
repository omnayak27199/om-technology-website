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

  document.getElementById('bookingModal').addEventListener('click', function(e) {
    if (e.target === this) closeBookingModal()
  })

  try {
    if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG)
    db = firebase.firestore()
    loadRoomsFromDB()
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
  const qrUrl   = `https://chart.googleapis.com/chart?chs=220x220&cht=qr&choe=UTF-8&chl=${encodeURIComponent(upiLink)}`

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
      const utrNum   = booking.paymentId && booking.paymentId.startsWith('UTR:')
                     ? booking.paymentId.replace('UTR:', '') : null
      const payLabel = booking.paymentMethod === 'razorpay' ? 'Paid via Razorpay ✓'
                     : booking.paymentMethod === 'upi'      ? `UPI — UTR: ${utrNum || 'unknown'} ⚠️ VERIFY IN PAYTM APP`
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

      // Auto-download PDF receipt for paid/UPI customers
      if (booking.paymentMethod === 'razorpay' || booking.paymentMethod === 'upi') {
        setTimeout(() => generateReceiptPDF(booking), 800)
      }

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

// ── Customer Receipt PDF ───────────────────────────────────
function generateReceiptPDF(booking) {
  if (!window.jspdf) return
  const { jsPDF } = window.jspdf
  const doc  = new jsPDF({ unit: 'mm', format: 'a4' })
  const W    = 210
  const brown = [123, 79, 46]
  const dark  = [26, 15, 8]
  const grey  = [107, 113, 120]
  const light = [250, 248, 245]

  // Header
  doc.setFillColor(...brown)
  doc.rect(0, 0, W, 36, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('HOTEL JAY PALACE', W / 2, 14, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(240, 232, 220)
  doc.text(HOTEL.address, W / 2, 21, { align: 'center' })
  doc.text(`${HOTEL.phone}   |   ${HOTEL.email}`, W / 2, 27, { align: 'center' })

  // Title strip
  doc.setFillColor(240, 232, 220)
  doc.rect(0, 36, W, 9, 'F')
  doc.setTextColor(...brown)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  const isConfirmed = booking.paymentMethod === 'cash'
  doc.text(isConfirmed ? 'BOOKING CONFIRMATION' : 'PAYMENT RECEIPT', W / 2, 42.5, { align: 'center' })

  // Booking ID + date
  let y = 56
  doc.setTextColor(...grey)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text('Booking ID', 130, y)
  doc.text('Date', 130, y + 7)
  doc.text('Payment', 130, y + 14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...dark)
  doc.text(booking.bookingCode, 195, y, { align: 'right' })
  doc.text(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), 195, y + 7, { align: 'right' })
  const payLabel = booking.paymentMethod === 'razorpay' ? 'Online (Razorpay)'
                 : booking.paymentMethod === 'upi'      ? 'UPI Transfer'
                 : 'Pay at Hotel'
  doc.setTextColor(...brown)
  doc.text(payLabel, 195, y + 14, { align: 'right' })

  // Guest box
  doc.setFillColor(...light)
  doc.setDrawColor(224, 213, 204)
  doc.roundedRect(14, y - 4, 100, 28, 3, 3, 'FD')
  doc.setTextColor(...grey)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text('GUEST', 20, y + 2)
  doc.setTextColor(...dark)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(booking.customerName, 20, y + 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...grey)
  doc.text(booking.customerPhone, 20, y + 17)
  if (booking.customerEmail) doc.text(booking.customerEmail, 20, y + 23)

  // Booking details
  y = 92
  doc.setFillColor(...brown)
  doc.rect(14, y, W - 28, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text('BOOKING DETAILS', 20, y + 5.5)

  y += 10
  const rows = [
    ['Room', booking.roomName],
    ['Check-in',  fmtDate(booking.checkIn)  + '  (' + HOTEL.checkIn + ')'],
    ['Check-out', fmtDate(booking.checkOut) + '  (' + HOTEL.checkOut + ')'],
    ['Duration',  booking.nights + ' night' + (booking.nights > 1 ? 's' : '')],
    ['Guests',    booking.guests + ' guest' + (booking.guests > 1 ? 's' : '')],
  ]
  if (booking.specialRequests) rows.push(['Requests', booking.specialRequests])

  rows.forEach((row, i) => {
    if (i % 2 === 0) { doc.setFillColor(...light); doc.rect(14, y - 1, W - 28, 8, 'F') }
    doc.setTextColor(...grey); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    doc.text(row[0], 20, y + 5)
    doc.setTextColor(...dark); doc.setFont('helvetica', 'bold')
    doc.text(row[1], 100, y + 5)
    y += 8
  })

  // Payment summary
  y += 5
  doc.setFillColor(...brown)
  doc.rect(14, y, W - 28, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text('PAYMENT SUMMARY', 20, y + 5.5)

  y += 10
  const roomTotal = booking.pricePerNight * booking.nights
  const payRows = [
    [`Room (${booking.nights} nights x Rs.${booking.pricePerNight.toLocaleString('en-IN')})`, `Rs.${roomTotal.toLocaleString('en-IN')}`],
  ]
  if (booking.gstAmount) payRows.push(['GST', `Rs.${booking.gstAmount.toLocaleString('en-IN')}`])
  payRows.push(['TOTAL', `Rs.${booking.totalAmount.toLocaleString('en-IN')}`])
  if (booking.paymentId && booking.paymentId !== 'UPI-VERIFY') payRows.push(['Reference', booking.paymentId])

  payRows.forEach((row, i) => {
    const isTotal = row[0] === 'TOTAL'
    if (isTotal) {
      doc.setFillColor(...brown)
      doc.rect(14, y - 1, W - 28, 9, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
    } else {
      if (i % 2 === 0) { doc.setFillColor(...light); doc.rect(14, y - 1, W - 28, 8, 'F') }
      doc.setTextColor(...grey); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    }
    doc.text(row[0], 20, y + 5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(isTotal ? 255 : dark[0], isTotal ? 255 : dark[1], isTotal ? 255 : dark[2])
    doc.text(row[1], W - 18, y + 5, { align: 'right' })
    y += isTotal ? 10 : 8
  })

  // Note for cash/pending
  if (booking.paymentMethod === 'cash') {
    y += 4
    doc.setFillColor(255, 248, 235)
    doc.setDrawColor(215, 150, 40)
    doc.roundedRect(14, y, W - 28, 12, 3, 3, 'FD')
    doc.setTextColor(160, 100, 20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.text('Payment due at hotel check-in. Please carry this confirmation.', W / 2, y + 8, { align: 'center' })
    y += 14
  } else if (booking.paymentMethod === 'upi') {
    y += 4
    doc.setFillColor(240, 253, 244)
    doc.setDrawColor(22, 163, 74)
    doc.roundedRect(14, y, W - 28, 12, 3, 3, 'FD')
    doc.setTextColor(22, 163, 74)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.text('UPI payment received. Booking pending hotel confirmation.', W / 2, y + 8, { align: 'center' })
  }

  // Footer
  const footerY = 270
  doc.setDrawColor(...brown)
  doc.setLineWidth(0.4)
  doc.line(14, footerY, W - 14, footerY)
  doc.setTextColor(...grey)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.text('Thank you for choosing Hotel Jay Palace. We look forward to welcoming you!', W / 2, footerY + 6, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text('Website & Booking by OM Technology · omtechnology.online', W / 2, footerY + 12, { align: 'center' })

  doc.save(`Booking-${booking.bookingCode}.pdf`)
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
