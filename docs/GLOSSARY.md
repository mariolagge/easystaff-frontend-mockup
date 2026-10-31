# GLOSSARY.md — "Match Talents" case study

## Process and business terms

| Term | German | Definition |
|---|---|---|
| Match Talents | Talent-Matching | The process analyzed in this case: it turns a client's staffing request into a confirmed, briefed team of talents. |
| Talent | Talent, Personaldienstleister-Mitarbeiter:in | A flexible worker in easystaff's staff pool who can be booked for an assignment. |
| Client / customer company | Kunde, Kundenunternehmen | The company that requests staff for an event, shop or other assignment. |
| Staffing request / staffing order | Personalanfrage, Auftrag | The client's need for staff: number of people, qualifications, timeframe and location. One request is one case. |
| Case | Fall, Prozessinstanz | One run of the process for one staffing request. |
| Requirements list | Anforderungsliste | Structured version of the staffing request (qualifications, location, timeframe) used by HR. |
| Shortlist / final talents list | Shortlist, Endauswahl | The talents HR proposes to the client for approval. |
| Briefing | Briefing, Einsatzinformation | Job instructions sent to booked talents, and the confirmation sent to the client. |
| Sales | Vertrieb | Department that receives client requests in the As-Is process. |
| HR (Human resources) | Personalabteilung | Department that searches, checks and books talents. |
| Pain point | Schwachstelle, Pain Point | A problem in the current process that costs time, money or quality. The case names three. |
| Trade-off | Zielkonflikt | Improving one dimension costs another; here time, cost and quality improve while flexibility drops slightly. |
| SLA (service level agreement) | Servicelevel, vereinbarte Antwortfrist | An agreed maximum time for a response; in the To-Be process the client approves within 1 working day. |
| Response deadline | Antwortfrist | The time a talent has to accept or decline an offer on the platform (24 h). |
| KPI (key performance indicator) | Kennzahl | A measured value that shows how well the process performs (cycle time, processing time, CTE, cost). |
| Process goal | Prozessziel | A measurable target for the process, e.g. cycle time ≤ 3.5 working days. |

## BPM method terms

| Term | German | Definition |
|---|---|---|
| BPM (Business Process Management) | Geschäftsprozessmanagement | Discipline for identifying, modelling, analyzing, improving and monitoring business processes. |
| BPM lifecycle | BPM-Lebenszyklus | Phases of BPM: identification, discovery, analysis, redesign, implementation, monitoring (Dumas et al., 2018). This case covers discovery to redesign. |
| As-Is process | Ist-Prozess | How the process works today. |
| To-Be process | Soll-Prozess | How the process should work after the redesign. |
| Process discovery | Prozesserhebung | Documenting the current process, usually as an As-Is model. |
| Process analysis | Prozessanalyse | Finding and quantifying issues in the As-Is process. |
| Process redesign | Prozess-Redesign | Changing the process to remove the issues and reach the goals. |
| Redesign heuristic | Redesign-Heuristik | A proven rule of thumb for improving a process (Dumas et al., 2018, Appendix A). |
| Activity elimination | Aktivitätseliminierung | Heuristic: remove steps that add no value for the client (here: Sales handover, manual lists). |
| Case-based work | Fallbezogene Bearbeitung | Heuristic: handle each case as soon as possible instead of in batches or after waiting periods (here: confirmations on the platform). |
| Implementation strategy | Einführungsstrategie | How the change is introduced: pilot, parallel run, full rollout. |
| Pilot | Pilotphase | Trying the new process on a limited number of cases first. |
| Parallel run | Parallelbetrieb | Running old and new process side by side until the new one is reliable. |
| Rollout | Rollout, flächendeckende Einführung | Moving all cases to the new process. |

## BPMN modelling terms

| Term | German | Definition |
|---|---|---|
| BPMN 2.0 | BPMN 2.0 | Business Process Model and Notation, the standard notation for process diagrams. |
| Pool | Pool | A participant in the process, drawn as a large box (easystaff, Talents, Customer company). |
| Lane | Lane, Bahn | A role or department inside a pool (Sales, Human resources). |
| Task | Aufgabe, Task | A single unit of work, drawn as a rounded rectangle (e.g. "Search suitable talents"). |
| Multi-instance task | Mehrfachinstanz-Task | A task repeated for several items in parallel, marked with three bars (e.g. once per position). |
| Start / end event | Start- / Endereignis | Circle that starts or ends the process (here: "Client request received", "Talent matching complete"). |
| Message event | Nachrichtenereignis | Event triggered by sending or receiving a message, drawn with an envelope. |
| Intermediate throw / catch event | Zwischenereignis (sendend / empfangend) | An event in the middle of the process that sends a message or waits for one (e.g. "Response received"). |
| Exclusive gateway (XOR) | Exklusives Gateway (XOR) | Diamond where exactly one path is taken (e.g. "Approval received?" yes/no). |
| Message flow | Nachrichtenfluss | Dashed arrow for communication between pools. |
| Data object | Datenobjekt | A document or list used or produced by a task (e.g. "Requirements list"). |
| SAP Signavio | SAP Signavio | Tool used to create the BPMN models. |

## Quantitative analysis terms

| Term | German | Definition |
|---|---|---|
| Flow analysis | Flussanalyse | Calculating cycle time, processing time and cost of a process from the values of its tasks and the structure of the model. |
| Cycle time (CT) | Durchlaufzeit | Total time from the start to the end of one case, including waiting (As-Is 6.9 working days). |
| Processing time (PT) | Bearbeitungszeit | Time in which someone actually works on the case (As-Is 5.9 h). |
| Waiting time | Wartezeit | Cycle time minus processing time: the case waits for a reply or a free employee. |
| Cycle time efficiency (CTE) | Durchlaufzeiteffizienz | Share of the cycle time that is actual work: PT / CT (As-Is 11 %). |
| Rework | Nacharbeit | Repeating steps because the result was not accepted (the client rejects the shortlist). |
| Rework block | Nacharbeitsblock | Part of the model that may repeat; its time is divided by (1 − r). |
| Rework probability (r) | Nacharbeitswahrscheinlichkeit | Probability that the rework block runs again (As-Is 20 %, To-Be 10 %). |
| Working day | Arbeitstag | 8 working hours. Unit of the flow analysis. |
| Calendar day | Kalendertag | 24 hours including nights and weekends. Unit of the BIMP results. Not comparable with working days. |
| Resource cost per case | Personalkosten pro Fall | Processing time multiplied by the hourly rate of the department (Sales 40 EUR/h, HR 50 EUR/h). |
| pp (percentage point) | Prozentpunkt | Difference between two percentages (11 % → 12 % = +1 pp). |
| Calculated | berechnet | Value from the flow analysis (`kpis.json`). |
| Simulated | simuliert | Value from the BIMP simulation (`simulation_results.json`). |

## Simulation terms

| Term | German | Definition |
|---|---|---|
| Process simulation | Prozesssimulation | Running many virtual cases through the model to see how it behaves under load. |
| BIMP | BIMP | Business process simulator of the University of Tartu, used for the two simulations. |
| Arrival rate / inter-arrival time | Ankunftsrate / Zwischenankunftszeit | How often new cases start (every 4 h = 10 requests per week; every 1 h = 40 requests per week). |
| Resource | Ressource | People who perform tasks in the simulation (Sales, Human resources), with amount and hourly cost. |
| Resource utilization | Ressourcenauslastung | Share of available working time a resource is busy (HR 9 % and 27 %). |
| Duration (BIMP) | Dauer (BIMP) | BIMP's processing time per case, including time waiting for a free employee. |
| Queueing | Warteschlange | Waiting because all employees of a resource are busy. |
| Bottleneck | Engpass | The step or resource that limits the speed of the whole process. Here: external replies, not HR capacity. |
| Timetable | Arbeitszeitmodell | Working hours of a resource in the simulation (Mon–Fri, 09:00–17:00). |

## Systems and technical terms

| Term | German | Definition |
|---|---|---|
| CRM (customer relationship management) | Kundenverwaltungssystem | System for client data; in the As-Is process Sales types requests into it. |
| HRIS (human resources information system) | Personalinformationssystem | System with talent data used for the talent search. |
| Digital platform | Digitale Plattform | The To-Be solution where clients submit requests and approve shortlists, and talents answer availability requests. |
| Mockup | Mockup, Klickprototyp | Clickable frontend without backend that shows the To-Be screens (`SPEC.md`). |
| GDPR | DSGVO | EU General Data Protection Regulation; relevant when personnel data is centralized. |
| GitHub Pages | GitHub Pages | Free static hosting for the mockup. |
| `kpis.json` | – | Single source of truth for all calculated KPIs, including pre-formatted ("rendered") English and German strings. |
| `simulation_results.json` | – | Simulation inputs and results parsed from the two `.bpmn` files. |
| Rendered string | formatierter Wert | A KPI already rounded and formatted with its unit, e.g. "6.9 working days" / "6,9 Arbeitstage". |

