import { useEffect, useRef, useState } from "react";
import { TextField, Tooltip, tooltipClasses } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useGridApiContext } from "@mui/x-data-grid";
import supabase from "../supabaseClient";

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

const NewAmountEditCell = ({ id, field, value, inputRef }) => {
  const apiRef = useGridApiContext();
  const [inputValue, setInputValue] = useState(value || "");
  const [error, setError] = useState("");

  const localRef = useRef();

  // ✅ Autofocus logic
  useEffect(() => {
    const refToFocus = inputRef?.current || localRef.current;
    if (refToFocus) refToFocus.focus();
  }, [inputRef]);

  const checkDuplicate = async (amountToCheck) => {
    const parsedAmount = parseFloat(amountToCheck);
    if (isNaN(parsedAmount)) {
      setError("");
      return;
    }

    const { data, error: supaError } = await supabase
      .from("familyexpenses")
      .select("id, amount");

    if (supaError) {
      console.error("Supabase error:", supaError.message);
      setError("Error checking Amount");
      return;
    }

    const isDuplicate = data.some((item) => {
      const dbAmount = parseFloat(item.amount);
      return item.id !== id && !isNaN(dbAmount) && dbAmount === parsedAmount;
    });

    setError(isDuplicate ? "⚠️ AMOUNT ALREADY EXISTS" : "");
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
        inputRef={inputRef || localRef} // ✅ Attach ref
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

export default NewAmountEditCell;
