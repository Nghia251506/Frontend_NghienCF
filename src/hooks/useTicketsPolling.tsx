import { useEffect, useRef, useState } from "react";
import { getTicketsByBooking } from "../service/TicketService";
import type { Ticket } from "../types/Ticket";

export function useTicketsPolling(bookingId: number | null, enabled = true, intervalMs = 2000) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [polling, setPolling] = useState(false);
  const timerRef = useRef<number | null>(null);

  const stop = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPolling(false);
  };

  const tick = async () => {
    if (!bookingId) return;
    try {
      const t = await getTicketsByBooking(bookingId);
      setTickets(t || []);
      // có vé rồi thì dừng poll
      if (t && t.length > 0) stop();
    } catch (e) {
      // có thể log/ toast nếu cần
    }
  };

  useEffect(() => {
    stop();
    if (!enabled || !bookingId) return;

    setPolling(true);
    // gọi ngay 1 phát để nhanh thấy kết quả
    tick();
    timerRef.current = window.setInterval(tick, intervalMs);

    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, enabled, intervalMs]);

  return { tickets, polling, stop, refresh: tick };
}
