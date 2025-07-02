// src/pages/PrepPage.jsx
import React, { useEffect, useState } from "react";
import {
  TextField,
  Checkbox,
  IconButton,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import { Delete as DeleteIcon, Undo as UndoIcon } from "@mui/icons-material";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import supabase from "../components/supabaseClient";

const PrepPage = () => {
  const [prepName, setPrepName] = useState("");
  const [taskInput, setTaskInput] = useState("");
  const [prepList, setPrepList] = useState([]);
  const [executedList, setExecutedList] = useState([]);

  // Fetch all tasks from Supabase
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("preplist")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) console.error(error);
    else {
      setPrepList(data.filter((t) => !t.done));
      setExecutedList(data.filter((t) => t.done));
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskInput.trim()) return;

    const { error } = await supabase.from("preplist").insert([
      {
        prep_name: prepName || "Untitled Prep",
        task: taskInput.trim(),
        done: false,
      },
    ]);

    if (error) console.error(error);
    else {
      setTaskInput(""); // clear the input
      fetchTasks(); // re-fetch the full list
    }
  };

  const handleToggleTask = async (task) => {
    const updatedTask = { ...task, done: !task.done };

    const { error } = await supabase
      .from("preplist")
      .update({ done: updatedTask.done })
      .eq("id", task.id);

    if (error) console.error(error);
    else {
      if (updatedTask.done) {
        setPrepList((prev) => prev.filter((t) => t.id !== task.id));
        setExecutedList((prev) => [...prev, updatedTask]);
      } else {
        setExecutedList((prev) => prev.filter((t) => t.id !== task.id));
        setPrepList((prev) => [...prev, updatedTask]);
      }
    }
  };

  // Clear all tasks from the prep list
  const handleClearAll = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this row?"
    );
    if (!confirmDelete) return;
    const { error } = await supabase.from("preplist").delete().neq("id", 0);

    if (error) console.error(error);
    else {
      setPrepList([]);
      setExecutedList([]);
      setPrepName(""); // Clear the Prep Name TextField
      setTaskInput(""); // Clear the Task Input TextField
    }
  };

  // TextField and InputLabel customizations
  const sharedStyles = {
    backgroundColor: "#ebf1fa",
    "& .MuiInputLabel-root": {
      color: "#3FA89B",
      fontSize: 18,
      backgroundColor: "#red",
      px: 1,
    },
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        border: "1px solid #60d394",
      },
      "&:hover fieldset": {
        borderColor: "#60d394",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#25a18e",
      },
    },
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <Box
          p={0}
          display="flex"
          gap={1}
          sx={{
            flexDirection: {
              xs: "column", // Stack vertically on extra-small screens (mobile)
              sm: "row", // Side-by-side on small screens and up
            },
          }}
        >
          {/* Left Column - Prep List */}
          <Box flex={{ xs: "1 1 100%", sm: 1 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ color: "#3FA89B", mb: 2 }}
            >
              MISE-EN-PLACE LIST
            </Typography>
            <Box // Container for the input and clear button
              display="grid"
              gridTemplateColumns="80% 20%"
              gap={1}
              mb={1}
              sx={{ paddingRight: "10px" }}
            >
              <form onSubmit={handleAddTask} style={{ width: "100%" }}>
                <TextField
                  label="New Task"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddTask(e)}
                  sx={{
                    minWidth: "0",
                    ...sharedStyles,
                    width: "100%",
                    "& .MuiInputBase-input": {
                      color: "#777",
                      fontWeight: 500,
                      fontSize: "1.5rem",
                      backgroundColor: "#f5f5f5",
                      borderRadius: "8px",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                      border: "1px solid #ddd",
                    },
                  }}
                />
              </form>
              <Button
                variant="outlined"
                color="error"
                onClick={handleClearAll}
                sx={{
                  minWidth: "0",
                  width: "100%",
                  height: "70px",
                  borderColor: "#ef476f",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "5px",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  "&:hover": {
                    borderColor: "#d62828",
                  },
                }}
              >
                <DeleteForeverOutlinedIcon
                  sx={{
                    color: "#ef476f",
                    fontSize: "2rem", // Try 2.5rem or larger if needed
                  }}
                />
              </Button>
            </Box>

            <List
              sx={{
                minHeight: "508px",
                maxHeight: "508px",
                overflowY: "auto",
                backgroundColor: "#f5f5f5",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                border: "1px solid #3FA89B",
              }}
            >
              {prepList
                .filter((task) => task && task.task) // filter out nulls or incomplete items
                .map((task) => (
                  <ListItem
                    key={task.id}
                    divider
                    sx={{
                      py: 0, // Reduces vertical padding (default is 1)
                      minHeight: "32px", // Optional: controls total height of the list item
                    }}
                  >
                    <Checkbox
                      onClick={() => handleToggleTask(task)}
                      sx={{ color: "#3FA89B" }}
                    />
                    <ListItemText
                      primary={task.task}
                      primaryTypographyProps={{
                        fontSize: "1.1rem", // ≈14px
                        fontWeight: 300,
                        color: "#4a4e69",
                      }}
                    />
                  </ListItem>
                ))}
            </List>
          </Box>

          {/* Right Column - Executed Tasks */}
          <Box flex={{ xs: "1 1 100%", sm: 1 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ color: "#3FA89B", mb: 2 }}
            >
              COMPLETED TASKS
            </Typography>

            <List
              sx={{
                minHeight: "586px",
                maxHeight: "586px",
                overflowY: "auto",
                backgroundColor: "#f5f5f5",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                border: "1px solid #3FA89B",
              }}
            >
              {executedList.map((task) => (
                <ListItem
                  key={task.id}
                  divider
                  sx={{
                    py: 0, // Reduces vertical padding (default is 1)
                    minHeight: "32px", // Optional: controls total height of the list item
                  }}
                >
                  <ListItemText
                    primary={task.task}
                    onClick={() => handleToggleTask(task)}
                    primaryTypographyProps={{
                      fontSize: "1.1rem", // ≈14px
                      fontWeight: 300,
                      color: "#4a4e69",
                      sx: {
                        cursor: "pointer",
                        "&:hover": {
                          color: "#457b9d",
                        },
                      }, // Optional: for pointer style
                    }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      onClick={() => handleToggleTask(task)}
                      edge="end"
                      size="small"
                    >
                      <UndoIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      </main>
    </div>
  );
};

export default PrepPage;
