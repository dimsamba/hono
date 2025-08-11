import { useState, useEffect } from "react";
import {
  Grid,
  Typography,
  Paper,
  IconButton,
  Box,
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AcUnitOutlinedIcon from "@mui/icons-material/AcUnitOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import KeyboardReturnOutlinedIcon from "@mui/icons-material/KeyboardReturnOutlined";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import supabase from "../supabaseClient";
import { Tooltip } from "@mui/material";

const TempControlPage = () => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editId, setEditId] = useState(null);
  const navigate = useNavigate();
  const [openKeypad, setOpenKeypad] = useState(false);
  const [selectedAppliance, setSelectedAppliance] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const [tempComment, setTempComment] = useState("");

  // Fetch items from Supabase on mount
  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from("appliences")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        console.error("Error fetching items:", error);
      } else {
        setItems(data);
      }
    };

    fetchItems();
  }, []);

  const handleAdd = () => {
    setEditId(null);
    setEditName("");
    setEditDescription("");
    setOpen(true);
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setEditName(item.appliance);
    setEditDescription(item.description);
    setOpen(true);
  };

  const handleSave = async () => {
    if (editId) {
      // Update existing item with .select() to get updated data back
      const { data, error } = await supabase
        .from("appliences")
        .update({
          appliance: editName,
          description: editDescription,
        })
        .eq("id", editId)
        .select();

      if (error) {
        console.error(error);
        return;
      }

      if (data && data.length > 0) {
        setItems((prev) =>
          prev.map((item) => (item.id === editId ? data[0] : item))
        );
      } else {
        console.error("Update returned no data");
      }
    } else {
      // Insert new item
      const { data, error } = await supabase
        .from("appliences")
        .insert([{ appliance: editName, description: editDescription }])
        .select()
        .single();

      if (error) {
        console.error(error);
        return;
      }
      setItems((prev) => [...prev, data]);
    }

    setOpen(false);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Do you want to delete this item?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("appliences").delete().eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClose = () => {
    setOpen(false);
  };

  // Shared TextField styles
  const sharedStyles = {
    "& .MuiInputLabel-root": {
      color: "#38a3a5",
      fontSize: 14,
    },
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        border: "1px solid #38a3a5",
      },
      "&:hover fieldset": {
        borderColor: "darkGreen",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#25a18e",
      },
    },
  };

  // Open keypad for temperature input
  const handleOpenKeypad = (appliance) => {
    setSelectedAppliance(appliance);
    setTempValue("");
    setTempComment("");
    setOpenKeypad(true);
  };

  // Save temperature log
  const handleSaveTemperature = async () => {
    if (!tempValue.trim()) {
      alert("Please enter a temperature before saving.");
      return;
    }

    const now = new Date();
    now.setHours(now.getHours() + 2); // add 2 hours
    const timestamp = now.toISOString();

    const { error } = await supabase.from("temp_logs").insert([
      {
        appliance_name: selectedAppliance.appliance,
        log_date: timestamp,
        temperature: parseFloat(tempValue),
        comment: tempComment,
      },
    ]);

    if (error) {
      console.error("Error saving temperature:", error);
      return;
    }

    setOpenKeypad(false);
  };

  return (
    <Box p={5}>
      {/* Add Button */}
      <Box
        display="flex"
        mb={2}
        sx={{ borderBottom: "1px solid #3FA89B", pb: 2 }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate(-1)}
          sx={{
            mr: 2,
            backgroundColor: "#778da9",
            color: "#fff",
            "&:hover": {
              backgroundColor: "#415a77",
            },
            height: 40,
            borderRadius: 2,
          }}
        >
          <KeyboardReturnOutlinedIcon />
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutlineIcon />}
          onClick={handleAdd}
          sx={{
            backgroundColor: "#3FA89B",
            color: "#fff",
            "&:hover": {
              backgroundColor: "#2f7f7a",
            },
            height: 40,
            width: 200,
            display: "flex",
            borderRadius: 2,
          }}
        >
          Add Appliance
        </Button>

        {/* Dialog for adding/editing items */}
        <Dialog
          open={open}
          onClose={handleClose}
          PaperProps={{
            sx: {
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
              padding: 1,
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 600, color: "#3FA89B", fontSize: 20 }}>
            {editId ? "Edit Item" : "Add New Item"}
          </DialogTitle>

          <DialogContent dividers>
            <TextField
              label="Item Name"
              fullWidth
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              sx={{
                ...sharedStyles,
                "& .MuiInputBase-input": { color: "#3FA89B", fontSize: 16 },
              }}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              sx={{
                ...sharedStyles,
                mt: 2,
                "& .MuiInputBase-input": { color: "#3FA89B", fontSize: 16 },
              }}
            />
          </DialogContent>

          <DialogActions>
            <Button
              variant="contained"
              onClick={handleClose}
              sx={{
                width: 100,
                backgroundColor: "#f0c808",
                color: "#333",
                "&:hover": { backgroundColor: "#ffba08" },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => handleSave()}
              sx={{
                width: 100,
                mr: 2,
                backgroundColor: "#3FA89B",
                "&:hover": { backgroundColor: "#2f7f7a" },
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Key pad */}
        <Dialog
          open={openKeypad}
          onClose={() => setOpenKeypad(false)}
          PaperProps={{
            sx: {
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
              padding: 1,
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 600, color: "#3FA89B", fontSize: 20 }}>
            Enter Temperature for {selectedAppliance?.appliance}
          </DialogTitle>

          <DialogContent>
            <Box display="flex" justifyContent="center" mb={2}>
              <TextField
                value={tempValue}
                sx={{
                  ...sharedStyles,
                  "& .MuiInputBase-input": { color: "#3FA89B", fontSize: 16 },
                }}
                inputProps={{
                  readOnly: true,
                }}
              />
            </Box>

            <Box
              display="grid"
              gridTemplateColumns="repeat(3, 60px)"
              gap={1}
              justifyContent="center"
            >
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "-", "0", "."].map(
                (key) => (
                  <Button
                    key={key}
                    variant="contained"
                    onClick={() => setTempValue((prev) => prev + key)}
                    sx={{
                      fontSize: 26,
                      bgcolor: "#fff",
                      border: "1px solid #3FA89B",
                      color: "#555",
                      "&:hover": {
                        bgcolor: "#e6f2f1",
                        borderColor: "#3FA89B",
                      },
                    }}
                  >
                    {key}
                  </Button>
                )
              )}
            </Box>

            <TextField
              label="Comment (optional)"
              fullWidth
              multiline
              rows={3}
              value={tempComment}
              onChange={(e) => setTempComment(e.target.value)}
              sx={{
                ...sharedStyles,
                mt: 3,
                "& .MuiInputBase-input": { color: "#3FA89B", fontSize: 16 },
              }}
            />
          </DialogContent>

          {/* Dialog Actions */}
          <DialogActions
            sx={{
              display: "flex",
              gap: 1,
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <Button
              variant="contained"
              onClick={handleSaveTemperature}
              sx={{
                flex: 1,
                height: 40,
                backgroundColor: "#3FA89B",
                "&:hover": { backgroundColor: "#2f7f7a" },
              }}
            >
              Save
            </Button>

            <Button
              variant="contained"
              onClick={() => {
                setTempValue("");
                setTempComment("");
              }}
              sx={{
                flex: 1,
                height: 40,
                backgroundColor: "#9eb3c2",
                "&:hover": { backgroundColor: "#4f6d7a" },
              }}
            >
              Clear
            </Button>

            <Button
              variant="contained"
              onClick={() => setOpenKeypad(false)}
              sx={{
                flex: 1,
                height: 40,
                backgroundColor: "#ff6b35",
                "&:hover": { backgroundColor: "#d1495b" },
              }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      {/* Items Grid */}
      <Grid container spacing={3}>
        {items.map((item) => {
          if (!item) return null; // skip null or undefined items
          return (
            <Grid item key={item.id}>
              <Tooltip
                title={item.description || "No description"}
                arrow
                componentsProps={{
                  tooltip: {
                    sx: {
                      fontSize: 16,
                      backgroundColor: "#fff",
                      border: "1px solid #3FA89B",
                      borderRadius: "8px",
                      color: "#888", // text color
                      fontWeight: "bold",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      maxWidth: 300,
                    },
                  },
                }}
              >
                <Paper
                  elevation={2}
                  onClick={() => handleOpenKeypad(item)}
                  sx={{
                    width: 140,
                    height: 140,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    backgroundColor: "#F5F5F5",
                    "&:hover": { backgroundColor: "#ebebeb" },
                    transition: "background-color 0.3s ease",
                    border: "1px solid #3FA89B",
                    borderRadius: "8px",
                  }}
                >
                  <AcUnitOutlinedIcon
                    sx={{ fontSize: 50, color: "#3FA89B", mt: 1 }}
                  />

                  <Typography
                    variant="body2"
                    align="center"
                    sx={{ mt: 1, color: "#3FA89B", fontSize: 16, mx: 1 }}
                  >
                    {item.appliance}
                  </Typography>

                  {/* Edit/Delete Buttons */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 4,
                      left: 4,
                      right: 4,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation(); // prevent triggering Paper onClick
                        handleEdit(item);
                      }}
                      sx={{
                        color: "#00a8e8",
                        "&:hover": {
                          backgroundColor: "#c0c0c0",
                        },
                      }}
                    >
                      <EditIcon fontSize="medium" />
                    </IconButton>

                    <IconButton
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation(); // prevent triggering Paper onClick
                        handleDelete(item.id);
                      }}
                      sx={{
                        color: "#ff6b35",
                        "&:hover": {
                          backgroundColor: "#c0c0c0",
                        },
                      }}
                    >
                      <DeleteIcon fontSize="medium" />
                    </IconButton>
                  </Box>
                </Paper>
              </Tooltip>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default TempControlPage;
