# Moodify: Design Guidelines

## Design Approach

**Reference-Based Approach** drawing from Spotify's bold, music-first aesthetic combined with Calm's soothing, emotion-centered design principles. The interface should feel both energetic and emotionally intelligent.

## Core Design Principles

1. **Mood-Responsive Interface**: Visual theming dynamically reflects detected emotions
2. **Music-First Hierarchy**: Album artwork and playlists take visual precedence
3. **Emotional Clarity**: Clear feedback on mood detection with confidence visualization
4. **Frictionless Input**: Text entry feels conversational, not form-like

## Color Palette

### Dark Mode (Primary)
- **Background Base**: 12 8% 8% (deep charcoal, Spotify-inspired)
- **Surface Elevated**: 12 8% 12%
- **Text Primary**: 0 0% 98%
- **Text Secondary**: 0 0% 65%

### Mood-Based Accent Colors (Dynamic)
- **Happy**: 45 95% 60% (vibrant amber/gold)
- **Sad**: 220 75% 58% (deep calm blue)
- **Energetic**: 340 85% 55% (electric coral-red)
- **Calm**: 160 65% 50% (soothing teal-green)

### Interactive States
- **Primary CTA**: 142 70% 45% (Spotify green)
- **Hover Accent**: Brighten current mood color by 8% lightness
- **Focus Ring**: Current mood color at 40% opacity

## Typography

**Font Families** (via Google Fonts):
- **Display/Headers**: 'Outfit' (600, 700) - geometric, modern music vibe
- **Body/Interface**: 'Inter' (400, 500, 600) - optimal readability
- **Mood Labels**: 'Outfit' (500) - consistent branding

**Scale**:
- Hero Headline: text-6xl md:text-7xl (mood input page)
- Section Headers: text-3xl md:text-4xl
- Card Titles: text-xl md:text-2xl
- Body: text-base
- Captions: text-sm

## Layout System

**Spacing Primitives**: Tailwind units of 4, 6, 8, 12, 16, 24 (e.g., p-4, gap-8, my-12)

**Container Strategy**:
- Max-width: max-w-6xl for main content
- Full-bleed sections for hero and playlist displays
- Asymmetric padding: px-6 md:px-12 lg:px-16

**Grid Patterns**:
- Playlist cards: grid-cols-2 md:grid-cols-3 lg:grid-cols-4
- Mood history: Single column chart with stat cards above (grid-cols-2 md:grid-cols-4)

## Component Library

### Hero/Mood Input Section
- **Layout**: Centered, 75vh minimum height
- **Input Field**: Oversized textarea (min-h-32) with gradient border matching current/last detected mood
- **Floating Placeholder**: "How are you feeling today?" fades on focus
- **Submit Action**: Animated pulse on mood detection, morphs into mood badge

### Mood Detection Display
- **Confidence Meter**: Horizontal bar with gradient fill (0-100%) using detected mood color
- **Mood Badge**: Rounded-full pill with icon + label, glowing effect (box-shadow with mood color)
- **Alternative Moods**: Show top 3 predictions as smaller, muted badges below primary

### Playlist Cards
- **Album Art**: Square aspect-ratio-square with rounded-lg corners
- **Hover State**: Scale-105 transform with shadow-2xl elevation
- **Overlay**: Gradient from transparent to mood color (opacity-60) on bottom third
- **Track Count**: Positioned absolute bottom-4 left-4, semi-transparent backdrop

### Mood History Chart
- **Chart Type**: Line graph with gradient fill below curve
- **Color Coding**: Each mood segment uses its accent color
- **Time Range Selector**: Pill-style tabs (7 days, 30 days, All time)
- **Stat Cards**: Grid above chart showing "Most Common Mood", "Total Sessions", "Current Streak", "Mood Variety" with large numbers and small labels

### Navigation
- **Header**: Sticky top, backdrop-blur-lg with semi-transparent background
- **Logo**: Left-aligned, combines musical note + emotional spark iconography
- **Links**: Sparse spacing (gap-12), subtle underline animation on hover

## Images

### Hero Section Image
**Placement**: Full-width background behind mood input, with overlay gradient (from mood color at 20% opacity to background color)

**Description**: Abstract visualization of sound waves meeting emotional color gradients - imagine flowing, organic shapes that transition between the four mood colors (amber, blue, coral, teal) with subtle particle effects. Style should evoke synaesthesia (seeing music as color). Use a high-quality stock image from Unsplash with keywords: "abstract gradient music visualization" or "colorful sound waves background"

**Treatment**: Blur slightly (backdrop-blur-sm equivalent) to ensure text legibility, scale on scroll for parallax depth

### Playlist Result Cards
**Placement**: Grid layout below mood detection results

**Description**: Use Spotify album artwork fetched via API. For placeholder states during development, use colorful vinyl record graphics or abstract mood-colored circles

### Mood History Section
**Background Accent**: Subtle geometric pattern or gradient mesh in muted mood colors behind the chart area, very low opacity (5-10%)

## Interaction Patterns

### Mood Input Flow
1. User types → Real-time character count appears
2. On submit → Gentle shake animation, text fades
3. Loading → Pulsing mood icon cycle through all four colors
4. Result → Mood badge scales in with spring animation, chart draws from left to right

### Playlist Generation
1. Mood confirmed → Cards fade in sequentially (stagger by 100ms)
2. Spotify auth required → Modal with blurred background, green CTA button with backdrop-blur
3. Playlist populated → Smooth height expansion for each added track

### History Navigation
- Tab switches trigger 300ms crossfade between chart data
- Hovering chart shows tooltip with exact mood percentage and date
- Mobile: Swipe gestures to change time ranges

## Accessibility & Quality

- All mood colors maintain WCAG AA contrast against dark backgrounds
- Focus indicators use mood color with 3px solid outline
- Reduced motion preference disables all animations except essential loading states
- Chart.js configured with high-contrast grid lines and large touch targets for data points

## Mobile Considerations

- Hero reduces to 60vh on mobile
- Mood input becomes fixed bottom sheet on scroll
- Playlist grid collapses to single column with horizontal scroll option
- Chart rotates to portrait orientation with condensed legend

## Unique Visual Signatures

1. **Mood Glow Effect**: Subtle box-shadow pulse animation on active mood elements (2s ease-in-out infinite)
2. **Gradient Noise Texture**: Apply subtle grain overlay (opacity-[0.03]) to dark surfaces for depth
3. **Music Wave Accent**: Decorative SVG sound wave pattern in current mood color appears during detection (subtle, corner placement)
4. **Emotional Journey Visualization**: Small sparkline preview of mood trajectory next to history chart link

This design balances Spotify's confident, music-forward aesthetic with an emotionally intelligent color system that makes mood detection feel magical and personal.