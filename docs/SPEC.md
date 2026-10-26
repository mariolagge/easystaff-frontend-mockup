# SPEC.md — Frontend mockup "Match Talents Platform"

## 1. Purpose

The mockup makes the To-Be process tangible. In 60 seconds, a recruiter or interviewer clicks through **one staffing order** from the client's request to the confirmed booking and sees how each screen replaces a manual e-mail step.

Success criterion: a viewer without BPM knowledge can say, after one click-through, *"the client and the talents answer on a platform instead of by e-mail, and HR sees every order's status in one place."*

## 2. Scope

### In scope
- 5 pages: start page + 4 screens (section 5).
- One continuous demo path through all screens with a shared state.
- Client-side validation of the request form.
- The approval decision with both outcomes (approve / request changes).
- A visible "Replaces / Solves" info box on every screen.
- Responsive layout; the talent screen is designed for mobile first.

### Out of scope
- Backend, database, login, real e-mail or push notifications.
- Automated matching algorithm (HR selects talents manually, as in the To-Be model).
- Multiple orders, search, filtering, pagination.
- Real personal data, real client names, the easystaff logo or brand assets.

## 3. Constraints

| # | Constraint |
|---|---|
| C1 | Vanilla HTML, CSS and JavaScript. No framework, no build step, no package manager. |
| C2 | No external requests: no CDNs, web fonts, analytics or images from other domains. Runs offline and on GitHub Pages. |
| C3 | Language of the UI: **English**. |
| C4 | Company name "easystaff" may appear as text. No original logo, colours or screenshots of easystaff. |
| C5 | A banner on every page: **"Concept mockup – no real data"**, linking to the disclaimer on the start page. |
| C6 | All people, clients and addresses are fictional and obviously so (e.g. "Demo Client GmbH"). |
| C7 | No KPI numbers are invented. If the mockup shows impact numbers, copy them from `docs/data/kpis.json` → `rendered.en` (cycle time 6.9 → 3.3 working days, −52 %). |
| C8 | Works in current Chrome, Edge, Firefox and Safari; no console errors. |
| C9 | Accessible: WCAG 2.1 AA contrast, every input has a `<label>`, full keyboard use, visible focus, validation errors announced via `aria-live`. |

## 4. Users and roles

| Role | Device | Goal | Screen |
|---|---|---|---|
| Client (customer company) | Desktop | Order staff quickly; approve the proposed team | 1 Request form, 3 Shortlist approval |
| Talent | Smartphone | Accept or decline a job offer within 24 h | 2 Availability check |
| HR (easystaff) | Desktop | See and move every order forward; no Excel lists | 4 Case dashboard |

A role switcher (top navigation) lets the viewer jump between roles. It is a demo device, not a login.

## 5. Screens

Each screen shows an info box with the BPMN task it replaces and the pain point it solves. Task names follow the To-Be model in `docs/images/to-be-process-model.png`.

### 0. Start page — `index.html`
- Title "Match Talents Platform — concept mockup", the disclaimer (section header), one paragraph on the problem (e-mail process, waiting for replies).
- Button **"Start demo"** → Screen 1. Button **"Reset demo"** → clears the state.
- A 4-step progress overview (Request → Availability → Approval → Booked) that reflects the current state.
- Link back to the GitHub README.

### 1. Staffing request form (Client) — `request.html`

| | |
|---|---|
| Replaces | "Create requirements list" (Sales copies the e-mail into the CRM) |
| Solves | Manual handover, incomplete requirements |
| To-Be tasks | Client submits → HR "Validate requirements list" |

Fields (all required unless marked):

| Field | Type | Validation |
|---|---|---|
| Company | text | prefilled "Demo Client GmbH", editable, not empty |
| Contact e-mail | email | valid e-mail format |
| Service area | select | Promotion, POS, Gastro, Hospitality, Security, Medical, HR |
| Role / job title | text | 3–60 characters |
| Number of staff | number | integer 1–50 |
| Required qualifications | checkbox group | at least one selected |
| Location (city) | text | not empty |
| Start date / end date | date | start ≥ today; end ≥ start |
| Shift start / end | time | end after start |
| Notes | textarea, optional | max. 500 characters |

Behaviour:
- Validate on submit and on blur; show the error next to the field; focus the first invalid field.
- On success: save the request to the state, status → `submitted`, show a confirmation ("Request received. You will receive a proposal on the platform.") and a button to switch to the HR view.

### 2. Availability check (Talent, mobile) — `availability.html`

| | |
|---|---|
| Replaces | "Check availability" + waiting for e-mail replies |
| Solves | Slow confirmation (waiting for replies) |
| To-Be tasks | HR "Request availability" → "Check availability response" |

- Mobile-first card (designed at 360 px width): job title, client, location, date, shift, pay placeholder ("as per contract").
- **Deadline indicator:** "Please answer within 24 h", with the remaining time as text (demo: static "23 h left" or computed from the request timestamp).
- Two large buttons: **Accept** / **Decline**. Decline asks for an optional reason (select).
- A talent picker at the top ("View as: Talent A / B / C …") so one viewer can answer for several demo talents.
- After answering: confirmation state; the answer appears immediately in the HR dashboard.

### 3. Shortlist approval (Client) — `approval.html`

| | |
|---|---|
| Replaces | "Request customer approval" + waiting for the approval e-mail |
| Solves | Slow confirmation |
| To-Be tasks | HR "Request customer approval" → "Check approval decision" |

- List of proposed talents (only those who accepted): name, role, qualifications, one-line profile.
- Deadline indicator: "Please decide within 1 working day".
- Actions: **Approve team** or **Request changes** (with required comment).
- Approve → status `approved`. Request changes → status `changes_requested`; the case returns to HR's talent search (this is the rework loop "Approval received? = NO").

### 4. Case dashboard (HR) — `dashboard.html`

| | |
|---|---|
| Replaces | Talent list, availability list and final talent list in Excel |
| Solves | Manual lists, no transparency |
| To-Be tasks | All HR tasks: Validate requirements list, Search suitable talents, Request availability, Check availability response, Create final talents list, Request customer approval, Check approval decision, Book talents, Send briefings |

- Order header: client, role, number of staff, date, location, current status as a badge.
- Status timeline (section 6) with the current step highlighted.
- Talent table generated from the state: name, qualifications match (yes/no), availability (pending / accepted / declined), selected (checkbox).
- The **next action button** changes with the status, so HR always has exactly one obvious next step:

| Status | Button | Effect |
|---|---|---|
| `submitted` | Validate request | → `validated` |
| `validated` | Request availability (selected talents) | → `availability_requested` |
| `availability_requested` | (waits; shows answers live) | when ≥ required number accepted → enable "Create shortlist" |
| `responses_complete` | Create shortlist & request approval | → `approval_requested` |
| `approved` | Book talents | → `booked` |
| `booked` | Send briefings | → `briefed` (done) |
| `changes_requested` | Search again | → `validated` (rework) |

- Empty state if no request exists: "No open orders. Start the demo as client."

## 6. Status model

```
submitted → validated → availability_requested → responses_complete
          → approval_requested → approved → booked → briefed
                               ↘ changes_requested → validated   (rework loop)
```

Each status maps to one To-Be BPMN task; show the task name as a tooltip or small label in the timeline.

## 7. Data model and state

One object in `localStorage` under the key `matchTalentsDemo`. Wrap every read and write in `try/catch`; if storage is unavailable, keep the state in memory and show a small notice. "Reset demo" deletes the key.

```js
{
  version: 1,
  status: "submitted",
  request: {
    company: "Demo Client GmbH", email: "orders@demo-client.example",
    serviceArea: "Hospitality", role: "Event host", staff: 3,
    qualifications: ["English", "Event experience"], location: "Vienna",
    startDate: "2027-03-12", endDate: "2027-03-12", shiftStart: "17:00", shiftEnd: "23:00",
    notes: "", submittedAt: "ISO timestamp"
  },
  talents: [
    { id: "t1", name: "Talent A (demo)", qualifications: ["English", "Event experience"],
      selected: true, availability: "pending", answeredAt: null, declineReason: null }
  ],
  approval: { decision: null, comment: "", decidedAt: null },
  history: [ { status: "submitted", at: "ISO timestamp" } ]
}
```

- Seed data: 6 fictional talents in `app.js`; some do not match all qualifications, so the HR selection is meaningful.
- Dates in the seed data are examples, not process data.

## 8. File structure

```
mockup/
├─ index.html
├─ request.html
├─ availability.html
├─ approval.html
├─ dashboard.html
├─ css/style.css
└─ js/
   ├─ state.js        load/save/reset, status transitions (single source of truth)
   ├─ seed.js         demo talents and default request
   └─ pages/*.js      one small module per page
```

Rule: status changes happen only through functions in `state.js` (e.g. `transition("approved")`), never by editing the object in a page script. Invalid transitions are ignored and logged to the console.


## 9. Acceptance criteria

- [ ] The full path works in one browser tab: request → validate → request availability → 3 talents accept → shortlist → approve → book → briefings sent.
- [ ] The rework path works: "Request changes" sends the case back to HR, and the timeline shows the loop.
- [ ] The form rejects invalid input with a visible, announced error per field.
- [ ] A talent answer appears in the HR dashboard without manual steps.
- [ ] "Reset demo" returns every page to its initial state.
- [ ] Every screen shows the concept banner and the "Replaces / Solves" box.
- [ ] No external network requests (check the browser's network tab).
- [ ] No console errors; keyboard-only use possible; Lighthouse accessibility score ≥ 90.
- [ ] Usable at 360 px, 768 px and 1280 px width.
- [ ] Works when served from a sub-path on GitHub Pages (relative links only).