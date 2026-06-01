# RentRight

A modern web application for managing shared rental expenses, maintenance requests, and documents among roommates and tenants.

---

## Features

- **Role-based Dashboards** — Switch between Tenant, Leaseholder, and Landlord views
- **Expense Management** — Create expenses with Equal, Percentage, or Custom split rules with automatic calculations
- **Payment Tracking** — Mark payments as paid with real-time summaries
- **Maintenance Requests** — Submit and track maintenance tickets with status workflow (Submitted → In Progress → Resolved)
- **Document Management** — Upload and download rental documents (stored locally)
- **Persistent Data** — All changes saved using browser localStorage (survives refresh)
- **Demo Reset** — One-click reset to restore sample data

---

## Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **Icons:** Lucide React
- **State Management:** React Context + localStorage

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone https://github.com/TejasviP1605/PRJ566NAA-Team02.git
cd RentRight
```

2. Install dependencies

```bash
npm install
```

3. Start the development server

```bash
npm run dev
```

4. Open http://localhost:3000 in your browser

---

## Project Structure

```
RentRight/
├── src/
│   ├── components/           # Reusable UI components
│   ├── context/              # AppContext.jsx (global state + localStorage)
│   ├── data/                 # sampleData.js
│   ├── pages/                # TenantDashboard, LeaseholderDashboard, Maintenance, Documents
│   ├── utils/                # splits.js (calculation logic)
│   ├── App.jsx
│   └── main.jsx
├── public/
├── index.html
├── package.json
└── README.md
```

---

## Troubleshooting

- **Port already in use?** → Vite will automatically try another port.
- **Blank page after changes?** → Hard refresh the browser (Cmd + Shift + R on Mac or Ctrl + Shift + R on Windows).
- **Need to reset demo data?** → Click the ↺ icon in the header.

## AI Usage
This project was developed with the assistance of GitHub Copilot for code suggestions and productivity support. All generated code was reviewed, understood, and modified where necessary by the development team. We confirm that we fully understand the functionality and behavior of the implemented code and take responsibility for its correctness.
