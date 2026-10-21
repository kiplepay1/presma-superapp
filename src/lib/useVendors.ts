import { useEffect, useState } from "react";
import { subscribeVendors } from "./vendors";
import type { Vendor } from "../types";

export function useVendors(): { vendors: Vendor[]; loading: boolean } {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return subscribeVendors((rows) => {
      setVendors(rows);
      setLoading(false);
    });
  }, []);

  return { vendors, loading };
}
