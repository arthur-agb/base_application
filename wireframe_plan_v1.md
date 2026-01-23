Part 1: The "Commercial Cockpit" Wireframe
Goal: Prove we can replace Excel/Anaplan. Key Sell: "It looks like Excel, but it thinks like a Supercomputer."
1. The "Global Context" Bar (Sticky Top)
Scenario Selector: A dropdown showing [ LIVE v1 ] vs. [ Arthur's Sandbox ].
The Sell: Shows we handle versioning securely.
The "Impact Ticker": Real-time financial summary.
Total Sales: £45.2m | Net Margin: £12.1m | Var to Budget: -1.2%.
The Sell: Immediate visibility on Profit, not just Sales.
2. The Data Grid (The Engine)
We will use AG Grid (Enterprise Trial or Community) for the demo because it handles grouping natively.
Column A: The Hierarchy Tree (Drill-Down)
Structure: Division > Region > Store Type.
Example: Click > Menswear to expand > High Street to expand > Store 001.
The Sell: Oracle struggled with this granular drill-down. We do it instantly.
Row Groups (The "Drivers"):
Instead of one line per product, every Hierarchy Node expands into 4 rows:
Units (Editable - Black Text)
ASP £ (Editable - Black Text)
Returns % (Editable - Blue Text to signify a Lever)
Net Sales £ (Locked - Grey Text - Calc: Units * ASP * (1-RR))
Time Columns:
Wk 1, Wk 2 ... Wk 5 ... Season Total.
The Sell: "Phasing" is native, not an afterthought.
3. The "Killer" Features (To Demo)
Visual Logic ("The Padlock"):
Put a Padlock Icon next to Season Total.
Action: Click Padlock. Change Week 1 ASP.
Reaction: Week 2-52 ASP automatically adjusts down slightly to keep the Total locked.
The Sell: This is the "Anaplan" feature they think they need to pay £500k for.
Intelligence ("The Traffic Lights"):
If user types Returns % = 5% (when historical average is 40%):
Reaction: Cell turns Bright Red. Tooltip appears: "Warning: Z-Score > 3. Deviation from norm."
The Sell: We are embedding the risk controls directly into the UI.
4. The Audit Panel (Slide-out Right)
A button "View History."
Slides out a panel: "Arthur updated Menswear ASP from £22 to £24. Profit Impact: +£50k. (10 mins ago)."
The Sell: Total accountability.

Part 2: The "Databricks Bridge" (The Safe Connector)
Goal: Prove IT security and stability.
The UI
Safety First: A big toggle switch: Limit Query to 100 Rows (Hard-coded to ON).
Feedback Loop: A console-style log box at the bottom:
> Connecting to adb-xxxx...
> Authentication Successful.
> Fetching Schema...
> Data Received (0.4s).

The 1-Week "Sprint Zero" Execution Plan
This plan is aggressive. It requires focusing only on the happy path (no edge cases).
Monday: The Shell & The Data
Morning: Initialize React App (Vite). Install ag-grid-react and material-ui. Setup the Layout (Sidebar, Top Bar).
Afternoon: Create the mockData.json. Crucial: Don't just make random numbers. Create a hierarchy that makes sense (e.g., London stores selling more than rural ones).
Output: A rendering grid with expandable rows.
Tuesday: The "Spread" Logic (The Hardest Part)
All Day: Write the JavaScript logic for the Grid.
Function: calculateRow(units, asp, rr) -> updates Net Sales.
Function: distributeDelta(total, newValues) -> The "Lock" logic.
Output: You can type numbers, and the totals update.
Wednesday: Visual Polish & Intelligence
Morning: Implement the Conditional Formatting (Red/Green text for Z-Scores).
Afternoon: Build the Audit Sidebar. It doesn't need a database yet; just push changes to a temporary array in state.
Output: The app feels "smart" and safe.
Thursday: The Backend Bridge
Morning: Setup a simple Express.js server (server.js).
Mid-Day: Install @databricks/sql node driver. Implement the connection test route.
Afternoon: Build the Frontend form to call this route.
Output: You can pull live data from the Gold Layer.
Friday: The "Board Ready" Polish
Morning: Merge the two parts. Ensure the "Live Data" button populates the grid (even if just the first 10 rows).
Afternoon: Deployment. Put it in a Docker container or run it on a robust local server.
Output: A flawless demo script.

Immediate Starter Kit: The Dependencies
Here is your package.json setup to get moving right now:
JSON
{
  "name": "next-forecaster-poc",
  "dependencies": {
    "react": "^18.2.0",
    "vite": "^4.0.0",
    "ag-grid-react": "^30.0.0", 
    "ag-grid-community": "^30.0.0",
    "@mui/material": "^5.14.0",
    "@mui/icons-material": "^5.14.0",
    "recharts": "^2.7.0"
  },
  "devDependencies": {
    "express": "^4.18.2",
    "@databricks/sql": "^1.0.0",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5"
  }
}

