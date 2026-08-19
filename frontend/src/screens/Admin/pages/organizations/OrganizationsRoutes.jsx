import { Routes, Route } from "react-router-dom";
import { OrganizationsLayout } from "./OrganizationsLayout";
import { OrganizationManagement } from "./OrganizationManagement";

export function OrganizationsRoutes() {
  return (
    <Routes>
      <Route element={<OrganizationsLayout />}>
        <Route index element={<OrganizationManagement />} />
        <Route
          path="farmers"
          element={
            <OrganizationManagement
              fixedType="farm"
              title="Farmers / Farms"
              subtitle="Farms and their farmer accounts registered on BeefTrace."
            />
          }
        />
        <Route path="slaughterhouses" element={<OrganizationManagement />} />
        <Route
          path="processors"
          element={
            <OrganizationManagement
              fixedType="processor"
              title="Processors"
              subtitle="Processing facilities registered on BeefTrace."
            />
          }
        />
        <Route
          path="distributors"
          element={
            <OrganizationManagement
              fixedType="distributor"
              title="Distributors"
              subtitle="Distribution warehouses registered on BeefTrace."
            />
          }
        />
        <Route
          path="other"
          element={
            <OrganizationManagement
              excludeTypes="farm,slaughterhouse,processor,distributor"
              title="Other Organizations"
              subtitle="Transporters, retailers, and any other organization type — excludes farms, slaughterhouses, processors, and distributors."
            />
          }
        />
      </Route>
    </Routes>
  );
}

export default OrganizationsRoutes;