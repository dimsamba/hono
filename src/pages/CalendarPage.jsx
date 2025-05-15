import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useRef } from "react";

import {
  Box,
  TextField,
  Typography,
  FormControl,
  FormLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { useTheme } from "@mui/material";
import { tokens } from "../components/theme";
import supabase from "../components/supabaseClient";

const CalendarPage = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [events, setEvents] = useState([]);
  const [selectedTask, setSelectedTask] = useState("");
  const [userId, setUserId] = useState(null);

  const location = useLocation();
  const { taskDate, taskId } = location.state || {};
  const calendarRef = useRef(null);

  // Use Fetch to locate a specific task so it can be reach from the notification Icon
  // on the top bar
  useEffect(() => {
    if (taskDate && calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(taskDate); // Scroll to the correct date
    }

    if (taskId) {
      // Optionally do something more to highlight the task
      // You could set a highlightedTaskId state and style the event
      console.log("Target event ID:", taskId);
    }
  }, [taskDate, taskId, events]); // Include events to make sure they're loaded

  // Add appointment
  const handleDateClick = async (info) => {
    const title = prompt("Enter appointment title:");
    const task = prompt("Add a task description (optional):");

    if (title && userId) {
      const { data, error } = await supabase
        .from("agenda")
        .insert([
          {
            entry_name: title,
            task: task || "",
            date: info.dateStr,
            user_id: userId,
          },
        ])
        .select();

      if (error) {
        console.error("Insert error:", error.message);
      } else if (data && data.length > 0) {
        setEvents((prev) => [
          ...prev,
          {
            title,
            date: info.dateStr,
            task,
            id: data[0].id,
          },
        ]);
      } else {
        console.warn("Insert succeeded but returned no data.");
      }
    }
  };

  // Load appointments
  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase.from("agenda").select("*");
      if (error) {
        console.error("Error fetching agenda:", error.message);
      } else {
        const formatted = data.map((item) => ({
          id: item.id,
          title: item.entry_name,
          date: item.date,
          task: item.task,
        }));
        setEvents(formatted);
      }
    };
    fetchEvents();
  }, []);

  // Load current user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  // Function to Delete apponitment
  const handleEventClick = async (clickInfo) => {
    const confirmed = window.confirm(
      `Delete appointment: "${clickInfo.event.title}"?`
    );

    if (confirmed) {
      // Delete from Supabase
      const { error } = await supabase
        .from("agenda")
        .delete()
        .eq("id", clickInfo.event.id); // assuming event.id matches your DB row id

      if (error) {
        console.error("Error deleting appointment:", error.message);
      } else {
        // Remove from UI
        clickInfo.event.remove();
      }
    }
  };

  return (
    <div className="flex-1 overflow-auto relative z-10 bg-primary-700">
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {/* Title */}
          <Typography
            variant="h6"
            color="white"
            gutterBottom
            sx={{
              display: "flex",
              color: "white",
              fontSize: "18px",
            }}
          >
            Appointments
          </Typography>

          <TextField
            label="Number of Appointments"
            value={events.length}
            slotProps={{ readOnly: true }}
            sx={{
              ml: 2,
              mb: 2,
              width: 200,
              input: { color: "white" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: colors.greenAccent[400] },
                "&:hover fieldset": { borderColor: colors.greenAccent[300] },
              },
              "& .MuiInputLabel-root": { color: "white" },
            }}
          />
        </Box>

        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-1 lg:grid-cols-2 mb-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <FormControl fullWidth sx={{ mb: 2 }}>
            <FormLabel sx={{ color: "lightGray" }}>Events</FormLabel>
            <List
              dense
              sx={{
                height: 150,
                border: `1px solid ${colors.greenAccent[400]}`,
                borderRadius: 1,
                overflowY: "auto",
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {events.map((event) => (
                <ListItem key={event.id} disablePadding>
                  <ListItemButton onClick={() => setSelectedTask(event.task)}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <Box sx={{ width: "70%" }}>
                        <ListItemText primary={event.title} />
                      </Box>
                      <Box sx={{ width: "30%", textAlign: "right" }}>
                        <ListItemText
                          primary={new Date(event.date).toLocaleDateString(
                            "fr-FR"
                          )}
                        />
                      </Box>
                    </Box>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </FormControl>

          {/* Text Box with task descriptions */}
          <FormControl fullWidth sx={{ mb: 0 }}>
          <FormLabel sx={{ color: "lightGray" }}>Description</FormLabel>
          <TextField
            fullWidth
            multiline
            InputProps={{
              readOnly: true,
            }}
            rows={6}
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
            slotProps={{
              style: { color: "white" },
            }}
            sx={{
              scrollbarWidth: "none", // Firefox
              msOverflowStyle: "none", // IE
              "& .MuiOutlinedInput-root": {
                alignItems: "flex-start", // Top-align text
                "& fieldset": {
                  borderColor: colors.greenAccent[400],
                },
                "&:hover fieldset": {
                  borderColor: colors.greenAccent[300],
                },
              },
            }}
          />
          </FormControl>
        </motion.div>

        {/* Calendar */}
        <Box
          sx={{
            flex: 1,
            border: "black",
            "& .fc-theme-standard td": {
              color: "lightGray",
              borderColor: "dimGray",
            },
            "& .fc table": {
              background: "#2D3E50",
              borderColor: "dimGray",
              border: `1px solid ${colors.greenAccent[400]}`,
              borderRadius: 1,
            },
          }}
        >
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
            }}
            initialView="dayGridMonth"
            events={events}
            dateClick={handleDateClick}
            editable={true}
            selectable={true}
            selectMirror={true}
            height="auto"
            eventClick={handleEventClick}
               initialEvents={[
              {
                id: "12315",
                title: "All-day event",
                date: "2022-09-14",
              },
              {
                id: "5123",
                title: "Timed event",
                date: "2022-09-28",
              },
            ]}
          />
        </Box>
      </main>
    </div>
  );
};

export default CalendarPage;
