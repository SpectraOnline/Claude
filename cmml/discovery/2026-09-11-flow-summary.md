# Wispr Flow summary — "Dad's Care App", 11 September 2026

Captured verbatim from the Wispr Flow shared note for reference. Two known errors:
it names Dad as "Yvonne Godfrey" (Dad is Simon; Yvonne is Mum), and its speaker
attribution inherits the recording's unreliable diarisation. Treat the session
notes alongside this file as the corrected record.

Source: https://notes.wisprflow.ai/shared/xS-Vlac2zJGjk48yyV7B7B3BhxssZluTlFPlT-OKPNE

---

Discovery session to scope a personal care-tracking app for Dad (Yvonne Godfrey),
covering CMML journey, transfusions, EPO, medications, appointments and how data
flows in from ManageMyHealth, Apple Health and existing spreadsheets.

### Health Timeline & Data Sources
- Key dates: 1st transfusion 22 Jul, blood test 28 Jul, bone marrow biopsy 4 Aug, blood test 21 Aug, 2 bags + CMML diagnosis 27 Aug
- Next hematology (Lucy Pemberton) 25 Sep; blood test just prior; bloods every 2-3 weeks
- ManageMyHealth is main portal; hematology report only reaches it via GP (Julian Pettit), causing delay

### App Scope & Data Model
- Pull from ManageMyHealth via Apple Health, plus sync with existing Excel spreadsheets (meds, weight, BP)
- Track: haemoglobin, WBC, monocytes, neutrophils, platelets, blasts, kidney function, CRP, PSA, weight, BP, O2
- Separate observation logs for Mum and Dad; AI meeting-record button on phone and laptop; shareable report/link for clinicians
- Care team: Julian Pettit (GP), Lucy Pemberton (haem), Nick Buchan (urologist), Frances Dillon (integrative)

### UX & Access
- Phone + laptop, Gmail login; access for both parents and two daughters; not Jono or Michelle
- Calm warm aesthetic, cream background, ~Arial 12 font, visual charts with adjustable time windows
- Dashboard: next appointment, O2 trend, quick summary; deeper drilldown available; no daily check-in nag
- Hosted online (server + Cloudflare), offline read of cached data

### Open Clinical Questions for 25 Sep
- Max bags per transfusion (2 vs 3) and frequency strategy; ankle swelling noted after 2 bags
- EPO effectiveness review timeline (~6 months) before considering azacitidine
- Metformin dose review pending HbA1c result; weight loss concern

### Next Steps
- (Anna Godfrey Moore) Log into ManageMyHealth and take screenshots of current setup
- (Anna Godfrey Moore) Build app with dashboard, contacts tab, print button, feature-request input, AI record function
- (Anna Godfrey Moore) Investigate pulling ManageMyHealth data via Apple Health sync
- (Anna Godfrey Moore) Look into iCal integration to pull only medical-category events
- (Yvonne Godfrey) Follow up on request for hematology reports to be emailed directly, not just via ManageMyHealth
- (Yvonne Godfrey) Get first Dunedin trip signed off by Lucy for travel allowance (6 trips in 6 months)
- (Yvonne Godfrey) Look into NZ blood cancer support line/group
- (Simon Godfrey) Send updated medications spreadsheet (post-Julian visit, reduced zinc) and share Excel with weight/BP tabs

### Decisions Made
- App accessible to both parents and daughters Sarah and Anna Godfrey Moore; excluded from Jono and Michelle
- Both Mum and Dad get separate observation sections; login via Gmail
- Keep Excel (not Google Sheets) as the source spreadsheet; app syncs with it
- Aesthetic: calm, warm, cream background, ~Arial 12, visual charts over dense text
- Data hosted online on Anna Godfrey Moore's server behind Cloudflare, not device-only
