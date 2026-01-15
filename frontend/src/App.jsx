import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import './App.css'
import { ROUTES } from './routes'

import Home from './pages/Home'
import ProductDetails from './pages/ProductDetails'
import LogIn from './pages/Login'
import SignUp from "./pages/SignUp";
import TermsPoliciesPage from "./pages/TermsPoliciesPage";
import Notification from "./pages/Notification";
import CompanyProfilePage from "./pages/CompanyProfilePage";
import OrderCheckout from "./pages/OrderCheckout";
import OrdersPage from "./pages/OrdersPage";
import ProductsListPage from "./pages/ProductsListPage";
import OrderCheckoutPageTwo from "./pages/OrderCheckoutPageTwo";
import PaymentPageOne from "./pages/PaymentPageOne";
import OrderTrackingCardPage from "./pages/OrderTrackingCardPage";
import SignupBankInfoFormPage from "./pages/SignupBankInfoFormPage";
import Seller from "./pages/Seller";
import SellerProductsPage from "./pages/SellerProductsPage";
import PublishAdPage from "./pages/PublishAdPage";
import RequestSent from "./pages/RequestSent";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Home />} />
      <Route path={ROUTES.HOME_ALT} element={<Home />} />
      <Route path={`${ROUTES.PRODUCT_DETAILS}/:id`} element={<ProductDetails />} />
      <Route path={`${ROUTES.OFFER_DETAILS}/:id`} element={<ProductDetails />} />
      <Route path={ROUTES.LOGIN} element={<LogIn />} />
      <Route path={ROUTES.SIGNUP} element={<SignUp />} />
      <Route path={ROUTES.TERMS_AND_POLICIES} element={<TermsPoliciesPage />} />
      <Route path={ROUTES.NOTIFICATION} element={<Notification />} />
      <Route path={ROUTES.COMPANY_PROFILE} element={<CompanyProfilePage />} />
      <Route path={ROUTES.ORDER_CHECKOUT} element={<OrderCheckout />} />
      <Route path={ROUTES.ORDERS} element={<OrdersPage />} />
      <Route path={ROUTES.PRODUCTS_LIST} element={<ProductsListPage />} />
      <Route path={ROUTES.ORDER_CHECKOUT_TWO} element={<OrderCheckoutPageTwo />} />
      <Route path={ROUTES.PAYMENT_ONE} element={<PaymentPageOne />} />
      <Route path={`${ROUTES.ORDER_TRACKING}/:id`} element={<OrderTrackingCardPage />} />
      <Route path={ROUTES.SIGNUP_BANK_INFO} element={<SignupBankInfoFormPage />} />
      <Route path={ROUTES.SELLER} element={<Seller />} />
      <Route path={`${ROUTES.SELLER_PRODUCTS}/:sellerId`} element={<SellerProductsPage />} />
      <Route path={ROUTES.PUBLISH_AD} element={<ProtectedRoute allowedRoles={['TRADER']}><PublishAdPage /></ProtectedRoute>} />
      <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
      <Route path={ROUTES.REQUEST_SENT} element={<RequestSent />} />
      <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return <AppContent />;
}

export default App
