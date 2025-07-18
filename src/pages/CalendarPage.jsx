import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import {
  Box,
  FormControl,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import supabase from "../components/supabaseClient";

const CalendarPage = () => {
  const theme = useTheme();
  const [events, setEvents] = useState([]);
  const [selectedTask, setSelectedTask] = useState("");
  const [userId, setUserId] = useState(null);

  const location = useLocation();
  // const { taskDate, taskId } = location.state || {};
  const calendarRef = useRef(null);
  const taskDate = location.state?.taskDate;
  const taskId = location.state?.taskId;

  // Use Fetch to locate a specific task so it can be reach from the notification Icon
  // on the top bar
  useEffect(() => {
    if (calendarRef.current && taskDate) {
      const calendarApi = calendarRef.current.getApi();

      // Use timeout to ensure the calendar has fully mounted
      setTimeout(() => {
        calendarApi.gotoDate(taskDate); // Scroll to taskDate
        calendarApi.changeView("timeGridDay"); // Switch to timeGridDay
      }, 300);
    }
  }, [taskDate]);
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
      <main className="max-w-7xl mx-auto">
        <motion.div className="grid grid-cols-1 gap-0 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 mb-3 content-center">
          <Box sx={{ px: 1 }}>
            {/* Box  */}
            <Box
              sx={{
                display: "flex",
                width: "100%",
              }}
            >
              {/* Title */}
              <Typography
                variant="h6"
                sx={{
                  height: "40px",
                  width: "100%",
                  color: "#3FA89B",
                  textAlign: "left",
                  fontSize: 20,
                  lineHeight: "40px", // vertically center text
                  paddingLeft: "3px", // optional, for some right padding
                }}
              >
                APPOINTMENTS
              </Typography>

              <Typography
                sx={{
                  height: "40px",
                  width: "100%",
                  color: "#3FA89B",
                  textAlign: "right",
                  fontSize: 20,
                  lineHeight: "40px", // vertically center text
                  paddingRight: "3px", // optional, for some right padding
                }}
              >
                {events.length}
              </Typography>
            </Box>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <List
                dense
                sx={{
                  height: 155,
                  border: "1px solid #3FA89B",
                  borderRadius: 1,
                  overflowY: "auto",
                  backgroundColor: "#ebf2fa",
                  "&::-webkit-scrollbar": { display: "none" },
                }}
              >
                {[...events]
                  .filter((e) => !!e.date)
                  .sort((a, b) => new Date(a.date) - new Date(b.date)) // ascending
                  .map((event) => {
                    const isPast =
                      new Date(event.date).setHours(0, 0, 0, 0) <
                      new Date().setHours(0, 0, 0, 0); // compares only by date

                    return (
                      <ListItem key={event.id} disablePadding>
                        <ListItemButton
                          onClick={() => {
                            setSelectedTask(event.task);
                            if (calendarRef.current) {
                              const calendarApi = calendarRef.current.getApi();
                              calendarApi.gotoDate(event.date);
                            }
                          }}
                          selected={selectedTask === event.task}
                          sx={{
                            backgroundColor:
                              selectedTask === event.task
                                ? "#b7efc5"
                                : "transparent",
                            "&:hover": {
                              backgroundColor: "#b7efc5",
                            },
                            py: 0.01,
                          }}
                        >
                          <ListItemText
                            primary={event.title}
                            primaryTypographyProps={{
                              fontSize: 14,
                              color: isPast ? "#cc6600" : "#777", // dark orange if past
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          />

                          <Box sx={{ width: "30%", textAlign: "right" }}>
                            <ListItemText
                              primary={new Date(event.date).toLocaleDateString(
                                "fr-FR"
                              )}
                              primaryTypographyProps={{
                                fontSize: 14,
                                color: isPast ? "#cc6600" : "#777", // dark orange if past
                              }}
                            />
                          </Box>
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
              </List>
            </FormControl>

            {/* Text Box with task descriptions */}
            <Box>
              <FormControl fullWidth>
                <Box
                  sx={{
                    display: "flex",
                    width: "100%",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      height: "40px",
                      width: "100%",
                      color: "#3FA89B",
                      textAlign: "left",
                      fontSize: 20,
                      lineHeight: "40px", // vertically center text
                      paddingLeft: "3px", // optional, for some right padding
                    }}
                  >
                    DESCRIPTION
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  readOnly
                  rows={6}
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  sx={{
                    backgroundColor: "#ebf2fa",
                    height: 150,
                    "& .MuiOutlinedInput-root": {
                      "& textarea": {
                        color: "#777",
                        fontSize: 16,
                      },
                      "& fieldset": {
                        border: "1px solid #3FA89B", // default border
                      },
                      "&:hover fieldset": {
                        border: "1px solid #3FA89B", // keep border on hover
                      },
                      "&.Mui-focused fieldset": {
                        border: "1px solid #3FA89B", // keep border on focus
                      },
                    },
                  }}
                />
              </FormControl>
            </Box>
          </Box>
          {/* Calendar */}
          <Box
            sx={{
              m: 1,
              mt: 3,
              p: 1,
              border: "1px solid #3FA89B",
              backgroundColor: "#ebf2fa",
            }}
          >
            <Box
              sx={{
                flex: 1,
                backgroundColor: "#ebf2fa",
                "& .fc-theme-standard td": {
                  color: "#777",
                },
                "& .fc table": {
                  background: "#FAFAFA",
                  borderColor: "#3FA89B",
                },
                "& .fc": {
                  backgroundColor: "#ebf2fa",
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
                  backgroundColor: "#c7f9cc !important",
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
          </Box>
        </motion.div>
      </main>
    </div>
  );
};

export default CalendarPage;
