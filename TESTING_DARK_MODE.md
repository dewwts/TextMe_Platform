# Testing Dark Mode & Kanit Font

## Fixed Issues

### 1. ✅ Kanit Font
- Added `'Kanit'` as the first font in `client/src/index.css` body font-family
- Font is now properly loaded from Google Fonts via `client/index.html`

### 2. ✅ Dark Mode Toggle
- Fixed Toggle component to call `onChange` directly (not `onChange(!enabled)`)
- Added console logs to ThemeContext for debugging
- Theme state is properly managed and persisted to localStorage

## How to Test

### Test Kanit Font:
1. Open the app in browser
2. Open DevTools > Elements
3. Check the `<body>` element's computed styles
4. Font-family should show: `Kanit, -apple-system, ...`
5. You should see Thai-style numbers and different letter shapes

### Test Dark Mode Toggle:

#### On Login/Register Pages:
1. Look for the toggle button in the top-right corner (shows ☀️ or 🌙)
2. Click it to switch between light and dark modes
3. The background should change from white to dark gray
4. Text colors should invert appropriately

#### On Chat Interface (Sidebar):
1. After logging in, check the sidebar header
2. Under your username, there's a "Theme" row with a toggle
3. Click it to switch modes
4. Watch the entire interface change colors

### Debug Dark Mode:
1. Open Browser Console (F12)
2. When you click toggle, you should see:
   - `"Toggle theme called, current isDark: true/false"`
   - `"Theme: Dark mode enabled"` or `"Theme: Light mode enabled"`
3. Check localStorage: `localStorage.getItem('theme')` should return `"dark"` or `"light"`
4. Check HTML element: `document.documentElement.classList` should contain `"dark"` class when in dark mode

### Manual Dark Mode Test:
Open browser console and run:
```javascript
// Enable dark mode
document.documentElement.classList.add('dark');
localStorage.setItem('theme', 'dark');

// Disable dark mode
document.documentElement.classList.remove('dark');
localStorage.setItem('theme', 'light');
```

## Expected Behavior

### Light Mode:
- White backgrounds
- Dark text (gray-900)
- Blue-600 primary colors
- Gray borders

### Dark Mode:
- Dark gray backgrounds (gray-800, gray-900)
- White text
- Blue-600/Blue-500 primary colors (same or slightly lighter)
- Dark gray borders (gray-700)

## If It Still Doesn't Work

1. **Clear Browser Cache**: Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
2. **Clear localStorage**: Run `localStorage.clear()` in console, then refresh
3. **Restart Dev Server**:
   ```bash
   cd client
   npm run dev
   ```
4. **Check Console**: Look for any errors in browser console
5. **Verify Tailwind**: Check if other Tailwind classes work (try changing a `bg-blue-600` to `bg-red-600` temporarily)

## Architecture

```
ThemeProvider (in main.jsx)
    └── Manages isDark state
    └── Adds/removes 'dark' class on <html>
    └── Provides { isDark, toggleTheme } via context

Components use useTheme() hook
    └── Login/Register: Toggle in top-right
    └── Sidebar: Toggle in header under username
    └── All components: dark: classes for styling
```
