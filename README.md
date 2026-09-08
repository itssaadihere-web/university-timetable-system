# University Timetable & Resource Scheduling System

A zero-operational-cost, real-time web portal for automating university course, room, and faculty timetable scheduling. The system prevents scheduling clashes across three dimensions simultaneously: **Student Batches**, **Faculty**, and **Rooms**.

---

## 🌟 Key Highlights & Capabilities

1. **3D Conflict Prevention Engine (Server-Side Postgres Function & Client Preview)**
   - **Room Double-Booking**: Overlapping time slots in the same room on the same day or specific date.
   - **Faculty Double-Booking**: Overlapping assignments for the same instructor.
   - **Batch Double-Booking**: Overlapping classes for the same student batch or merge group (excluding approved joint merge sessions).
   - **Mandatory 15-Minute Buffer**: Strict $\ge 15$-minute transition gap between adjacent classes for instructors or batches across any room.
   - **Room Capability Matching**: Verifies that rooms meet all required course tags (`multimedia`, `interactive_lcd`, `horseshoe`, `computer_lab`, `standard`).
   - **Holiday / Exam Calendar Suppression**: Regular recurring classes are suppressed during midterms, finals, or campus holidays.

2. **Drag-and-Drop Interactive Rescheduling (`@dnd-kit`)**
   - Drag classes across days, time slots, and rooms with live collision feedback and rollbacks.
   - **Soft-Lock Presence Indicator**: Shows when another coordinator is currently moving or editing a class session.

3. **Draft / Publish & Version Diff Control**
   - Stage edits safely in **Draft Mode** without disrupting the live schedule seen by faculty and students.
   - Side-by-side **Version Diff Modal** showing all modified items before broadcast.
   - Snapshot archiving with 1-click historical rollback.

4. **Special-Case & Irregular Student Advising**
   - Coordinator-only advising console.
   - Cross-references completed student course history against prerequisite chains.
   - Flags cross-batch elective clashes and provides clash-free alternative recommendations based on faculty availability windows.

5. **Makeup & Floating Class Coordination**
   - Floating adjustment classes tied to specific calendar dates.
   - **Room Availability Matrix**: Real-time lookup of free venues filterable by equipment capabilities.

6. **Analytics & 1-Click Exports**
   - **Faculty Load Report**: Weekly hours, daily distribution, back-to-back load detection.
   - **Room Utilization Heatmap**: Capacity tracking and specialty room bottleneck identifier.
   - **Exports**: Client-side formatted Excel (`.xlsx`) and printable PDF generation (`jspdf`).

7. **Zero-Operational-Cost Infrastructure**
   - **Frontend**: Next.js 14 (App Router) on Vercel Hobby Tier.
   - **Database & Sync**: Supabase Postgres Free Tier with Row Level Security (RLS) & Realtime WebSockets.
   - **Automation**: n8n self-hosted workflows for WhatsApp / Email change notifications and automated `pg_dump` backups.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The system starts with pre-loaded mock data and conflict verification ready out-of-the-box.

---

## 🗄️ Supabase Postgres Setup (Live Centralized Database)

1. Create a free project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Run the schema migration script:
   - Copy and execute `supabase/migrations/20260908_init_timetable_schema.sql`.
4. Run the seed data script:
   - Copy and execute `supabase/seed.sql`.
5. Connect your Next.js application by creating a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

---

## 📱 Mobile-Responsive & Offline Access
- Mobile responsive layout with dedicated tabbed daily agenda view.
- Offline caching via `localStorage` ensures students and faculty can check their schedule even on spotty campus Wi-Fi.

---

## 🔔 n8n Automation & Backup Cron
- **Webhook Endpoint**: `POST /api/n8n/webhook` dispatches schedule change events to n8n to send WhatsApp / Email alerts to faculty and batch reps.
- **Backup Endpoint**: `GET /api/backup` can be triggered weekly via an n8n Cron node to archive table snapshots to free object storage.
