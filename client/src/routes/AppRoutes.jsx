import { Route, Routes } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import { AdminRoute, ProtectedRoute } from './ProtectedRoute.jsx';
import Home from '../pages/Home/Home.jsx';
import Login from '../pages/Auth/Login.jsx';
import Signup from '../pages/Auth/Signup.jsx';
import Dashboard from '../pages/Dashboard/Dashboard.jsx';
import ScoresPage from '../pages/Scores/ScoresPage.jsx';
import CharityList from '../pages/Charity/CharityList.jsx';
import CharityDetail from '../pages/Charity/CharityDetail.jsx';
import DrawResults from '../pages/Draw/DrawResults.jsx';
import Subscribe from '../pages/Subscribe/Subscribe.jsx';
import MockCheckout from '../pages/Subscribe/MockCheckout.jsx';
import WinningsPage from '../pages/Winners/WinningsPage.jsx';
import NotFound from '../pages/NotFound.jsx';
import Overview from '../pages/Admin/Overview.jsx';
import AdminUsers from '../pages/Admin/AdminUsers.jsx';
import AdminDraws from '../pages/Admin/AdminDraws.jsx';
import AdminCharities from '../pages/Admin/AdminCharities.jsx';
import AdminWinners from '../pages/Admin/AdminWinners.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="charities" element={<CharityList />} />
        <Route path="charities/:slug" element={<CharityDetail />} />
        <Route path="draws" element={<DrawResults />} />
        <Route path="subscribe" element={<Subscribe />} />

        <Route element={<ProtectedRoute />}>
          <Route path="checkout/mock" element={<MockCheckout />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="scores" element={<ScoresPage />} />
          <Route path="winnings" element={<WinningsPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Overview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="draws" element={<AdminDraws />} />
            <Route path="charities" element={<AdminCharities />} />
            <Route path="winners" element={<AdminWinners />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
