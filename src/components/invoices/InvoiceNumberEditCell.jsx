import { useEffect, useRef, useState } from "react";
import { TextField, Tooltip, tooltipClasses } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useGridApiContext } from "@mui/x-data-grid";
import supabase from "../supabaseClient";

// Normalize text
const normalizeText = (text) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]|_/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

// Custom Tooltip
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

const InvoiceNumberEditCell = ({ id, field, value, inputRef }) => {
  const apiRef = useGridApiContext();
  const [inputValue, setInputValue] = useState(value || "");
  const [error, setError] = useState("");
  const localInputRef = useRef();

  // 🔍 Duplicate check
  const checkDuplicate = async (nameToCheck) => {
    const normalizedInput = normalizeText(nameToCheck);
    if (!normalizedInput) {
      setError("");
      return;
    }

    const { data, error: supaError } = await supabase
      .from("invoices")
      .select("id, invoice_numb");

    if (supaError) {
      console.error("Supabase error:", supaError.message);
      setError("Error checking invoice Number");
      return;
    }

    const isDuplicate = data.some((item) => {
      const normalizedDbName = normalizeText(item.invoice_numb);
      return item.id !== id && normalizedDbName === normalizedInput;
    });

    setError(isDuplicate ? "⚠️ INVOICE ALREADY EXISTS" : "");
  };

  // 🧠 Debounce duplicate check
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      checkDuplicate(inputValue);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [inputValue, id]);

  // 🧠 Set value
  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    apiRef.current.setEditCellValue({ id, field, value: newValue }, e);
  };

  // 🔍 Manual focus fallback
  useEffect(() => {
    const refToUse = inputRef?.current || localInputRef.current;
    if (refToUse) {
      refToUse.focus();
    }
  }, []);

  return (
    <CustomTooltip title={error} open={!!error} placement="top-start">
      <TextField
        inputRef={inputRef || localInputRef} // 👈 Use external or local fallback
        value={inputValue}
        onChange={handleChange}
        onBlur={() => checkDuplicate(inputValue)}
        error={!!error}
        size="fullheight"
        fullWidth
      />
    </CustomTooltip>
  );
};

export default InvoiceNumberEditCell;
