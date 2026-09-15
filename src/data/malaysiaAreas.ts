// Curated, non-exhaustive list of Malaysian states and their major towns/areas.
// Used for the "pick a state → pick an area" dropdowns in the Restaurant
// Locator. The free-text field alongside these covers anywhere not listed.

export const MALAYSIA_STATES = [
  "Selangor", "Kuala Lumpur", "Putrajaya", "Labuan", "Johor", "Pulau Pinang",
  "Perak", "Kedah", "Perlis", "Kelantan", "Terengganu", "Pahang",
  "Negeri Sembilan", "Melaka", "Sabah", "Sarawak",
] as const;

export const AREAS_BY_STATE: Record<string, string[]> = {
  "Selangor": ["Petaling Jaya", "Shah Alam", "Subang Jaya", "Klang", "Kajang", "Puchong", "Cyberjaya", "Rawang", "Semenyih", "Kuala Selangor", "Sepang", "Banting", "Ampang", "Bangi", "Selayang", "Sungai Buloh", "Batang Kali"],
  "Kuala Lumpur": ["Bukit Bintang", "Cheras", "Kepong", "Setapak", "Bangsar", "Titiwangsa", "Wangsa Maju", "Sentul", "Brickfields", "Mont Kiara"],
  "Putrajaya": ["Putrajaya"],
  "Labuan": ["Labuan Town"],
  "Johor": ["Johor Bahru", "Batu Pahat", "Muar", "Kluang", "Segamat", "Kulai", "Pontian", "Pasir Gudang"],
  "Pulau Pinang": ["Georgetown", "Bukit Mertajam", "Butterworth", "Bayan Lepas", "Air Itam", "Tanjung Bungah", "Nibong Tebal"],
  "Perak": ["Ipoh", "Taiping", "Teluk Intan", "Sitiawan", "Kampar", "Lumut"],
  "Kedah": ["Alor Setar", "Sungai Petani", "Kulim", "Langkawi", "Jitra"],
  "Perlis": ["Kangar", "Arau"],
  "Kelantan": ["Kota Bharu", "Pasir Mas", "Tanah Merah"],
  "Terengganu": ["Kuala Terengganu", "Dungun", "Kemaman"],
  "Pahang": ["Kuantan", "Temerloh", "Bentong", "Raub", "Cameron Highlands"],
  "Negeri Sembilan": ["Seremban", "Port Dickson", "Nilai", "Bahau"],
  "Melaka": ["Melaka City", "Alor Gajah", "Jasin"],
  "Sabah": ["Kota Kinabalu", "Sandakan", "Tawau", "Lahad Datu"],
  "Sarawak": ["Kuching", "Miri", "Sibu", "Bintulu"],
};
