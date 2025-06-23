import { create } from "zustand";
import axios from "axios";

const useMinerStore = create((set) => ({
  miners: [], // ✅ đảm bảo khởi tạo là array
  fetchMiners: async () => {
    try {
      const res = await axios.get("/api/miners");
      console.log("🔥 fetched:", res.data); // debug
      set({ miners: Array.isArray(res.data) ? res.data : [] }); // ✅ bảo vệ
    } catch (err) {
      console.error("Failed to fetch miners:", err);
    }
  },
}));

export default useMinerStore;
