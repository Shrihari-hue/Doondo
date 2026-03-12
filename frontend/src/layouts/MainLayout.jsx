import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

const MainLayout = () => (
  <div className="min-h-screen">
    <Navbar />
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <Outlet />
    </main>
  </div>
);

export default MainLayout;
