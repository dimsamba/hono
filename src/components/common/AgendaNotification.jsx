import supabase from "../supabaseClient";

const fetchAgendaNotifications = async () => {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("agenda")
    .select("*")
    .gte("date", today)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching agenda:", error.message);
    return [];
  }

  return data;
};

export default fetchAgendaNotifications;
