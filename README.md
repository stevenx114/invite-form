# Christmas & Retirement RSVP

Personalised RSVP website for the Gosford Tailoring Christmas Party and Leanne's Retirement celebration.

## Features

- Beautiful invite page with Beachcomber / Pelican branding
- Personalised "Dear" line and thank-you message per guest
- RSVP fields: dietary requirements, lunch choice, attendance
- Admin dashboard to create unique invite links, copy them, and review responses
- Bulk guest import and CSV export

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000/admin](http://localhost:3000/admin).

Default admin password: `admin123`  
Change it in `.env.local`:

```
ADMIN_PASSWORD=your-secure-password
ADMIN_SECRET=a-long-random-string
```

## How to use

1. Sign in at `/admin`
2. Add a guest name (and optional organisation)
3. Copy their personalised link, e.g. `/invite/abc123...`
4. Send that link to the guest — they will see their own name on the form
5. Watch responses come in on the admin page (or export CSV)

## Data

Guest and RSVP data is stored locally in `data/store.json` (created automatically).
# invite-form
