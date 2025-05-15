import supabase from "../supabaseClient";

const Notification = async () => {
  const today = new Date();
  const next7Days = new Date();
  next7Days.setDate(today.getDate() + 7);

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("paid", false)
    .lte("invoice_date", next7Days.toISOString().split("T")[0])
    .order("invoice_date", { ascending: true });

  if (error) {
    console.error("Error fetching invoice notifications:", error.message);
    return [];
  }

  return data;
};
export default Notification;
