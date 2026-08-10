import { Routes, Route, useNavigate } from "react-router-dom";
import { DashboardShell } from "../../../../components/DashboardShell";
import { DashHead } from "../../../../../components/DashHead";
import {
  NoteBanner,
  StatCard,
  Panel,
  CareRow,
  ActivityItem,
} from "../../../../../components/DashboardBits";
import { Icon, IconPaths } from "../../../../../components/icons";
import {Reception} from "./AnimalReception"
import {Inspection} from "./AnimalInspection"

// eslint-disable-next-line no-unused-vars
const navItems = [
  {
    label: "Dashboard",
    icon: IconPaths.grid,
    active: true,
    path: "/dashboard/slaughterhouse",
  },
  {
    label: "Animal Reception",
    icon: IconPaths.animal,
    path: "/dashboard/slaughterhouse/reception",
  },
  {
    label: "Animal Inspection",
    icon: IconPaths.check,
    path: "/dashboard/slaughterhouse/animal-inspection",
  },
  {
    label: "Slaughter",
    icon: IconPaths.abattoir,
    path: "/dashboard/slaughterhouse/record-slaughter",
  },
  {
    label: "Carcass Management",
    icon: IconPaths.check,
    path: "/dashboard/slaughterhouse/carcasses-management",
  },
 
  
  {
    label: "Shipments",
    icon: IconPaths.truck,
    path: "/dashboard/slaughterhouse/shipments",
  },
  {
    label: "Reports",
    icon: IconPaths.chart,
    path: "/dashboard/slaughterhouse/reports",
  },
  {
    label: "Traceability lookup",
    icon: IconPaths.search,
    path: "/dashboard/slaughterhouse/traceability",
  },
  {
    label: "Settings",
    icon: IconPaths.gear,
    path: "/dashboard/slaughterhouse/settings",
  },
];

function SlaughterhouseHome() {
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate;
  return (
    <>
      <DashHead
        greeting="Good morning, facility team"
        title="Dashboard"
        subtitle="Intake, inspection and carcass release status for today."
        actions={
          <>
            <button className="btn btn-outline">
              <Icon size={15} style={{ marginRight: 2 }}>
                {IconPaths.qr}
              </Icon>
              Receive animal
            </button>
            <button className="btn btn-primary">
              <Icon size={15} style={{ marginRight: 2 }}>
                {IconPaths.plus}
              </Icon>
              Record slaughter & inspection
            </button>
          </>
        }
      />

      <NoteBanner>
        <b>4 carcasses</b> are awaiting post-mortem inspection before they can
        be released, and <b>1 animal</b> is on hold pending veterinary review.
      </NoteBanner>

      <div className="stat-grid">
        <StatCard
          icon={IconPaths.animal}
          flagText="Received"
          value={12}
          label="Animals received today"
        />
        <StatCard
          icon={IconPaths.check}
          flagText="Awaiting inspection"
          flagType="attn"
          value={4}
          label="Pending post-mortem inspection"
        />
        <StatCard
          icon={IconPaths.abattoir}
          flagText="Ready"
          value={7}
          label="Carcasses ready for dispatch"
        />
        <StatCard
          icon={IconPaths.alert}
          flagText="On hold"
          flagType="attn"
          value={1}
          label="Held / rejected"
        />
      </div>

      <div className="grid-2col">
        <div>
          <Panel
            title="Incoming animals"
            action={
              <a href="#" className="link">
                View all
              </a>
            }
          >
            <CareRow
              id="BT-000198"
              type="From agent AG-000123"
              due="Received 7:40 AM"
              status="ok"
              label="Received"
            />
            <CareRow
              id="BT-000512"
              type="From agent AG-000123"
              due="Received 8:15 AM"
              status="ok"
              label="Received"
            />
            <CareRow
              id="BT-000487"
              type="From farmer F-2026-0061 (direct)"
              due="Received 9:02 AM"
              status="ok"
              label="Received"
            />
          </Panel>

          <Panel
            title="Pending post-mortem inspection"
            action={
              <a href="#" className="link">
                Open inspection queue
              </a>
            }
          >
            <CareRow
              id="CC-000551"
              type="Linked to BT-000198"
              due="Awaiting inspection"
              status="soon"
              label="Queued"
            />
            <CareRow
              id="CC-000552"
              type="Linked to BT-000512"
              due="Awaiting inspection"
              status="soon"
              label="Queued"
            />
            <CareRow
              id="CC-000549"
              type="Linked to BT-000455"
              due="Flagged for veterinary review"
              status="overdue"
              label="On hold"
            />
          </Panel>
        </div>

        <div>
          <Panel
            title="Carcass registry — ready for dispatch"
            action={
              <a href="#" className="link">
                View all
              </a>
            }
          >
            <CareRow
              id="CC-000534"
              type="Halal method · Passed inspection"
              due="Linked to BT-000391"
              status="ok"
              label="Ready"
            />
            <CareRow
              id="CC-000531"
              type="Standard method · Passed inspection"
              due="Linked to BT-000377"
              status="ok"
              label="Ready"
            />
          </Panel>

          <Panel
            title="Recent activity"
            action={
              <a href="#" className="link">
                View all
              </a>
            }
          >
            <ActivityItem
              text={
                <>
                  Slaughter recorded for <b>BT-000198</b> (halal method) —
                  carcass <b>CC-000551</b> created
                </>
              }
              time="Today, 10:05 AM"
            />
            <ActivityItem
              text={
                <>
                  Post-mortem inspection passed for <b>CC-000534</b>
                </>
              }
              time="Today, 9:40 AM"
            />
            <ActivityItem
              text={
                <>
                  <b>CC-000549</b> flagged and held for veterinary review
                </>
              }
              time="Today, 9:12 AM"
            />
          </Panel>
        </div>
      </div>
    </>
  );
}

export function SlaughterhouseDashboard({ onLogout, onToggleTheme }) {
  return (
    <DashboardShell onLogout={onLogout} onToggleTheme={onToggleTheme}>
      <Routes>
        <Route index element={<SlaughterhouseHome />} />
        <Route path = "reception" element = {<Reception/>} />
        <Route path = "inspection" element = {<Inspection/>}/>
        
      </Routes>
    </DashboardShell>
  );
}
