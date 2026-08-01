'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import { useAppTheme } from '@/theme/ThemeContext';
import {
  themeDescriptions,
  themeIds,
  themeLabels,
  type ThemeId,
} from '@/theme/types';

/**
 * Dev theme switcher — visible when enabled via env/localStorage,
 * or restored with Alt+Shift+T.
 */
export function ThemeSwitcher() {
  const {
    themeId,
    setThemeId,
    switcherVisible,
    setSwitcherVisible,
  } = useAppTheme();

  if (!switcherVisible) {
    if (process.env.NEXT_PUBLIC_ENABLE_THEME_SWITCHER !== 'true') {
      return null;
    }

    return (
      <Tooltip title="Show theme switcher (Alt+Shift+T)">
        <IconButton
          aria-label="Show theme switcher"
          onClick={() => setSwitcherVisible(true)}
          sx={{
            position: 'fixed',
            right: 16,
            bottom: 16,
            zIndex: (theme) => theme.zIndex.tooltip + 1,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 2,
            '&:hover': { bgcolor: 'background.paper' },
          }}
        >
          <PaletteOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Box
      role="region"
      aria-label="Theme development switcher"
      sx={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: (theme) => theme.zIndex.tooltip + 1,
        width: 280,
        p: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 4,
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
        <PaletteOutlinedIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 700 }}>
          Theme
        </Typography>
        <Tooltip title="Hide switcher (Alt+Shift+T)">
          <IconButton
            aria-label="Hide theme switcher"
            size="small"
            onClick={() => setSwitcherVisible(false)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <FormControl fullWidth size="small">
        <InputLabel id="theme-switcher-label">Active theme</InputLabel>
        <Select
          labelId="theme-switcher-label"
          label="Active theme"
          value={themeId}
          onChange={(event) => setThemeId(event.target.value as ThemeId)}
        >
          {themeIds.map((id) => (
            <MenuItem key={id} value={id}>
              {themeLabels[id]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        {themeDescriptions[themeId]}
      </Typography>
    </Box>
  );
}
