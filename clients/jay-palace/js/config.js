// ============================================================
//  JAY PALACE — Central Configuration
//  TODO: Fill in all values marked with TODO before going live
// ============================================================

// Assigned to window so ES modules (booking.js, admin.js) can read them as globals
window.HOTEL = {
  name:        'Jay Palace',
  tagline:     "Saraipali's Finest Hotel",
  phone:       '+91 XXXXX XXXXX',      // TODO: owner's phone number
  whatsapp:    '91XXXXXXXXXX',          // TODO: owner's WhatsApp (country code + number, no +)
  email:       'jaypalace@gmail.com',   // TODO: hotel email
  address:     'Main Road, Saraipali, Chhattisgarh 493558',
  mapLink:     '#',                     // TODO: paste Google Maps share link here
  checkIn:     '12:00 PM',
  checkOut:    '11:00 AM',
  gst:         0,                       // GST % to add on total (e.g. 12 for 12%). 0 = no GST
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
    gradient:  'linear-gradient(135deg, #2d1a0a, #5a3010)',
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
    gradient:  'linear-gradient(135deg, #1a2a1a, #2a5a2a)',
    desc:      'Luxurious suite with separate living area, premium amenities and panoramic views. The ultimate stay.',
    amenities: ['Air Conditioning', 'King-Size Bed', 'Smart TV', 'Free WiFi', 'Mini Bar', '24/7 Room Service', 'Living Room', 'Premium Bath'],
    maxGuests: 2,
    beds:      '1 King Bed + Sofa',
  },
]

window.AMENITIES = [
  { icon: '🍽️', name: 'Restaurant',      desc: 'Multi-cuisine dining' },
  { icon: '📶', name: 'Free WiFi',        desc: 'High-speed throughout' },
  { icon: '🅿️', name: 'Free Parking',    desc: 'Secure parking available' },
  { icon: '🛎️', name: '24/7 Service',    desc: 'Always here for you' },
  { icon: '❄️', name: 'AC Rooms',        desc: 'All rooms air-conditioned' },
  { icon: '🚿', name: 'Hot Water',        desc: 'Round-the-clock hot water' },
  { icon: '📺', name: 'Cable TV',         desc: 'Premium channels' },
  { icon: '🏢', name: 'Banquet Hall',     desc: 'Events & celebrations' },
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
