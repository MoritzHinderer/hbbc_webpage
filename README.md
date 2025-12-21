# HBBC Webpage

<div align="center">
  <img src="hbbc-webpage/src/assets/hbbc_logo.png" alt="HBBC Logo" width="200"/>
</div>

Official website for the **Hamburger Böblinger Banausenchor und VFB Fanclub** (HBBC) - an official fanclub of VfB Stuttgart.

## 🌐 About HBBC

HBBC is an interregional fanclub that brings together passionate VfB Stuttgart supporters from Hamburg and the Böblingen region. The club combines friendship, music, and football passion in a welcoming community.

**Key Values:**
- Open and inclusive community
- Respect and tolerance
- Support for VfB Stuttgart
- Music and singing traditions
- Interregional connection

## 🚀 Features

- **Modern Responsive Design** - Beautiful UI with gradient backgrounds and glass morphism effects
- **Home Page** - Parallax scrolling hero section with animated logo and club information
- **Members Page** - Display all club members with their photos, roles, and joining dates. Includes a call-to-action card to join the club
- **Downloads** - Easily accessible download section for important documents (member application forms, club info)
- **Navigation Bar** - Modern navbar with smooth animations and active route detection
- **Mobile Friendly** - Fully responsive design for tablets and mobile devices
- **Network Access** - Access from any device on the same network using your computer's IP

## 🛠️ Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS v4** - Utility-first CSS framework with modern PostCSS integration
- **Vue Router** - Client-side routing
- **Vite** - Next-generation frontend build tool
- **Headless UI** - Unstyled accessible components
- **Heroicons** - Beautiful hand-crafted SVG icons

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

## 🎯 Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd hbbc_webpage/hbbc-webpage
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   - Local: `http://localhost:5173`
   - Network: Check terminal output for network URL

## 📱 Network Access (iPad & Other Devices)

To access the webpage from another device on the same network:

1. **Find your computer's IP address:**
   ```bash
   hostname -I  # Linux/Mac
   ipconfig     # Windows
   ```

2. **On the other device, open:**
   ```
   http://YOUR_IP_ADDRESS:5173
   ```
   Replace `YOUR_IP_ADDRESS` with the IP from step 1.

**Example:** `http://192.168.1.100:5173`

## 📦 Build for Production

```bash
npm run build
```

Generated files will be in the `dist/` folder.

Preview the production build:
```bash
npm run preview
```

## 📁 Project Structure

```
hbbc-webpage/
├── src/
│   ├── components/
│   │   └── NavBar.vue           # Navigation bar with route detection
│   ├── views/
│   │   ├── Home.vue             # Home page with parallax hero section
│   │   ├── Downloads.vue        # Downloads page for documents
│   │   ├── Members.vue          # Members gallery with photos
│   │   └── Footer.vue           # Footer component
│   ├── router/
│   │   └── index.ts             # Vue Router configuration
│   ├── App.vue                  # Root component
│   └── main.ts                  # Application entry point
├── public/
│   ├── downloads/               # Downloadable documents
│   ├── member_pictures/         # Member photos (snake_case naming)
│   └── members/
│       └── members.json         # Member data
├── index.html                   # HTML entry point
├── package.json                 # Dependencies
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── postcss.config.js           # PostCSS configuration
```

## 🎨 Design Features

- **Color Scheme**: Dark gray to deep burgundy gradient with red accents
- **Glass Morphism**: Frosted glass effect on cards and overlays
- **Parallax Scrolling**: Dynamic logo animation on the home page
- **Responsive Grid**: Adapts from 1 to 3 columns based on screen size
- **Smooth Animations**: Hover effects and transitions throughout
- **Modern Typography**: Clean, readable font hierarchy

## 📄 Member Data Structure

Members are defined in `public/members/members.json`:

```json
{
  "member": [
    {
      "name": "Member Name",
      "role": "Position/Role",
      "joined": "YYYY-MM-DD",
      "about_me": "Bio/description"
    }
  ]
}
```

**Member Pictures:**
- Save pictures in `/public/member_pictures/`
- Use snake_case naming: `Member_Name.png` or `Member_Name.jpeg`
- Supports `.png`, `.jpeg`, and `.jpg` formats
- If no picture exists, a user icon placeholder is shown

## 🔗 Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home.vue | Home page with club introduction |
| `/members` | Members.vue | Club members gallery |
| `/downloads` | Downloads.vue | Downloadable documents |

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 📥 Download Documents

The Downloads page supports downloading:
- Member application forms
- Club information documents
- Other important files

Place files in `public/downloads/` and they'll be automatically available.

## ♿ Accessibility

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast compliance
- Focus indicators on all interactive elements

## 🚀 Performance

- **Vite**: Lightning-fast cold start and hot module replacement
- **Vue 3**: Smaller bundle size with Composition API
- **Tailwind CSS v4**: Optimized CSS with PostCSS
- **Lazy Loading**: Route-based code splitting
- **Image Optimization**: Proper handling of member photos

## 🌐 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📝 License

[Add your license here]

## 👥 Contributors

- Joshua Hörtkorn (Vorsitzender)
- Moritz Hinderer (Stellvertretender Vorsitzender)
- Paul Otto Georg Lussier (Kassenwart)
- Roman Güven (Schriftführer)

## 📞 Contact

For inquiries about HBBC, please contact through the website or email.

## 🔄 Development Workflow

1. Create a new branch for features
2. Make changes in development mode (`npm run dev`)
3. Test responsive design and cross-browser compatibility
4. Build and preview (`npm run build && npm run preview`)
5. Commit and push changes
6. Create pull request

## 🐛 Known Issues & Future Improvements

- [ ] Add event calendar for upcoming matches and events
- [ ] Implement animated counter stats on home page
- [ ] Add member map showing geographic distribution
- [ ] Create testimonials carousel
- [ ] Add contact form
- [ ] Implement newsletter signup

## 🎓 Learning Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Vue Router Documentation](https://router.vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)

---

**Made with ❤️ for the HBBC Community**
