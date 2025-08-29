import { useState, useEffect } from "react";
import {
  Grid,
  Typography,
  Paper,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  GlobalStyles,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined"; // for txt/doc
import supabase from "../components/supabaseClient";
import React from "react";

const FILE_CATEGORIES = ["All", "Documents", "Invoices", "Pictures"];
const STORAGE_BASE =
  "https://ivisqrqipcjqwdoqefpx.supabase.co/storage/v1/object/public";

const FilesPage = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [customName, setCustomName] = useState("");
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewFile, setPreviewFile] = React.useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Get the appropriate icon for a file based on its type or extension
  const getFileIcon = (file) => {
    if (/\.(pdf)$/i.test(file.file_path)) {
      return <PictureAsPdfOutlinedIcon sx={{ fontSize: 80, color: "red" }} />;
    }
    if (/\.(txt|docx?|rtf)$/i.test(file.file_path)) {
      return (
        <DescriptionOutlinedIcon sx={{ fontSize: 80, color: "#3FA89B" }} />
      );
    }
    return (
      <InsertDriveFileOutlinedIcon sx={{ fontSize: 80, color: "#3FA89B" }} />
    );
  };

  // ---------- helpers ----------
  const isImageByPath = (path) =>
    typeof path === "string" &&
    /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(path);

  const isImage = (file) =>
    (file?.file_type && file.file_type.startsWith("image/")) ||
    isImageByPath(file?.file_path);

  // Build a public URL from a storage path like "pictures/123.jpg"
  const getFileUrl = (filePath, width = null, height = null) => {
    if (!filePath) return "";
    let url = `${STORAGE_BASE}/files/${filePath}`;
    if (isImageByPath(filePath) && width && height) {
      url += `?width=${width}&height=${height}&resize=contain`;
    }
    return url;
  };

  // ---------- data ----------
  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from("files") // <-- your metadata table name
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching files:", error);
      setFiles([]);
      return;
    }

    // Client-side filter to be resilient to schema differences
    let filtered = data || [];
    if (selectedCategory !== "All") {
      const folder = selectedCategory.toLowerCase(); // "pictures" | "documents" | "invoices"
      filtered = filtered.filter((row) => {
        // Prefer an explicit 'category' column if you have it
        if (row.category) return row.category === folder;

        // Fallbacks if 'category' doesn't exist:
        // 1) derive from file_path prefix
        if (row.file_path?.startsWith(`${folder}/`)) return true;

        // 2) some older rows may have file_type incorrectly set to folder
        if (row.file_type === folder) return true;

        return false;
      });
    }

    setFiles(filtered);
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  // ---------- actions ----------
  const handleOpenPreview = (file) => {
    // Helpful debug while testing
    // console.log("Preview:", { type: file?.file_type, path: file?.file_path });
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewFile(null);
  };

  // Upload file to storage, then insert metadata row
  const handleUpload = async () => {
    if (!selectedFile || !customName || selectedCategory === "All") {
      alert("Please select a file, enter a name, and choose a Type (not All).");
      return;
    }

    const fileExt = selectedFile.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const folder = selectedCategory.toLowerCase(); // "pictures" | "documents" | "invoices"
    const filePath = `${folder}/${fileName}`;

    // 1) upload to storage
    const { error: uploadError } = await supabase.storage
      .from("files") // <-- storage bucket name
      .upload(filePath, selectedFile);

    if (uploadError) {
      console.error(uploadError);
      alert("File upload failed!");
      return;
    }

    // 2) insert metadata
    const payload = {
      name: customName,
      file_path: filePath,
      file_type: selectedFile.type || null, // e.g. "image/jpeg"
    };

    const { error: insertError } = await supabase
      .from("files")
      .insert([payload]);

    if (insertError) {
      console.error(insertError);
      alert("Metadata insert failed!");
      return;
    }
    setCustomName("");
    setSelectedFile(null);
    setSelectedCategory("All"); // 👈 this resets dropdown to "All"
    fetchFiles();
  };

  const handleDeleteFile = async (file) => {
    const confirmDelete = window.confirm(`Delete "${file.name}"?`);
    if (!confirmDelete) return;

    try {
      const { error: storageError } = await supabase.storage
        .from("files")
        .remove([file.file_path]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("files")
        .delete()
        .eq("id", file.id);
      if (dbError) throw dbError;

      fetchFiles();
    } catch (err) {
      console.error("Error deleting file:", err);
      alert("Failed to delete file.");
    }
  };

  // ---------- styles ----------
  const sharedStyles = {
    "& .MuiInputLabel-root": { color: "#38a3a5", fontSize: 14 },
    "& .MuiOutlinedInput-root": {
      "& fieldset": { border: "1px solid #38a3a5" },
      "&:hover fieldset": { borderColor: "darkGreen" },
      "&.Mui-focused fieldset": { borderColor: "#25a18e" },
    },
  };

  // ---------- UI ----------
  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <GlobalStyles
          styles={{
            "& .MuiMenu-paper": {
              backgroundColor: "white !important",
              color: "#577590 !important",
            },
            "& .MuiMenuItem-root:hover": {
              backgroundColor: "#eff1ed !important",
            },
          }}
        />

        <Typography
          variant="h4"
          sx={{ ...sharedStyles, mb: 3, color: "#3FA89B" }}
        >
          Document Manager
        </Typography>

        {/* Upload Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpload();
          }}
        >
          <Grid
            container
            spacing={2}
            alignItems="center"
            justifyContent="left"
            sx={{ mb: 1, pb: 1 }}
          >
            <Grid item>
              <Button
                variant="contained"
                component="label"
                sx={{ bgcolor: "#669bbc", mb: 0.2 }}
              >
                Select File
                <input
                  type="file"
                  hidden
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
              </Button>
            </Grid>

            <Grid item>
              <TextField
                label="Enter File Name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                size="small"
                sx={{
                  ...sharedStyles,
                  input: {
                    color: "dimGray !important",
                    fontSize: "16px",
                    fontWeight: 500,
                  },
                }}
              />
            </Grid>

            <Grid item>
              <FormControl
                sx={{
                  ...sharedStyles,
                  width: "222px",
                  "& .MuiSelect-select": {
                    color: "dimGray !important",
                    fontSize: "16px",
                    fontWeight: 500,
                  },
                  "& .MuiSvgIcon-root": {
                    fontSize: "2.2rem",
                    color: "#38a3a5",
                  },
                  "& .MuiFormLabel-root": { color: "#38a3a5 !important" },
                }}
              >
                <InputLabel>File Type</InputLabel>
                <Select
                  value={selectedCategory}
                  label="File Type"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  size="small"
                >
                  {FILE_CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item>
              <Button
                type="submit"
                variant="contained"
                sx={{ color: "white", bgcolor: "#3FA89B", mb: 0.2 }}
              >
                Upload
              </Button>
            </Grid>

            {selectedFile && (
              <Grid item>
                <Typography
                  variant="body2"
                  sx={{ color: "#777", fontSize: 14 }}
                >
                  SELECTED: {selectedFile.name}
                </Typography>
              </Grid>
            )}
          </Grid>
        </form>

        {/* Files Grid */}
        <Grid
          container
          spacing={1.5}
          justifyContent="flex-start"
          alignItems="center"
        >
          {files.map((file) => (
            <Grid item key={file.id}>
              <Paper
                elevation={2}
                sx={{
                  position: "relative", // needed for the delete button
                  width: 150,
                  height: 170,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#F5F5F5",
                  border: "1px solid #3FA89B",
                  borderRadius: "8px",
                  px: 1,
                  cursor: "pointer",
                  pt: 3.5,
                  pb: 1,
                }}
                onClick={() => handleOpenPreview(file)}
              >
                {/* Delete */}
                <IconButton
                  size="small"
                  sx={{
                    position: "absolute", // 👈 place absolutely inside Paper
                    top: 0, // 👈 distance from top
                    right: 0, // 👈 distance from right
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(file);
                  }}
                >
                  <DeleteOutlineIcon
                    fontSize="medium"
                    sx={{
                      color: "#fb6107",
                      "&:hover": { fontSize: 20, rotate: "45deg" },
                    }}
                  />
                </IconButton>

                {isImage(file) ? (
                  <img className="fileBox"
                    src={getFileUrl(file.file_path, 150, 120)}
                    alt={file.name}
                    style={{
                      width: "100%",
                      height: 120,
                      objectFit: "cover",
                      borderRadius: "0px 0px 0px 0px",
                      backgroundColor: "lightGray",
                    }}
                    onError={(e) => {
                      // If transform params fail for any reason, fall back to original image
                      e.currentTarget.src = getFileUrl(file.file_path);
                    }}
                  />
                ) : (
                  <div className="fileBox">{getFileIcon(file)}</div>
                )}

                <Typography
                  variant="body1"
                  align="center"
                  sx={{
                    mt: 0.5,
                    color: "#3FA89B",
                    fontWeight: 500,
                    fontSize: "1rem",
                    position: "inherit",
                  }}
                >
                  {file.name}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Preview Dialog */}
        <Dialog
          open={previewOpen}
          onClose={handleClosePreview}
          fullScreen
          sx={{ p: 0, mx: 0 }}
        >
          <DialogTitle
            sx={{
              p: 0,
              px: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#fff",
            }}
          >
            {previewFile?.name}
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleClosePreview}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent
            dividers
            sx={{
              display: "flex",
              justifyContent: "center",
              pt: 2,
              height: "100%",
            }}
          >
            {previewFile && isImage(previewFile) ? (
              <img
                src={getFileUrl(previewFile.file_path)}
                alt={previewFile.name}
                style={{ maxWidth: "100%", maxHeight: "100%" }}
              />
            ) : previewFile?.file_type === "application/pdf" ? (
              <iframe
                src={getFileUrl(previewFile.file_path)}
                title={previewFile.name}
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            ) : previewFile?.file_type?.startsWith("text/") ? (
              <iframe
                src={getFileUrl(previewFile.file_path)}
                title={previewFile.name}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  backgroundColor: "#fafafa",
                }}
              />
            ) : previewFile?.file_type?.includes("wordprocessingml") ? (
              <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(
                  getFileUrl(previewFile.file_path)
                )}&embedded=true`}
                title={previewFile.name}
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            ) : (
              <Typography variant="body1">
                File preview not available.{" "}
                <a
                  href={getFileUrl(previewFile?.file_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open file
                </a>
              </Typography>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default FilesPage;
