// ============================================================
//  JAY PALACE — Central Configuration
//  TODO: Fill in all values marked with TODO before going live
// ============================================================

// Assigned to window so ES modules (booking.js, admin.js) can read them as globals
window.HOTEL = {
  name:        'Hotel Jay Palace',
  tagline:     "Saraipali's Finest Hotel",
  phone:       '+91 75877 80043',
  whatsapp:    '917587780043',
  email:       'thehoteljaypalace@gmail.com',
  address:     'Main Road, Saraipali, Chhattisgarh 493558',
  mapLink:     'https://maps.app.goo.gl/wbtZpwUweqdRTicHA',
  checkIn:     '12:00 PM',
  checkOut:    '11:00 AM',
  gst:         0,                       // GST % to add on total (e.g. 12 for 12%). 0 = no GST
  upiId:       'HOTELJAYPALACE309@iob',
}

window.ROOMS = [
  {
    id:        'standard',
    name:      'Standard Room',
    price:     1500,                    // TODO: update price (₹ per night)
    emoji:     '🛏️',
    gradient:  'linear-gradient(135deg, #1a3a5c, #0c1b33)',
    desc:      'Comfortable AC room with attached bath, LED TV and free WiFi. Perfect for solo travellers and couples.',
    amenities: ['Air Conditioning', 'LED TV', 'Free WiFi', 'Hot Water', 'Room Service'],
    maxGuests: 2,
    beds:      '1 Double Bed',
  },
  {
    id:        'deluxe',
    name:      'Deluxe Room',
    price:     2500,                    // TODO: update price
    emoji:     '🏨',
    gradient:  'linear-gradient(135deg, #1a1040, #2e1870)',
    desc:      'Spacious deluxe room with king-size bed, premium furnishings, and city view. Ideal for business travellers.',
    amenities: ['Air Conditioning', 'King-Size Bed', 'LCD TV', 'Free WiFi', 'Mini Bar', 'Room Service', 'Balcony'],
    maxGuests: 2,
    beds:      '1 King Bed',
  },
  {
    id:        'family',
    name:      'Family Room',
    price:     3500,                    // TODO: update price
    emoji:     '👨‍👩‍👧‍👦',
    gradient:  'linear-gradient(135deg, #1a2a3a, #2a4a6a)',
    desc:      'Spacious family room with two double beds, extra seating and child-friendly amenities.',
    amenities: ['Air Conditioning', '2 Double Beds', 'LCD TV', 'Free WiFi', 'Mini Fridge', 'Room Service'],
    maxGuests: 4,
    beds:      '2 Double Beds',
  },
  {
    id:        'suite',
    name:      'Executive Suite',
    price:     5000,                    // TODO: update price
    emoji:     '👑',
    gradient:  'linear-gradient(135deg, #2a1800, #5a3a00)',
    desc:      'Luxurious suite with separate living area, premium amenities and panoramic views. The ultimate stay.',
    amenities: ['Air Conditioning', 'King-Size Bed', 'Smart TV', 'Free WiFi', 'Mini Bar', '24/7 Room Service', 'Living Room', 'Premium Bath'],
    maxGuests: 2,
    beds:      '1 King Bed + Sofa',
  },
]

window.AMENITIES = [
  { icon: '🍽️', name: 'Restaurant',      desc: 'Multi-cuisine family dining' },
  { icon: '🎉', name: 'Party Hall',       desc: 'Weddings & celebrations' },
  { icon: '❄️', name: 'AC & Non-AC',     desc: 'Choose your comfort' },
  { icon: '🕐', name: 'Hotel 24×7',      desc: 'Round-the-clock service' },
  { icon: '📶', name: 'Free WiFi',        desc: 'High-speed internet' },
  { icon: '🅿️', name: 'Free Parking',    desc: 'Safe parking on premises' },
  { icon: '🚿', name: 'Hot Water',        desc: '24-hour hot water supply' },
  { icon: '📺', name: 'Cable TV',         desc: 'All rooms with TV' },
]

// ─── Firebase Config ─────────────────────────────────────────
// TODO: Replace with your Firebase project config
// Get from: Firebase Console → Project Settings → Your Apps
window.FIREBASE_CONFIG = {
  apiKey:            'AIzaSyDT1ZotHF6-f3gNsjztIWnFjI1ZULqpG5M',
  authDomain:        'hotel-jay-palace.firebaseapp.com',
  projectId:         'hotel-jay-palace',
  storageBucket:     'hotel-jay-palace.firebasestorage.app',
  messagingSenderId: '705010216944',
  appId:             '1:705010216944:web:287f183f65abd1b183f735',
  measurementId:     'G-1HXYFHW60R',
}

// ─── Razorpay Config ─────────────────────────────────────────
// TODO: Replace with your Razorpay Key ID
// Get from: Razorpay Dashboard → Settings → API Keys
window.RAZORPAY_KEY  = 'rzp_test_XXXXXXXXXXXXXXXX'  // use rzp_live_xxx for production

// ─── Admin Config ────────────────────────────────────────────
// TODO: Create this email/password in Firebase Console → Authentication
window.ADMIN_EMAIL = 'omnayak27199@gmail.com'

// ─── EmailJS Config ──────────────────────────────────────────
// Used to send booking confirmation + receipt emails to guests
// Setup: https://www.emailjs.com → free account → 200 emails/month
// TODO: Fill after creating EmailJS account (see setup guide)
// ─── Gmail API Config ─────────────────────────────────────────
// Enables sending emails directly from thehoteljaypalace@gmail.com — no third-party service.
// Setup (5 min): https://console.cloud.google.com
//   1. Select project hotel-jay-palace
//   2. APIs & Services → Library → search "Gmail API" → Enable
//   3. APIs & Services → Credentials → Create → OAuth 2.0 Client ID
//      Type: Web application · Authorised origin: https://jaypalace.online
//   4. Copy the Client ID and paste it below
window.GMAIL_CLIENT_ID = 'YOUR_OAUTH_CLIENT_ID.apps.googleusercontent.com'

// ─── WhatsApp Business Cloud API Config ──────────────────────
// Optional: enables fully automatic (zero-click) WhatsApp messages from admin panel.
// Without this, messages open as wa.me links (admin still needs to tap Send).
// Setup: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
// TODO: Fill after registering a WhatsApp Business account + Meta API token
window.WHATSAPP_API = {
  token:   'YOUR_WHATSAPP_TOKEN',   // Meta → System User Access Token (never expires)
  phoneId: 'YOUR_PHONE_NUMBER_ID',  // WhatsApp → API Setup → Phone Number ID
}
