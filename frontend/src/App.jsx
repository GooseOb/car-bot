import { BrowserRouter, Route, Routes } from "react-router";
import { OrderPage } from "./pages/OrderPage";
import { OrderForm } from "./pages/OrderForm";
import "./App.css";

const App = () => {
  return (
    <div className="page">
      <BrowserRouter>
        <Routes>
          <Route path="/order" element={<OrderPage />} />
          <Route path="/order/:id" element={<OrderForm />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
