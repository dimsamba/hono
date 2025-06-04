import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
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
    <div className="flex-1 overflow-auto relative z-10 bg-gray-100">
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <motion.div
          className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <div className="flex flex-col gap-5 lg:flex-row">
            <div className="w-full lg:w-1/2 max-h-[250px] bg-gray-100 pt-4 pr-4 pl-4 pb-2 bg-opacity-80 backdrop-blur-md overflow-hidden rounded-xl border border-gray-300">
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
                    color: "#111",
                    fontSize: "14px",
                    mt: 2,
                  }}
                >
                  Appointments
                </Typography>

                <TextField
                  value={events.length}
                  slotProps={{ readOnly: true }}
                  sx={{
                    ml: 2,
                    width: 200,
                    input: {
                      color: "#111",
                      textAlign: "right", // ✅ Apply text alignment here
                    },
                    "& .MuiOutlinedInput-root": {},
                    "& .MuiInputLabel-root": {
                      color: "#333",
                      fontSize: 16,
                    },
                  }}
                />
              </Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <List
                  dense
                  sx={{
                    height: 150,
                    border: "1px solid lightGray",
                    borderRadius: 1,
                    overflowY: "auto",
                    backgroundColor: "#F9F9F9",
                    "&::-webkit-scrollbar": { display: "none" },
                  }}
                >
                  {events.map((event) => (
                    <ListItem key={event.id} disablePadding>
                      <ListItemButton
                        onClick={() => setSelectedTask(event.task)}
                        sx={{
                          "&:hover": {
                            backgroundColor: "#f0f0f9", // or any light color for hover
                          },
                          py: 0.1, // optional: reduce vertical padding on the button itself
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                            color: "#333",
                          }}
                        >
                          <Box sx={{ width: "70%" }}>
                            <ListItemText
                              primary={event.title}
                              primaryTypographyProps={{
                                fontSize: 14,
                                color: "#444",
                                lineHeight: 1.4,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            />
                          </Box>

                          <Box sx={{ width: "30%", textAlign: "right" }}>
                            <ListItemText
                              primary={new Date(event.date).toLocaleDateString(
                                "fr-FR"
                              )}
                              primaryTypographyProps={{
                                fontSize: 14,
                                color: "#444",
                                lineHeight: 1.4,
                              }}
                            />
                          </Box>
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </FormControl>
            </div>

            <div className="w-full lg:w-1/2 max-h-[250px] bg-gray-100 pt-4 pr-4 pl-4 pb-2 bg-opacity-80 backdrop-blur-md overflow-hidden rounded-xl border border-gray-300">
              {/* Text Box with task descriptions */}
              <FormControl fullWidth sx={{ mb: 0 }}>
                <FormLabel sx={{ color: "#555", fontSize: 14, mt: 2, mb: 2 }}>
                  Description
                </FormLabel>
                <TextField
                  fullWidth
                  multiline
                  readOnly
                  rows={6}
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  sx={{
                    backgroundColor: "#FAFAFA",
                    "& .MuiOutlinedInput-root": {
                      alignItems: "flex-start",
                      "& textarea": {
                        color: "#444",
                        fontSize: 16,
                        padding: "2px", // optional, improves layout
                      },
                      "& fieldset": {
                        borderColor: "lightGray",
                      },
                      "&:hover fieldset": {
                        borderColor: "lightGray",
                      },
                    },
                  }}
                />
              </FormControl>
            </div>
          </div>
          {/* Calendar */}
          <div className="w-full lg:w-122 bg-gray-100 pt-4 pr-4 mt-3 pl-4 pb-2 bg-opacity-80 backdrop-blur-md overflow-hidden rounded-xl border border-gray-300">
            <Box
              sx={{
                flex: 1,
                "& .fc-theme-standard td": {
                  color: "#333",
                },
                "& .fc table": {
                  background: "#FAFAFA",
                  borderColor: "#CCC",
                },
                "& .fc": {
                  backgroundColor: "#ffffff",
                  color: "#111111",
                  fontFamily: `'Inter', sans-serif`,
                },
                "& .fc .fc-toolbar-title": {
                  color: "#111111",
                  fontWeight: 400,
                },
                "& .fc .fc-button": {
                  backgroundColor: "#f3f4f6 !important",
                  color: "#111111 !important",
                  border: "1px solid #d1d5db !important",
                  textTransform: "capitalize",
                  fontSize: "14px",
                },
                "& .fc .fc-button:hover": {
                  backgroundColor: "#e5e7eb !important",
                },
                "& .fc .fc-daygrid-day-number": {
                  color: "#111111",
                  fontWeight: 500,
                },
                "& .fc .fc-col-header-cell": {
                  backgroundColor: "#f9fafb",
                  color: "#4b5563",
                  fontWeight: 600,
                },
                "& .fc .fc-event": {
                  backgroundColor: "#bae6fd !important",
                  color: "#111 !important",
                  border: "none !important",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontSize: "14px",
                },
                "& .fc-h-event .fc-event-main": {
                  color: "#333 !important",
                  fontSize: 16,
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
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default CalendarPage;
