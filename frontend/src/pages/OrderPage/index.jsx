import { useNavigate } from "react-router";
import styles from "./styles.module.css";

export const OrderPage = () => {
  const navigate = useNavigate();

  const createOrder = () => {
    navigate("/order/" + crypto.randomUUID());
  };

  return (
    <button className={styles.button} onClick={createOrder}>
      Make Order
    </button>
  );
};
