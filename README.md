# RunApp
Running App Project By Zohaib Syed, Nick Manna, Jack Collins, and Sam Fulton


From First Commit, AI Overview of the App Structure using React Native:


Ctrl+K to generate a command
explain all the key components of this default react app to me as i dont have much knowledge of react native.

I'll help you understand the key components of this React Native app! Let me first examine the structure and key files to give you a comprehensive overview.
Now let me examine some key components and the theme system:
Perfect! Now I have a comprehensive understanding of this React Native app. Let me explain all the key components to you:
React Native App Structure Overview
This is a React Native app built with Expo, which is a popular framework that makes React Native development easier. Here are the key components:
1. Project Configuration
package.json - Defines the app's dependencies and scripts:
Uses Expo Router for navigation (file-based routing like Next.js)
Includes React Native core libraries and Expo-specific packages
Scripts for running on different platforms (npm run android, npm run ios, npm run web)
app.json - Expo configuration file:
App metadata (name, version, icons)
Platform-specific settings (iOS, Android, Web)
Splash screen configuration
Enables new React Native architecture and React Compiler
2. Navigation System (File-Based Routing)
app/_layout.tsx - Root layout component:
Sets up the main navigation stack
Provides theme context (light/dark mode)
Contains two main screens: (tabs) and modal
app/(tabs)/_layout.tsx - Tab navigation layout:
Creates bottom tab navigation with two tabs: "Home" and "Explore"
Uses haptic feedback for tab interactions
Icons for each tab (house and paperplane)
app/(tabs)/index.tsx - Home screen:
Welcome screen with React logo
Interactive elements with haptic feedback
Links to modal screen
Platform-specific developer tool instructions
app/(tabs)/explore.tsx - Explore screen:
Educational content about the app's features
Collapsible sections explaining different concepts
Examples of images, animations, and theming
3. Theming System
constants/theme.ts - Color and font definitions:
Light and dark mode color schemes
Platform-specific font configurations
Tint colors for active states
hooks/use-color-scheme.ts - Color scheme detection:
Detects if device is in light or dark mode
Used throughout the app for theme switching
hooks/use-theme-color.ts - Theme color hook:
Returns appropriate colors based on current theme
Allows custom light/dark colors for specific components
4. Themed Components
components/themed-text.tsx - Smart text component:
Automatically adapts to light/dark themes
Multiple text styles (title, subtitle, link, etc.)
Customizable colors for specific use cases
components/themed-view.tsx - Smart view component:
Automatically adapts background colors to theme
Base component for themed containers
5. UI Components
components/parallax-scroll-view.tsx - Enhanced scroll view:
Parallax effect for header images
Smooth scrolling with visual effects
components/hello-wave.tsx - Animated component:
Uses react-native-reanimated for smooth animations
Demonstrates animation capabilities
components/haptic-tab.tsx - Tab with haptic feedback:
Provides tactile feedback when tabs are pressed
Enhances user experience
components/ui/ - Reusable UI components:
collapsible.tsx - Expandable content sections
icon-symbol.tsx - Platform-specific icon rendering
6. Key React Native Concepts Demonstrated
Cross-Platform Development: Works on iOS, Android, and Web
File-Based Routing: Similar to Next.js, routes are defined by file structure
Theme System: Automatic light/dark mode support
Platform-Specific Code: Different behavior for iOS/Android/Web
Animations: Using react-native-reanimated for smooth animations
Haptic Feedback: Tactile responses for better UX
TypeScript: Full type safety throughout the app
7. Development Features
Hot Reloading: Changes appear instantly during development
Developer Tools: Platform-specific debugging tools
Linting: ESLint configuration for code quality
TypeScript: Full type checking and IntelliSense
8. Assets
The assets/images/ folder contains:
App icons for different platforms
Splash screen images
React logos in various resolutions (@2x, @3x for different screen densities)
