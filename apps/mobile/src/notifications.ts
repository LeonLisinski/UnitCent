import * as Notifications from "expo-notifications";
import { occurrenceDate, yearMonthOf, formatEur } from "@unitcent/core";
import { kvGet, kvSet, listRecurring, today } from "./db/repo";

const KEY = "reminders.enabled";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function remindersEnabled(): boolean {
  return kvGet(KEY) === "1";
}

/** Traži dopuštenje i uključuje podsjetnike. Vraća true ako je dopušteno. */
export async function enableReminders(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  let granted = cur.granted;
  if (!granted) granted = (await Notifications.requestPermissionsAsync()).granted;
  kvSet(KEY, granted ? "1" : "0");
  if (granted) await rescheduleReminders();
  return granted;
}

export async function disableReminders(): Promise<void> {
  kvSet(KEY, "0");
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Lokalni podsjetnici (rade bez interneta): dan prije svake naplate u 9:00,
 * za sljedećih ~35 dana. Poziva se pri pokretanju i nakon izmjene pretplata.
 */
export async function rescheduleReminders(): Promise<void> {
  if (!remindersEnabled()) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const items = listRecurring().filter((i) => i.active && i.amountCents > 0);
  const now = new Date();
  const horizon = now.getTime() + 35 * 24 * 3600 * 1000;

  const months = new Set<string>([yearMonthOf(today())]);
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  months.add(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);

  let scheduled = 0;
  for (const month of months) {
    for (const it of items) {
      const date = occurrenceDate(it, month);
      if (!date) continue;
      const [y, m, d] = date.split("-").map(Number) as [number, number, number];
      const fire = new Date(y, m - 1, d - 1, 9, 0, 0); // lokalno vrijeme uređaja, dan prije
      if (fire.getTime() <= now.getTime() || fire.getTime() > horizon) continue;
      if (scheduled >= 60) return; // iOS ograničava na 64 lokalne obavijesti
      await Notifications.scheduleNotificationAsync({
        content: { title: "Sutra naplata", body: `${it.name} · ${formatEur(it.amountCents)}` },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fire },
      });
      scheduled += 1;
    }
  }
}
