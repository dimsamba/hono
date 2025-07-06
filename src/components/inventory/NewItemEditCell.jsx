import { useRef, useState } from "react";
import { TextField, Tooltip, tooltipClasses } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useGridApiContext } from "@mui/x-data-grid";
import { normalizeText } from "../../utils/normalizeText";

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

const NewItemEditCell = ({ id, field, value, inputRef }) => {
  const apiRef = useGridApiContext();
  const [inputValue, setInputValue] = useState(value || "");
  const [error, setError] = useState("");

  const localRef = useRef();

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    apiRef.current.setEditCellValue({ id, field, value: newValue }, e);

    // Light client-side check (optional)
    const rows = apiRef.current.getRowModels();
    const currentNormalized = normalizeText(newValue);
    const isDupe = Array.from(rows.entries()).some(
      ([rowId, row]) =>
        rowId !== id && normalizeText(row.item_name) === currentNormalized
    );

    setError(isDupe ? "⚠️ POSSIBLE DUPLICATE" : "");
  };

  return (
    <CustomTooltip title={error} open={!!error} placement="top-start">
      <TextField
        inputRef={inputRef || localRef}
        value={inputValue}
        onChange={handleChange}
        error={!!error}
        size="fullheight"
        fullWidth
      />
    </CustomTooltip>
  );
};

export default NewItemEditCell;
