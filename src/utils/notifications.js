// // src/utils/notifications.js

// export async function AgendaNotification() {
//   if ("Notification" in window) {
//     const permission = await Notification.requestPermission();
//     if (permission === "granted") {
//       console.log("✅ Notification permission granted.");
//     } else {
//       console.warn("❌ Notification permission denied.");
//     }
//   }
// }

// import dayjs from "dayjs";

// export function notifyUpcomingInvoice(invoice) {
//   const daysUntilDue = dayjs(invoice.invoice_date).diff(dayjs(), "day");
//   const notifiedInvoices = JSON.parse(
//     localStorage.getItem("notifiedInvoices") || "[]"
//   );

//   if (
//     daysUntilDue === 7 &&
//     !notifiedInvoices.includes(invoice.id) &&
//     Notification.permission === "granted"
//   ) {
//     new Notification("📅 Invoice Due Soon", {
//       body: `Invoice #${invoice.id} is due in 7 days (€${
//         invoice.amount_ttc?.toFixed(2) ?? "N/A"
//       }).`,
//       icon: `${process.env.PUBLIC_URL}/icon-192x192.png`,
//       tag: `invoice-${invoice.id}`,
//     });

//     // Save notified invoices to prevent future duplicate notifications
//     notifiedInvoices.push(invoice.id);
//     localStorage.setItem("notifiedInvoices", JSON.stringify(notifiedInvoices));
//   }
// }
