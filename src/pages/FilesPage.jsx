import { useState, useEffect } from "react";
import { Grid, Typography, Paper, Button, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import supabase from "../components/supabaseClient"; // adjust path
import React from "react";

const FilesPage = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [customName, setCustomName] = useState("");
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewFile, setPreviewFile] = React.useState(null);

  // Handle file preview
  const handleOpenPreview = (file) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };
  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewFile(null);
  };

  // Fetch files from Supabase table
  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching documents:", error);
    else setFiles(data);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Get file URL (thumbnail for images)
  const getFileUrl = (filePath) => {
    if (!filePath) return "";

    const isImage = filePath.match(/\.(jpg|jpeg|png|gif)$/i);

    if (isImage) {
      // Use the render endpoint for images
      return `https://ivisqrqipcjqwdoqefpx.supabase.co/storage/v1/object/public/documents/${filePath}?width=150&height=120&resize=contain`;
    }

    // Other file types
    return `https://ivisqrqipcjqwdoqefpx.supabase.co/storage/v1/object/public/documents/${filePath}`;
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile || !customName) {
      alert("Please select a file and enter a name.");
      return;
    }

    const fileExt = selectedFile.name.split(".").pop();
    const filePath = `documents/${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, selectedFile);

    console.log("Upload result:", uploadData, "Upload error:", uploadError);
    if (uploadError) return alert("File upload failed!");

    // Insert metadata into table
    const { data: insertData, error: insertError } = await supabase
      .from("documents")
      .insert([
        {
          name: customName,
          file_path: filePath,
          file_type: selectedFile.type,
        },
      ])
      .select();

    console.log("Insert result:", insertData, "Insert error:", insertError);
    if (insertError) return alert("Metadata insert failed!");

    // Clear fields
    setSelectedFile(null);
    setCustomName("");

    // Refresh grid
    await fetchFiles();
  };

  // Handle file deletion
  const handleDeleteFile = async (file) => {
    const confirmDelete = window.confirm(
      `Do you really want to delete the file "${file.name}"?`
    );
    if (!confirmDelete) return;

    try {
      // 1. Delete from storage
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([file.file_path]);

      if (storageError) throw storageError;

      // 2. Delete from database
      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", file.id);

      if (dbError) throw dbError;

      // 3. Refresh the grid
      fetchFiles();
      // alert("File deleted successfully!");
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file. Check console for details.");
    }
  };

  const sharedStyles = {
    "& .MuiInputLabel-root": { color: "#38a3a5", fontSize: 14 },
    "& .MuiOutlinedInput-root": {
      "& fieldset": { border: "1px solid #38a3a5" },
      "&:hover fieldset": { borderColor: "darkGreen" },
      "&.Mui-focused fieldset": { borderColor: "#25a18e" },
    },
  };

  return (
    <div className="flex-1 overflow-hidden relative z-10 bg-100 border-t-2">
      <main className="max-w-8xl mx-auto scrollbar-hide h-[640px] p-4">
        <Typography variant="h4" sx={{ mb: 3, color: "#3FA89B" }}>
          Document Manager
        </Typography>

        {/* Upload Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpload();
          }}
        >
          <Grid container spacing={2} alignItems="center" sx={{ mb: 4 }}>
            <Grid item>
              <TextField
                label="Enter File Name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                size="small"
                sx={{
                  ...sharedStyles,
                  color: "#333",
                  input: { color: "#333", fontSize: 16 },
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleUpload();
                  }
                }}
              />
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                component="label"
                sx={{ bgcolor: "#669bbc" }}
              >
                Select File
                <input
                  type="file"
                  hidden
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
              </Button>
            </Grid>
            <Grid item>
              <Button
                type="submit"
                variant="contained"
                sx={{ color: "white", bgcolor: "#3FA89B" }}
              >
                Upload
              </Button>
            </Grid>
            {selectedFile && (
              <Grid item>
                <Typography
                  variant="body2"
                  sx={{ ...sharedStyles, color: "#777", fontSize: 14 }}
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
          {files.map((file) => {
            const isImage = file.file_type?.startsWith("image/");
            return (
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
                    p: 2,
                    cursor: "pointer",
                  }}
                  onClick={() => handleOpenPreview(file)}
                >
                  {/* Delete Button */}
                  <IconButton
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                    }}
                    onClick={(e) => {
                      e.stopPropagation(); // prevent opening preview
                      handleDeleteFile(file);
                    }}
                  >
                    <DeleteOutlineIcon
                      fontSize="medium"
                      sx={{
                        color: "#fb6107",
                        "&:hover": {
                          fontSize: 20,
                          rotate: "45deg",
                        },
                      }}
                    />
                  </IconButton>

                  {isImage ? (
                    <img
                      src={getFileUrl(file.file_path)}
                      alt={file.name}
                      style={{
                        width: "100%",
                        height: 120,
                        objectFit: "cover",
                        borderRadius: 6,
                        backgroundColor: "lightGray",
                      }}
                    />
                  ) : (
                    <InsertDriveFileOutlinedIcon
                      sx={{ fontSize: 80, color: "#3FA89B" }}
                    />
                  )}
                  <Typography
                    variant="body1"
                    align="center"
                    sx={{ mt: 0.5, color: "#3FA89B", fontWeight: 500 }}
                  >
                    {file.name}
                  </Typography>
                </Paper>

                {/* Preview Dialog */}
                <Dialog
                  open={previewOpen}
                  onClose={handleClosePreview}
                  fullScreen
                  sx={{
                    p: 0,
                    mx: 0,
                  }}
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

                  {/* Dialog Content */}
                  <DialogContent
                    open={previewOpen}
                    onClose={handleClosePreview}
                    dividers
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      pt: 2,
                      height: "100%",
                    }}
                  >
                    {previewFile?.file_type?.startsWith("image/") ? (
                      // IMAGE PREVIEW
                      <img
                        src={getFileUrl(previewFile.file_path)}
                        alt={previewFile.name}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          borderRadius: 0,
                        }}
                      />
                    ) : previewFile?.file_type === "application/pdf" ? (
                      // PDF PREVIEW
                      <iframe
                        src={getFileUrl(previewFile.file_path)}
                        title={previewFile.name}
                        style={{
                          width: "100%",
                          maxHeight: "100%",
                          border: "none",
                          borderRadius: 0,
                        }}
                      />
                   ) : previewFile?.file_type?.startsWith("text/") ? (
                      // TXT PREVIEW
                      <iframe
                        src={getFileUrl(previewFile.file_path)}
                        title={previewFile.name}
                        style={{
                          width: "100%",
                          maxHeight: "100%",
                          border: "none",
                          backgroundColor: "#fafafa",
                          borderRadius: 0,
                          fontFamily: "monospace",
                        }}
                      />
                    ) : previewFile?.file_type ===
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? (
                      // DOCX PREVIEW (Google Docs Viewer)
                      <iframe
                        src={`https://docs.google.com/gview?url=${encodeURIComponent(
                          getFileUrl(previewFile.file_path)
                        )}&embedded=true`}
                        title={previewFile.name}
                        style={{
                          width: "100%",
                          maxHeight: "100%",
                          border: "none",
                          borderRadius: 0,
                        }}
                      />
                    ) : (
                      // FALLBACK
                      <Typography variant="body1">
                        File preview not available.
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
              </Grid>
            );
          })}
        </Grid>
      </main>
    </div>
  );
};

export default FilesPage;
