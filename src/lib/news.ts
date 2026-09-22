import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "./firebase";

const COLLECTION = "crm_news";

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  publishedDate: string; // "2025-11-11"
  addedBy: string;
  addedAt: number;
}

export function subscribeNews(cb: (items: NewsItem[]) => void): () => void {
  return onSnapshot(collection(db, COLLECTION), (snap) => {
    const rows = snap.docs.map((d) => d.data() as NewsItem);
    rows.sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));
    cb(rows);
  });
}

export async function addNews(input: Omit<NewsItem, "id" | "addedAt">): Promise<void> {
  const id = `news_${Date.now().toString(36)}`;
  await setDoc(doc(db, COLLECTION, id), { ...input, id, addedAt: Date.now(), _ts: serverTimestamp() });
}

export async function deleteNews(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

// Seeds real, sourced PRESMA/mamak-industry news the first time the app runs
// against an empty news collection. Since this is a static site with no
// scheduled backend job, this feed is admin-curated rather than
// continuously auto-updating — use "Add News" in the panel to keep it fresh.
const SEED: Omit<NewsItem, "id" | "addedAt">[] = [
  {
    title: "Presma: AI, digitalisation key for mamak restaurants to cut dependence on foreign labour",
    summary: "Presma is in talks with technology companies for a system spanning premise setup to daily operations management, aiming to reduce reliance on foreign workers.",
    sourceName: "Malay Mail", sourceUrl: "https://www.malaymail.com/news/malaysia/2025/11/11/presma-ai-digitalisation-key-for-mamak-restaurants-to-cut-dependence-on-foreign-labour/198053",
    publishedDate: "2025-11-11", addedBy: "system",
  },
  {
    title: "600 Indian, mamak restaurants on verge of closure due to lack of workers",
    summary: "Presma and Primas jointly warn that over 600 outlets nationwide risk permanent closure due to a worsening labour shortage.",
    sourceName: "The Vibes", sourceUrl: "https://www.thevibes.com/articles/news/123461/600-indian-mamak-restaurants-on-verge-of-closure-due-to-lack-of-workers-claim-associations",
    publishedDate: "2026-05-30", addedBy: "system",
  },
  {
    title: "Mamak restaurant group renews appeal to hire 15,000 foreign workers",
    summary: "Presma president Jawahar Ali Taib Khan renews the call for government approval to recruit 15,000 foreign workers for the sector.",
    sourceName: "Free Malaysia Today", sourceUrl: "https://www.freemalaysiatoday.com/category/nation/2025/10/08/mamak-restaurant-group-renews-appeal-to-hire-15000-foreign-workers",
    publishedDate: "2025-10-08", addedBy: "system",
  },
  {
    title: "Eateries with Singgah Madani logo offering 30 sen discount on sugar-free drinks",
    summary: "Presma rolls out a healthy-drink discount at nasi kandar chains under the PM's Madani Stopover Programme.",
    sourceName: "Malay Mail", sourceUrl: "https://www.malaymail.com/news/malaysia/2025/02/28/healthy-initiative-eateries-with-singgah-madani-logo-offering-30-sen-discount-on-sugar-free-drinks-says-malaysian-muslim-restaurant-group/168290",
    publishedDate: "2025-02-28", addedBy: "system",
  },
  {
    title: "No 5% price hike at mamak restaurants, says Presma",
    summary: "Presma confirms mamak restaurants nationwide, including in Johor, will not proceed with a proposed 5% price increase.",
    sourceName: "Free Malaysia Today", sourceUrl: "https://www.freemalaysiatoday.com/category/nation/2024/11/14/no-5-price-hike-at-mamak-restaurants-says-presma",
    publishedDate: "2024-11-14", addedBy: "system",
  },
];

export async function seedNewsIfEmpty(): Promise<void> {
  const snap = await getDocs(collection(db, COLLECTION));
  if (!snap.empty) return;
  await Promise.all(SEED.map((item, i) => setDoc(doc(db, COLLECTION, `seed_${i}`), { ...item, id: `seed_${i}`, addedAt: Date.now() })));
}
