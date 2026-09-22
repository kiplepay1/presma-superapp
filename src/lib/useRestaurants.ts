import { useEffect, useState } from "react";
import { subscribeRestaurants } from "./restaurants";
import type { Restaurant } from "../types";

export function useRestaurants(): { restaurants: Restaurant[]; loading: boolean } {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeRestaurants((rows) => {
      setRestaurants(rows);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { restaurants, loading };
}
