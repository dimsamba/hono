import { Box, IconButton, Typography, useTheme } from "@mui/material";
import InputBase from "@mui/material/InputBase";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SearchIcon from "@mui/icons-material/Search";
import { tokens } from "../theme";

const Topbar = ({ title }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    return (
        <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
            {/* Page Title */}
            <Typography variant="h4" color={colors.grey[100]}>
                {title}
            </Typography>

            {/* Search Bar */}
            <Box display="flex" backgroundColor= "#4B5360" borderRadius="9px">
                <InputBase sx={{ ml: 2, flex: 1, fontSize: 14 }} placeholder="Search" />
                <IconButton type="button" sx={{ p: 1, backgroundColor: "#4B5360" }}>
                    <SearchIcon sx={{ color: colors.grey[400] }} />
                </IconButton>
            </Box>

            {/* Icons */}
            <Box display="flex">
                <IconButton sx={{ color: colors.grey[300] }}>
                    <NotificationsOutlinedIcon />
                </IconButton>
                <IconButton sx={{ color: colors.grey[300] }}>
                    <SettingsOutlinedIcon />
                </IconButton>
                <IconButton sx={{ color: colors.grey[300] }}>
                    <PersonOutlinedIcon />
                </IconButton>
            </Box>
        </Box>
    );
};

export default Topbar;
