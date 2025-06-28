import { useEffect, useRef, useState } from "react";
import { TextField, Tooltip, tooltipClasses } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useGridApiContext } from "@mui/x-data-grid";
import supabase from "../supabaseClient";

// 🔧 Normalize function
const normalizeText = (text) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]|_/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

// 🎨 Styled Tooltip
const CustomTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#fff",
    color: "#d32f2f",
    fontWeight: "semiBold",
    border: "2px solid #d32f2f",
    boxShadow: theme.shadows[2],
    fontSize: "1rem",
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: "#fff",
  },
}));

const ItemNameEditCell = ({ id, field, value, inputRef }) => {
  const apiRef = useGridApiContext();
  const [inputValue, setInputValue] = useState(value || "");
  const [error, setError] = useState("");

  const localRef = useRef();

  // ✅ Autofocus logic
  useEffect(() => {
    const refToFocus = inputRef?.current || localRef.current;
    if (refToFocus) refToFocus.focus();
  }, [inputRef]);

  const checkDuplicate = async (nameToCheck) => {
    const normalizedInput = normalizeText(nameToCheck);
    if (!normalizedInput) {
      setError("");
      return;
    }

    const { data, error: supaError } = await supabase
      .from("inventory")
      .select("id, item_name");

    if (supaError) {
      console.error("Supabase error:", supaError.message);
      setError("Error checking name");
      return;
    }

    const isDuplicate = data.some((item) => {
      const normalizedDbName = normalizeText(item.item_name);
      return item.id !== id && normalizedDbName === normalizedInput;
    });

    setError(isDuplicate ? "⚠️ ITEM ALREADY EXISTS" : "");
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      checkDuplicate(inputValue);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [inputValue, id]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    apiRef.current.setEditCellValue({ id, field, value: newValue }, e);
  };

  const handleBlur = () => {
    checkDuplicate(inputValue);
  };

  return (
    <CustomTooltip title={error} open={!!error} placement="top-start">
      <TextField
        inputRef={inputRef || localRef}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        error={!!error}
        size="fullheight"
        fullWidth
      />
    </CustomTooltip>
  );
};

export default ItemNameEditCell;
